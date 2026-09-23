// Client-side PDF → Markdown (and plain text) conversion.
// Strategy: extract the text layer with pdf.js and rebuild document structure
// (headings, lists, paragraphs, emphasis) from font metrics. Pages without a
// usable text layer (scanned documents) fall back to OCR via Tesseract.js,
// self-hosted and loaded only when the first scanned page is met.

import { CancelledError, throwIfAborted } from "@/lib/files";
import { DEFAULT_OCR_LANGUAGE, createOcrWorker, type OcrLanguage } from "@/lib/ocr";
import { openPdf, type PdfPage } from "@/lib/pdfjs";

export interface ConversionProgress {
  page: number;
  totalPages: number;
  /** "loading_ocr" covers the one-off download of the OCR engine + language. */
  stage: "extracting" | "loading_ocr" | "ocr";
}

export interface ConversionOptions {
  onProgress?: (p: ConversionProgress) => void;
  signal?: AbortSignal;
  /** Language of scanned pages. Ignored for pages that have a text layer. */
  ocrLanguage?: OcrLanguage;
  /**
   * Markdown only: extract embedded images and link them where they appear
   * (images/page-3-1.png). Off by default — it builds each page's operator
   * list, which costs time, and most uses (AI tools) want the text alone.
   */
  extractImages?: boolean;
}

export interface ConversionResult {
  output: string;
  pageCount: number;
  /** Pages that had no text layer and went through OCR. */
  ocrPages: number;
  /** Extracted images, referenced from the Markdown as images/<name>. */
  images: { name: string; blob: Blob }[];
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
  /** An extracted image placed at this height instead of text. */
  image?: string;
}

const OCR_TEXT_THRESHOLD = 40; // chars per page below which we assume a scanned page
const OCR_RENDER_SCALE = 2;

export function convertPdfToMarkdown(file: File, options: ConversionOptions = {}): Promise<ConversionResult> {
  return convertPdf(file, options, "markdown");
}

export function convertPdfToText(file: File, options: ConversionOptions = {}): Promise<ConversionResult> {
  return convertPdf(file, options, "text");
}

/** Rejects as soon as the signal aborts, even if `promise` never settles. */
function raceAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new CancelledError());
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      },
    );
  });
}

async function convertPdf(
  file: File,
  { onProgress, signal, ocrLanguage = DEFAULT_OCR_LANGUAGE, extractImages = false }: ConversionOptions,
  mode: "markdown" | "text",
): Promise<ConversionResult> {
  throwIfAborted(signal);
  const data = await file.arrayBuffer();
  const loadingTask = await openPdf(data);
  let ocrWorker: import("tesseract.js").Worker | null = null;
  // Terminating the worker is the only way to stop a recognition in flight.
  const stopOcr = () => void ocrWorker?.terminate();
  signal?.addEventListener("abort", stopOcr, { once: true });

  try {
    const doc = await raceAbort(loadingTask.promise, signal);
    const pages: string[] = [];
    let ocrPages = 0;
    const images: { name: string; blob: Blob }[] = [];
    const seenImages = new Set<string>();

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      throwIfAborted(signal);
      onProgress?.({ page: pageNum, totalPages: doc.numPages, stage: "extracting" });
      const page = await doc.getPage(pageNum);
      const lines = await extractLines(page);
      const textLength = lines.reduce(
        (sum, l) => sum + l.runs.reduce((s, r) => s + r.text.trim().length, 0),
        0,
      );

      if (textLength < OCR_TEXT_THRESHOLD) {
        if (!ocrWorker) {
          onProgress?.({ page: pageNum, totalPages: doc.numPages, stage: "loading_ocr" });
          ocrWorker = await raceAbort(createOcrWorker(ocrLanguage), signal);
        }
        onProgress?.({ page: pageNum, totalPages: doc.numPages, stage: "ocr" });
        pages.push(await raceAbort(ocrPage(page, ocrWorker), signal));
        ocrPages++;
      } else {
        if (mode === "markdown" && extractImages) {
          const { extractPageImages } = await import("@/lib/pdf-page-images");
          const found = await raceAbort(extractPageImages(page), signal);
          let k = 0;
          for (const img of found) {
            // An image repeated across pages (logo, letterhead) is kept once.
            if (seenImages.has(img.fingerprint)) continue;
            seenImages.add(img.fingerprint);
            const name = `page-${pageNum}-${++k}.${img.ext}`;
            images.push({ name, blob: img.blob });
            lines.push({ runs: [], y: img.top, x: 0, size: 0, image: name });
          }
          lines.sort((a, b) => b.y - a.y);
        }
        pages.push(mode === "markdown" ? linesToMarkdown(lines) : linesToText(lines));
      }
      page.cleanup();
    }

    const output = pages
      .map((m) => m.trim())
      .filter(Boolean)
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n");
    return { output: output ? output + "\n" : "", pageCount: doc.numPages, ocrPages, images };
  } finally {
    signal?.removeEventListener("abort", stopOcr);
    await ocrWorker?.terminate().catch(() => {});
    await loadingTask.destroy();
  }
}

