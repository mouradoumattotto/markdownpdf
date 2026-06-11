// Client-side PDF → Markdown conversion.
// Strategy: extract the text layer with pdf.js and rebuild document structure
// (headings, lists, paragraphs, emphasis) from font metrics. Pages without a
// usable text layer (scanned documents) fall back to OCR via Tesseract.js.

export interface ConversionProgress {
  page: number;
  totalPages: number;
  stage: "extracting" | "ocr";
}

interface TextRun {
  text: string;
  x: number;
  y: number;
  size: number;
  bold: boolean;
  italic: boolean;
}

interface Line {
  runs: TextRun[];
  y: number;
  x: number;
  size: number;
}

const OCR_TEXT_THRESHOLD = 40; // chars per page below which we assume a scanned page
const OCR_RENDER_SCALE = 2;

export async function convertPdfToMarkdown(
  file: File,
  onProgress?: (p: ConversionProgress) => void,
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;

  const pageMarkdowns: string[] = [];
  let ocrWorker: import("tesseract.js").Worker | null = null;

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      onProgress?.({ page: pageNum, totalPages: doc.numPages, stage: "extracting" });
      const page = await doc.getPage(pageNum);
      const lines = await extractLines(page);
      const textLength = lines.reduce(
        (sum, l) => sum + l.runs.reduce((s, r) => s + r.text.trim().length, 0),
        0,
      );

      if (textLength < OCR_TEXT_THRESHOLD) {
        onProgress?.({ page: pageNum, totalPages: doc.numPages, stage: "ocr" });
        if (!ocrWorker) {
          const { createWorker } = await import("tesseract.js");
          ocrWorker = await createWorker("eng");
        }
        pageMarkdowns.push(await ocrPage(page, ocrWorker));
      } else {
        pageMarkdowns.push(linesToMarkdown(lines));
      }
      page.cleanup();
    }
  } finally {
    await ocrWorker?.terminate();
    await loadingTask.destroy();
  }

  return pageMarkdowns
    .map((m) => m.trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .concat("\n");
}

type PDFPageProxy = Awaited<
  ReturnType<Awaited<ReturnType<typeof import("pdfjs-dist").getDocument>["promise"]>["getPage"]>
>;

async function extractLines(page: PDFPageProxy): Promise<Line[]> {
  const content = await page.getTextContent();
  const runs: TextRun[] = [];

  for (const item of content.items) {
    if (!("str" in item) || !item.str) continue;
    const fontName = (content.styles[item.fontName]?.fontFamily ?? item.fontName ?? "").toLowerCase();
    const rawFont = (item.fontName ?? "").toLowerCase();
    runs.push({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
      size: Math.hypot(item.transform[2], item.transform[3]),
      bold: /bold|black|heavy/.test(fontName) || /bold|black|heavy/.test(rawFont),
      italic: /italic|oblique/.test(fontName) || /italic|oblique/.test(rawFont),
    });
  }

  // Group runs into lines by vertical position (PDF y grows upward).
  runs.sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Line[] = [];
  for (const run of runs) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - run.y) < Math.max(2, last.size * 0.35)) {
      last.runs.push(run);
    } else {
      lines.push({ runs: [run], y: run.y, x: run.x, size: run.size });
    }
  }
  for (const line of lines) {
    line.runs.sort((a, b) => a.x - b.x);
    line.x = line.runs[0].x;
    line.size = Math.max(...line.runs.map((r) => r.size));
  }
  return lines.filter((l) => l.runs.some((r) => r.text.trim()));
}

function bodyFontSize(lines: Line[]): number {
  const weights = new Map<number, number>();
  for (const line of lines) {
    for (const run of line.runs) {
      const size = Math.round(run.size * 2) / 2;
      weights.set(size, (weights.get(size) ?? 0) + run.text.length);
    }
  }
  let best = 12;
  let bestWeight = 0;
  for (const [size, weight] of weights) {
    if (weight > bestWeight) {
      best = size;
      bestWeight = weight;
    }
  }
  return best;
}

