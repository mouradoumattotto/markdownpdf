/**
 * True redaction, in the browser.
 *
 * Drawing a black rectangle over text in a PDF editor usually leaves the text
 * itself in the file: select, copy, paste, and it is back. Here every page that
 * has at least one box is re-rendered by pdf.js to pixels, the boxes are
 * painted onto those pixels, and the page is replaced by a page holding only
 * that image. Nothing of the original page — text, fonts, vector paths,
 * annotations, form fields — survives. Pages without boxes are copied as they
 * are, so they keep their selectable text.
 *
 *   searchPdf      finds text (plain, regex, emails, phone numbers) and returns
 *                  boxes in page coordinates
 *   redactPdf      renders, paints, re-assembles
 *
 * Coordinates: a Rect is in PDF points on the page as displayed — origin top
 * left, rotation and crop box applied — i.e. pdf.js's viewport at scale 1.
 */

import { throwIfAborted } from "@/lib/files";
import type { ImageFormat } from "@/lib/pdf-images";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RedactionBox {
  id: string;
  pageIndex: number;
  rect: Rect;
  source: "search" | "manual";
  /** The matched text, for search boxes. */
  text?: string;
}

export interface PageSize {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Patterns

export type SearchMode = "text" | "regex" | "email" | "phone";

export interface SearchOptions {
  mode: SearchMode;
  query?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

const EMAIL = String.raw`[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,}`;
// Deliberately loose; candidates are then kept only with 7–15 digits.
const PHONE = String.raw`(?:\+|\b00)?\(?\d[\d\s().\-/]{5,20}\d`;
const WORD_CHAR = String.raw`[\p{L}\p{N}_]`;

/** Builds the RegExp for a search, or explains why it cannot. */
export function buildPattern(options: SearchOptions): { regex: RegExp } | { error: string } {
  const flags = `gu${options.caseSensitive ? "" : "i"}`;
  let source: string;
  switch (options.mode) {
    case "email":
      source = EMAIL;
      break;
    case "phone":
      source = PHONE;
      break;
    case "text": {
      const q = (options.query ?? "").trim();
      if (!q) return { error: "Type the text to find" };
      // Any run of spaces in the query matches any run of spaces in the PDF.
      source = q
        .split(/\s+/)
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(String.raw`\s+`);
      break;
    }
    case "regex": {
      const q = options.query ?? "";
      if (!q) return { error: "Type a regular expression" };
      source = q;
      break;
    }
  }
  if (options.wholeWord && (options.mode === "text" || options.mode === "regex")) {
    source = `(?<!${WORD_CHAR})(?:${source})(?!${WORD_CHAR})`;
  }
  try {
    return { regex: new RegExp(source, flags) };
  } catch (err) {
    return { error: `Invalid regular expression: ${(err as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// Matching text items

export interface TextItemLike {
  str: string;
  hasEOL?: boolean;
}

export interface Segment {
  /** Index into the items array. */
  item: number;
  /** Character range within that item's str. */
  from: number;
  to: number;
}

export interface TextMatch {
  text: string;
  segments: Segment[];
}

/** Hard ceiling so a regex like `.` on a 500-page book cannot freeze the tab. */
export const MAX_MATCHES = 5000;

/**
 * Joins a page's text items into one string (a newline after items that end a
 * line) and runs the pattern over it, so a match can span several items — pdf.js
 * often splits a single word or a phone number across items.
 */
export function findMatches(items: TextItemLike[], regex: RegExp, mode: SearchMode = "text", limit = MAX_MATCHES): TextMatch[] {
  let text = "";
  const starts: number[] = [];
  for (const it of items) {
    starts.push(text.length);
    text += it.str;
    if (it.hasEOL) text += "\n";
  }

  const out: TextMatch[] = [];
  const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && out.length < limit) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    let start = m.index;
    let end = start + m[0].length;
    // Trim surrounding whitespace so a box never covers the gap beside a word.
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    if (start === end) continue;
    const matched = text.slice(start, end);
    if (mode === "phone") {
      const digits = matched.replace(/\D/g, "").length;
      if (digits < 7 || digits > 15) continue;
    }

    const segments: Segment[] = [];
    for (let i = 0; i < items.length; i++) {
      const s = starts[i];
      const e = s + items[i].str.length;
      const from = Math.max(start, s);
      const to = Math.min(end, e);
      if (to > from) segments.push({ item: i, from: from - s, to: to - s });
    }
    if (segments.length) out.push({ text: matched, segments });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Geometry

type Matrix = [number, number, number, number, number, number];
type Point = [number, number];

/**
 * The four corners, in PDF user space, of characters [from, to) of a text item.
 *
 * pdf.js gives each item a transform (a, b, c, d, e, f): (e, f) is the baseline
 * origin, (a, b) the text direction scaled by the font size, (c, d) the "up"
 * direction scaled by the font size, and `width` the advance along the text
 * direction in user units. Character offsets are approximated proportionally —
 * exact per-glyph widths are not exposed — so the box is padded a little.
 */
export function itemQuad(transform: number[], width: number, from: number, to: number, length: number): Point[] {
  const [a, b, c, d, e, f] = transform as Matrix;
  const dirLen = Math.hypot(a, b) || 1;
  const ux = a / dirLen;
  const uy = b / dirLen;
  const n = Math.max(1, length);
  // Half a character of slack either side, capped by the item's extent.
  const charW = width / n;
  const s = Math.max(0, (from / n) * width - charW * 0.15);
  const t = Math.min(width, (to / n) * width + charW * 0.15);
  // Below the baseline for descenders, above for ascenders and accents.
  const lo = -0.28;
  const hi = 1.0;
  const corner = (along: number, up: number): Point => [e + ux * along + c * up, f + uy * along + d * up];
  return [corner(s, lo), corner(t, lo), corner(t, hi), corner(s, hi)];
}

export function boundingRect(points: Point[]): Rect {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Clamps a rect to the page and drops ones with no area left. */
export function clampRect(r: Rect, page: PageSize): Rect | null {
  const x1 = Math.max(0, Math.min(r.x, r.x + r.width));
  const y1 = Math.max(0, Math.min(r.y, r.y + r.height));
  const x2 = Math.min(page.width, Math.max(r.x, r.x + r.width));
  const y2 = Math.min(page.height, Math.max(r.y, r.y + r.height));
  if (x2 - x1 < 0.5 || y2 - y1 < 0.5) return null;
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

/** A rect in page points → a pixel rect on a canvas rendered at `scale`, grown outward to whole pixels. */
export function toPixels(r: Rect, scale: number, pad = 1): { x: number; y: number; width: number; height: number } {
  const x = Math.floor(r.x * scale) - pad;
  const y = Math.floor(r.y * scale) - pad;
  const x2 = Math.ceil((r.x + r.width) * scale) + pad;
  const y2 = Math.ceil((r.y + r.height) * scale) + pad;
  return { x, y, width: x2 - x, height: y2 - y };
}

let nextId = 1;
const newId = () => `b${nextId++}`;

export function manualBox(pageIndex: number, rect: Rect): RedactionBox {
  return { id: newId(), pageIndex, rect, source: "manual" };
}

// ---------------------------------------------------------------------------
// Search

export interface SearchResult {
  boxes: RedactionBox[];
  matches: number;
  /** Pages with no text layer at all — likely scans the search cannot see. */
  pagesWithoutText: number[];
  truncated: boolean;
}

export async function searchPdf(
  data: ArrayBuffer,
  options: SearchOptions,
  { signal, onPage }: { signal?: AbortSignal; onPage?: (done: number, total: number) => void } = {},
): Promise<SearchResult> {
  const built = buildPattern(options);
  if ("error" in built) throw new Error(built.error);
  const { openPdf } = await import("@/lib/pdfjs");
  const task = await openPdf(data.slice(0));
  const result: SearchResult = { boxes: [], matches: 0, pagesWithoutText: [], truncated: false };
  try {
    const doc = await task.promise;
    for (let p = 0; p < doc.numPages; p++) {
      throwIfAborted(signal);
      const page = await doc.getPage(p + 1);
      const viewport = page.getViewport({ scale: 1 });
      const size = { width: viewport.width, height: viewport.height };
      const content = await page.getTextContent();
      const items = content.items.filter((it): it is Extract<typeof it, { str: string }> => "str" in it);
      if (!items.some((it) => it.str.trim())) result.pagesWithoutText.push(p);

      const remaining = MAX_MATCHES - result.matches;
      const matches = findMatches(items, built.regex, options.mode, remaining);
      if (matches.length >= remaining) result.truncated = true;
      for (const m of matches) {
        result.matches++;
        for (const seg of m.segments) {
          const it = items[seg.item];
          const quad = itemQuad(it.transform, it.width, seg.from, seg.to, it.str.length).map(
            (pt) => viewport.convertToViewportPoint(pt[0], pt[1]) as Point,
          );
          const rect = clampRect(boundingRect(quad), size);
          if (rect) result.boxes.push({ id: newId(), pageIndex: p, rect, source: "search", text: m.text });
        }
      }
      page.cleanup();
      onPage?.(p + 1, doc.numPages);
      if (result.truncated) break;
    }
  } finally {
    await task.destroy();
  }
  return result;
}

// ---------------------------------------------------------------------------
// Apply

export interface RasterPage {
  bytes: Uint8Array;
  format: ImageFormat;
  /** Page size in points, as displayed (rotation applied). */
  width: number;
  height: number;
}

/**
 * Builds the output: original pages copied untouched, redacted pages replaced
 * by their image. A fresh document is assembled rather than the original being
 * edited, so nothing document-level comes along — no Info dictionary, no XMP,
 * no bookmarks (which can quote redacted headings), no attachments, no
 * JavaScript, no AcroForm.
 */
export async function assembleRedactedPdf(data: ArrayBuffer, raster: Map<number, RasterPage>): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(data, { updateMetadata: false });
  const out = await PDFDocument.create({ updateMetadata: false });
  const count = src.getPageCount();
  const keep = Array.from({ length: count }, (_, i) => i).filter((i) => !raster.has(i));
  const copied = keep.length ? await out.copyPages(src, keep) : [];
  const copiedAt = new Map(keep.map((i, k) => [i, copied[k]]));

  for (let i = 0; i < count; i++) {
    const r = raster.get(i);
    if (!r) {
      out.addPage(copiedAt.get(i)!);
      continue;
    }
    const image = r.format === "png" ? await out.embedPng(r.bytes) : await out.embedJpg(r.bytes);
    const page = out.addPage([r.width, r.height]);
    page.drawImage(image, { x: 0, y: 0, width: r.width, height: r.height });
  }
  return out.save({ useObjectStreams: true });
}

export interface RedactOptions {
  dpi?: number;
  format?: ImageFormat;
  quality?: number;
  signal?: AbortSignal;
  onPage?: (done: number, total: number) => void;
}

export async function redactPdf(data: ArrayBuffer, boxes: RedactionBox[], options: RedactOptions = {}): Promise<Uint8Array> {
  const { dpi = 200, format = "jpeg", quality = 0.92, signal, onPage } = options;
  const byPage = new Map<number, Rect[]>();
  for (const b of boxes) byPage.set(b.pageIndex, [...(byPage.get(b.pageIndex) ?? []), b.rect]);
  const pages = [...byPage.keys()].sort((a, b) => a - b);

  const [{ openPdf }, { renderScale }] = await Promise.all([import("@/lib/pdfjs"), import("@/lib/pdf-images")]);
  const task = await openPdf(data.slice(0));
  const raster = new Map<number, RasterPage>();
  try {
    const doc = await task.promise;
    for (const [k, p] of pages.entries()) {
      throwIfAborted(signal);
      const page = await doc.getPage(p + 1);
      const base = page.getViewport({ scale: 1 });
      const { scale } = renderScale(base.width, base.height, dpi);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create a canvas");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, canvas, viewport }).promise;
      ctx.fillStyle = "#000000";
      for (const r of byPage.get(p)!) {
        const px = toPixels(r, scale);
        ctx.fillRect(px.x, px.y, px.width, px.height);
      }
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("The browser could not encode this page as an image"))),
          `image/${format}`,
          quality,
        ),
      );
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
      raster.set(p, { bytes: new Uint8Array(await blob.arrayBuffer()), format, width: base.width, height: base.height });
      onPage?.(k + 1, pages.length);
    }
  } finally {
    await task.destroy();
  }
  throwIfAborted(signal);
  return assembleRedactedPdf(data, raster);
}

/** Page sizes (as displayed) and count, for the preview overlay. */
export async function readPageSizes(data: ArrayBuffer): Promise<PageSize[]> {
  const { openPdf } = await import("@/lib/pdfjs");
  const task = await openPdf(data.slice(0));
  try {
    const doc = await task.promise;
    const sizes: PageSize[] = [];
    for (let p = 0; p < doc.numPages; p++) {
      const page = await doc.getPage(p + 1);
      const v = page.getViewport({ scale: 1 });
      sizes.push({ width: v.width, height: v.height });
      page.cleanup();
    }
    return sizes;
  } finally {
    await task.destroy();
  }
}