type PDFPageProxy = PdfPage;

interface FontStyle {
  bold: boolean;
  italic: boolean;
}

const BOLD_RE = /bold|black|heavy|semibold|demi/;
const ITALIC_RE = /italic|oblique/;

/**
 * Real font names, for bold/italic detection.
 *
 * pdf.js (v4+) only exposes a generic fallback family ("sans-serif") in
 * getTextContent().styles, and item.fontName is an internal id ("g_d0_f2").
 * Until 2026-09-18 this code matched /bold/ against those two strings, so it
 * never detected any emphasis. The actual name ("ABCDEF+Arial-BoldMT") only
 * becomes available in commonObjs once the page's operator list is built.
 *
 * Building it costs ~35% extra on text extraction (measured: 651 -> 889 ms for
 * 300 pages), so it is only done when the page mixes several fonts — a page in
 * a single font has no emphasis to find.
 */
type FontInfo = { name?: string; bold?: boolean; black?: boolean; italic?: boolean };

/**
 * In the browser a font lands in commonObjs only once it is fully set up, which
 * can be after getOperatorList() resolves — reading it synchronously randomly
 * missed fonts (italics were lost in Chromium, never in Node). Wait for it,
 * with a ceiling so a broken font can never stall a conversion.
 */
function resolvedFont(page: PDFPageProxy, id: string): Promise<FontInfo | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 2000);
    try {
      page.commonObjs.get(id, (data: unknown) => {
        clearTimeout(timer);
        resolve((data as FontInfo) ?? null);
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

async function fontStyles(page: PDFPageProxy, fontIds: Set<string>): Promise<Map<string, FontStyle>> {
  const styles = new Map<string, FontStyle>();
  if (fontIds.size < 2) return styles;
  try {
    await page.getOperatorList();
    for (const id of fontIds) {
      const font = await resolvedFont(page, id);
      if (!font) continue;
      const name = String(font.name ?? "").toLowerCase();
      styles.set(id, {
        bold: Boolean(font?.bold || font?.black) || BOLD_RE.test(name),
        italic: Boolean(font?.italic) || ITALIC_RE.test(name),
      });
    }
  } catch {
    // Emphasis is a nicety; never fail a conversion over it.
  }
  return styles;
}

async function extractLines(page: PDFPageProxy): Promise<Line[]> {
  const content = await page.getTextContent();
  const runs: TextRun[] = [];
  const fontIds = new Set<string>();
  for (const item of content.items) if ("str" in item && item.str.trim()) fontIds.add(item.fontName);
  const styles = await fontStyles(page, fontIds);

  for (const item of content.items) {
    if (!("str" in item) || !item.str) continue;
    const style = styles.get(item.fontName);
    runs.push({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
      size: Math.hypot(item.transform[2], item.transform[3]),
      bold: style?.bold ?? false,
      italic: style?.italic ?? false,
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
    if (line.image) {
      flush();
      blocks.push(`![](images/${line.image})`);
      prevLine = null;
      continue;
    }
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

function plainLineText(line: Line): string {
  let out = "";
  for (let i = 0; i < line.runs.length; i++) out += joinGap(line.runs, i) + line.runs[i].text;
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Plain text keeps the reading order and paragraph breaks, joins lines that
 * were wrapped by the layout, and de-hyphenates — but adds no Markdown syntax.
 * Headings and list items stay on their own line so the text remains scannable.
 */
function linesToText(lines: Line[]): string {
  const body = bodyFontSize(lines);
  const blocks: string[] = [];
  let paragraph = "";
  let prevLine: Line | null = null;
  const flush = () => {
    if (paragraph.trim()) blocks.push(paragraph.trim());
    paragraph = "";
  };

  for (const line of lines) {
    const text = plainLineText(line);
    if (!text) continue;
    const standalone =
      (line.size / body >= 1.15 && text.length < 120) || BULLET_RE.test(text) || ORDERED_RE.test(text);
    if (standalone) {
      flush();
      blocks.push(text);
      prevLine = line;
      continue;
    }
    const gap = prevLine ? prevLine.y - line.y : 0;
    if (!prevLine || gap > line.size * 1.7) flush();
    if (paragraph) paragraph = paragraph.endsWith("-") ? paragraph.slice(0, -1) + text : paragraph + " " + text;
    else paragraph = text;
    prevLine = line;
  }
  flush();
  return blocks.join("\n\n");
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