function lineText(line: Line): string {
  // Re-emit runs, wrapping contiguous bold/italic spans in markdown emphasis.
  let out = "";
  let i = 0;
  while (i < line.runs.length) {
    const run = line.runs[i];
    if (run.bold || run.italic) {
      const marker = run.bold && run.italic ? "***" : run.bold ? "**" : "*";
      let span = "";
      while (i < line.runs.length && line.runs[i].bold === run.bold && line.runs[i].italic === run.italic) {
        span += joinGap(line.runs, i) + line.runs[i].text;
        i++;
      }
      const trimmed = span.trim();
      if (trimmed) {
        out += (span.startsWith(" ") || out === "" ? (out ? " " : "") : "") + marker + trimmed + marker;
        if (span.endsWith(" ")) out += " ";
      }
    } else {
      out += joinGap(line.runs, i) + run.text;
      i++;
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

function joinGap(runs: TextRun[], index: number): string {
  if (index === 0) return "";
  const prev = runs[index - 1];
  const cur = runs[index];
  const prevEnd = prev.x + prev.text.length * prev.size * 0.5; // rough advance estimate
  return cur.x - prevEnd > prev.size * 0.2 ? " " : "";
}

const BULLET_RE = /^\s*[•◦▪‣·∙–-]\s+/;
const ORDERED_RE = /^\s*(\d{1,3})[.)]\s+/;

function linesToMarkdown(lines: Line[]): string {
  const body = bodyFontSize(lines);
  const blocks: string[] = [];
  let paragraph = "";
  let prevLine: Line | null = null;

  const flush = () => {
    if (paragraph.trim()) blocks.push(paragraph.trim());
    paragraph = "";
  };

  for (const line of lines) {
    const text = lineText(line);
    if (!text) continue;

    const ratio = line.size / body;
    const allBold = line.runs.every((r) => r.bold || !r.text.trim());
    const isHeading =
      text.length < 120 &&
      !BULLET_RE.test(text) &&
      !ORDERED_RE.test(text) &&
      (ratio >= 1.15 || (allBold && ratio >= 1.02 && text.length < 80));

    if (isHeading) {
      flush();
      const level = ratio >= 1.7 ? 1 : ratio >= 1.4 ? 2 : 3;
      blocks.push(`${"#".repeat(level)} ${stripEmphasis(text)}`);
      prevLine = line;
      continue;
    }

    const bulletMatch = text.match(BULLET_RE);
    const orderedMatch = text.match(ORDERED_RE);
    if (bulletMatch) {
      flush();
      blocks.push(`- ${text.slice(bulletMatch[0].length)}`);
      prevLine = line;
      continue;
    }
    if (orderedMatch) {
      flush();
      blocks.push(`${orderedMatch[1]}. ${text.slice(orderedMatch[0].length)}`);
      prevLine = line;
      continue;
    }

    // Paragraph continuation vs. new paragraph: a large vertical gap starts a new one.
    const gap = prevLine ? prevLine.y - line.y : 0;
    const newParagraph = !prevLine || gap > line.size * 1.7;
    if (newParagraph) flush();

    if (paragraph) {
      if (paragraph.endsWith("-")) {
        paragraph = paragraph.slice(0, -1) + text; // de-hyphenate wrapped words
      } else {
        paragraph += " " + text;
      }
    } else {
      paragraph = text;
    }
    prevLine = line;
  }
  flush();

  return mergeAdjacentListItems(blocks).join("\n\n");
}

function stripEmphasis(text: string): string {
  return text.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");
}

function mergeAdjacentListItems(blocks: string[]): string[] {
  // Consecutive list-item blocks become a single tight list.
  const out: string[] = [];
  for (const block of blocks) {
    const isItem = /^(-|\d{1,3}\.)\s/.test(block);
    const prev = out[out.length - 1];
    if (isItem && prev && /^(-|\d{1,3}\.)\s/m.test(prev.split("\n").pop() ?? "")) {
      out[out.length - 1] = prev + "\n" + block;
    } else {
      out.push(block);
    }
  }
  return out;
}

async function ocrPage(
  page: PDFPageProxy,
  worker: import("tesseract.js").Worker,
): Promise<string> {
  const viewport = page.getViewport({ scale: OCR_RENDER_SCALE });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context for OCR");

  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  const { data } = await worker.recognize(canvas);
  canvas.width = 0;
  canvas.height = 0;

  // OCR output has hard line breaks; collapse single breaks into paragraphs.
  return data.text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/-\n(\w)/g, "$1").replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}
