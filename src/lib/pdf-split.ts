/**
 * Splitting PDFs into parts, in the browser. Shared by "Split PDF for AI"
 * (limits-driven) and the general "Split PDF" tool (ranges / every N pages).
 *
 * Three steps, kept separate so the planning logic is pure and unit-tested:
 *   1. analyzePdf  — pdf.js: page count, words per page, text layer, chapters
 *   2. plan*       — pure functions that turn limits into page ranges
 *   3. buildParts  — pdf-lib: writes one PDF per range, and re-splits any part
 *                    that turns out larger than a byte limit
 */

import { CancelledError, throwIfAborted } from "@/lib/files";
import type { PdfDocument } from "@/lib/pdfjs";

export interface PageInfo {
  words: number;
  hasText: boolean;
}

export interface Chapter {
  title: string;
  /** 0-based index of the first page. */
  start: number;
}

export interface PdfAnalysis {
  pages: PageInfo[];
  chapters: Chapter[];
  bytes: number;
}

/** Inclusive, 0-based page range. */
export interface Range {
  from: number;
  to: number;
  label?: string;
}

export interface Limits {
  maxPages?: number;
  maxWords?: number;
  maxBytes?: number;
}

// ---- 1. Analysis ----------------------------------------------------------------

export async function analyzePdf(
  data: ArrayBuffer,
  { signal, onProgress }: { signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {},
): Promise<PdfAnalysis> {
  const { openPdf } = await import("@/lib/pdfjs");
  // pdf.js takes ownership of the buffer it is given; keep the caller's copy.
  const task = await openPdf(data.slice(0));
  try {
    const doc = await task.promise;
    const pages: PageInfo[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      throwIfAborted(signal);
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((it) => ("str" in it ? it.str : "")).join(" ");
      const words = text.split(/\s+/).filter(Boolean).length;
      pages.push({ words, hasText: text.replace(/\s/g, "").length >= 40 });
      page.cleanup();
      onProgress?.(i, doc.numPages);
    }
    const chapters = await readChapters(doc).catch(() => []);
    return { pages, chapters, bytes: data.byteLength };
  } finally {
    await task.destroy();
  }
}

/** Top-level bookmarks that point at a page, in page order. */
async function readChapters(doc: PdfDocument): Promise<Chapter[]> {
  const outline = await doc.getOutline();
  if (!outline?.length) return [];
  const chapters: Chapter[] = [];
  for (const item of outline) {
    try {
      const dest = typeof item.dest === "string" ? await doc.getDestination(item.dest) : item.dest;
      if (!dest?.length) continue;
      const ref = dest[0];
      const index = typeof ref === "number" ? ref : await doc.getPageIndex(ref as { num: number; gen: number });
      chapters.push({ title: item.title.trim() || `Section ${chapters.length + 1}`, start: index });
    } catch {
      // A broken bookmark is skipped, not fatal.
    }
  }
  const seen = new Set<number>();
  return chapters
    .sort((a, b) => a.start - b.start)
    .filter((c) => (seen.has(c.start) ? false : (seen.add(c.start), true)));
}

// ---- 2. Planning (pure) ---------------------------------------------------------

/**
 * Greedy packing of consecutive pages under page/word limits: the fewest parts
 * that respect every limit. A single page over the word limit becomes its own
 * part (a page cannot be split).
 */
export function planByLimits(pages: PageInfo[], limits: Limits, from = 0, to = pages.length - 1): Range[] {
  const ranges: Range[] = [];
  let start = from;
  let words = 0;
  for (let i = from; i <= to; i++) {
    const count = i - start + 1;
    const nextWords = words + pages[i].words;
    const overPages = limits.maxPages !== undefined && count > limits.maxPages;
    const overWords = limits.maxWords !== undefined && nextWords > limits.maxWords;
    if ((overPages || overWords) && i > start) {
      ranges.push({ from: start, to: i - 1 });
      start = i;
      words = pages[i].words;
    } else {
      words = nextWords;
    }
  }
  if (start <= to) ranges.push({ from: start, to });
  return ranges;
}

/**
 * One part per chapter; chapters that break a limit are subdivided, and
 * pages before the first chapter (cover, contents) become their own part.
 */
export function planByChapters(pages: PageInfo[], chapters: Chapter[], limits: Limits): Range[] {
  if (!chapters.length) return planByLimits(pages, limits);
  const bounds = chapters.map((c, i) => ({
    title: c.title,
    from: c.start,
    to: i + 1 < chapters.length ? chapters[i + 1].start - 1 : pages.length - 1,
  }));
  const ranges: Range[] = [];
  if (bounds[0].from > 0) ranges.push({ from: 0, to: bounds[0].from - 1, label: "Front matter" });
  for (const b of bounds) {
    if (b.to < b.from) continue;
    const sub = planByLimits(pages, limits, b.from, b.to);
    sub.forEach((r, i) => ranges.push({ ...r, label: sub.length > 1 ? `${b.title} (${i + 1}/${sub.length})` : b.title }));
  }
  return ranges;
}

/** Every N pages. */
export function planEvery(pageCount: number, n: number): Range[] {
  const size = Math.max(1, Math.floor(n));
  const ranges: Range[] = [];
  for (let from = 0; from < pageCount; from += size) ranges.push({ from, to: Math.min(pageCount - 1, from + size - 1) });
  return ranges;
}

/**
 * Parses "1-3, 5, 8-10" (1-based, as people type it) into ranges.
 * Returns an error message instead of throwing, for inline form feedback.
 */
export function parseRanges(input: string, pageCount: number): { ranges: Range[] } | { error: string } {
  const parts = input.split(/[,;\s]+/).filter(Boolean);
  if (!parts.length) return { error: "Enter at least one page or range, e.g. 1-3, 5" };
  const ranges: Range[] = [];
  for (const part of parts) {
    const m = /^(\d+)(?:-(\d*))?$/.exec(part);
    if (!m) return { error: `“${part}” is not a page or a range` };
    const a = Number(m[1]);
    const b = m[2] === undefined ? a : m[2] === "" ? pageCount : Number(m[2]);
    if (a < 1 || b < 1 || a > pageCount || b > pageCount) return { error: `“${part}” is outside 1–${pageCount}` };
    if (b < a) return { error: `“${part}” goes backwards` };
    ranges.push({ from: a - 1, to: b - 1 });
  }
  return { ranges };
}

export function rangeWords(pages: PageInfo[], r: Range): number {
  let n = 0;
  for (let i = r.from; i <= r.to; i++) n += pages[i].words;
  return n;
}

// ---- 3. Building ----------------------------------------------------------------

export interface BuiltPart {
  range: Range;
  bytes: Uint8Array;
}

/**
 * Writes one PDF per range. If `maxBytes` is set and a part comes out larger,
 * it is split in half and retried, down to single pages (a single page larger
 * than the limit is returned as is and flagged by the caller).
 */
export async function buildParts(
  data: ArrayBuffer,
  ranges: Range[],
  {
    maxBytes,
    signal,
    onProgress,
  }: { maxBytes?: number; signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {},
): Promise<BuiltPart[]> {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(data, { updateMetadata: false });
  const title = src.getTitle();
  const out: BuiltPart[] = [];
  const queue = [...ranges];
  let done = 0;
  let total = ranges.length;

  while (queue.length) {
    throwIfAborted(signal);
    const range = queue.shift()!;
    const part = await PDFDocument.create({ updateMetadata: false });
    const indices = Array.from({ length: range.to - range.from + 1 }, (_, i) => range.from + i);
    const copied = await part.copyPages(src, indices);
    copied.forEach((p) => part.addPage(p));
    if (title) part.setTitle(range.label ? `${title} — ${range.label}` : title);
    part.setProducer("markdownpdf.app");
    part.setCreator("markdownpdf.app");
    const bytes = await part.save({ useObjectStreams: true });

    if (maxBytes && bytes.byteLength > maxBytes && range.to > range.from) {
      const mid = Math.floor((range.from + range.to) / 2);
      queue.unshift({ from: range.from, to: mid, label: range.label }, { from: mid + 1, to: range.to, label: range.label });
      total += 1;
      continue;
    }
    out.push({ range, bytes });
    done++;
    onProgress?.(done, total);
    // Yield so the page stays responsive between parts.
    await new Promise((r) => setTimeout(r, 0));
  }
  return out.sort((a, b) => a.range.from - b.range.from);
}

/** "report-part-02-p51-100.pdf" */
export function partFileName(base: string, index: number, total: number, r: Range): string {
  const pad = String(total).length < 2 ? 2 : String(total).length;
  return `${base}-part-${String(index + 1).padStart(pad, "0")}-p${r.from + 1}-${r.to + 1}.pdf`;
}

export async function zipParts(files: { name: string; bytes: Uint8Array }[]): Promise<Blob> {
  const { zip } = await import("fflate");
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
  // PDFs are already compressed: store them (level 0) instead of deflating again.
  for (const f of files) entries[f.name] = [f.bytes, { level: 0 }];
  const bytes = await new Promise<Uint8Array>((resolve, reject) =>
    zip(entries, (err, data) => (err ? reject(err) : resolve(data))),
  );
  return new Blob([bytes as BlobPart], { type: "application/zip" });
}

export { CancelledError };
