/**
 * PDF ⇄ images, in the browser.
 *
 *   pdfToImages   pdf.js renders each page to a canvas, encoded as JPEG or PNG
 *   imagesToPdf   pdf-lib places one image per page; JPEGs are embedded as
 *                 they are (no re-compression) unless they need rotating
 *   renderThumbnail small page previews for the page organiser
 */

import { throwIfAborted } from "@/lib/files";
import type { PdfPage } from "@/lib/pdfjs";

export type ImageFormat = "jpeg" | "png";

/**
 * Browsers refuse canvases beyond roughly 16k pixels a side or ~268 MP in
 * total (lower on mobile). Staying well under keeps a huge poster-size page
 * from failing silently: its resolution is reduced instead, and reported.
 */
const MAX_CANVAS_SIDE = 12_000;
const MAX_CANVAS_PIXELS = 60_000_000;

export interface RenderedImage {
  pageIndex: number;
  blob: Blob;
  width: number;
  height: number;
  /** True when the requested resolution was lowered to fit browser limits. */
  reduced: boolean;
}

/** The scale to render a page at for a given dpi, capped to what a canvas can hold. */
export function renderScale(widthPt: number, heightPt: number, dpi: number): { scale: number; reduced: boolean } {
  const wanted = dpi / 72;
  const side = Math.min(MAX_CANVAS_SIDE / widthPt, MAX_CANVAS_SIDE / heightPt);
  const area = Math.sqrt(MAX_CANVAS_PIXELS / (widthPt * heightPt));
  const scale = Math.min(wanted, side, area);
  return { scale, reduced: scale < wanted - 1e-9 };
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("The browser could not encode this page as an image"))),
      `image/${format}`,
      quality,
    ),
  );
}

export async function renderPage(
  page: PdfPage,
  { dpi, format, quality = 0.9 }: { dpi: number; format: ImageFormat; quality?: number },
): Promise<Omit<RenderedImage, "pageIndex">> {
  const base = page.getViewport({ scale: 1 });
  const { scale, reduced } = renderScale(base.width, base.height, dpi);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a canvas");
  // PDF pages have no background; JPEG has no transparency and would turn it black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  const blob = await canvasToBlob(canvas, format, quality);
  const { width, height } = canvas;
  canvas.width = 0;
  canvas.height = 0;
  return { blob, width, height, reduced };
}

export async function pdfToImages(
  data: ArrayBuffer,
  pageIndices: number[],
  {
    dpi,
    format,
    quality,
    signal,
    onImage,
  }: {
    dpi: number;
    format: ImageFormat;
    quality?: number;
    signal?: AbortSignal;
    onImage?: (image: RenderedImage, done: number, total: number) => void;
  },
): Promise<RenderedImage[]> {
  const { openPdf } = await import("@/lib/pdfjs");
  // pdf.js takes ownership of the buffer it is given; keep the caller's intact.
  const task = await openPdf(data.slice(0));
  const out: RenderedImage[] = [];
  try {
    const doc = await task.promise;
    for (const [i, pageIndex] of pageIndices.entries()) {
      throwIfAborted(signal);
      const page = await doc.getPage(pageIndex + 1);
      const image = { pageIndex, ...(await renderPage(page, { dpi, format, quality })) };
      page.cleanup();
      out.push(image);
      onImage?.(image, i + 1, pageIndices.length);
    }
  } finally {
    await task.destroy();
  }
  return out;
}

export async function renderThumbnail(page: PdfPage, width: number): Promise<{ url: string; aspect: number }> {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  const blob = await canvasToBlob(canvas, "jpeg", 0.8);
  canvas.width = 0;
  canvas.height = 0;
  return { url: URL.createObjectURL(blob), aspect: base.height / base.width };
}

// ---------------------------------------------------------------------------
// Images → PDF

export type PageSize = "fit" | "a4" | "letter";
export type Orientation = "auto" | "portrait" | "landscape";

export interface ImagesToPdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  /** Margin in points (1/72 inch). Ignored for "fit". */
  margin: number;
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
}

const PAGE_SIZES: Record<Exclude<PageSize, "fit">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

/** Where an image of w×h goes on a page: its own size for "fit", otherwise centred and scaled down to fit. */
export function layoutImage(
  w: number,
  h: number,
  { pageSize, orientation, margin }: Pick<ImagesToPdfOptions, "pageSize" | "orientation" | "margin">,
): { pageWidth: number; pageHeight: number; x: number; y: number; width: number; height: number } {
  if (pageSize === "fit") return { pageWidth: w, pageHeight: h, x: 0, y: 0, width: w, height: h };
  let [pw, ph] = PAGE_SIZES[pageSize];
  const landscape = orientation === "landscape" || (orientation === "auto" && w > h);
  if (landscape) [pw, ph] = [ph, pw];
  const boxW = Math.max(1, pw - 2 * margin);
  const boxH = Math.max(1, ph - 2 * margin);
  // Never enlarge a small image: blowing up a 300 px screenshot to A4 only makes it blurry.
  const s = Math.min(1, boxW / w, boxH / h);
  const width = w * s;
  const height = h * s;
  return { pageWidth: pw, pageHeight: ph, x: (pw - width) / 2, y: (ph - height) / 2, width, height };
}

/**
 * EXIF orientation of a JPEG (1–8), or 1 when there is none. Phones store
 * photos sideways and record the rotation here; browsers honour it, but a PDF
 * embeds the raw pixels — so a rotated photo must be re-drawn upright first.
 */
export function jpegOrientation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966) {
      const tiff = offset + 10;
      if (tiff + 8 > view.byteLength) return 1;
      const little = view.getUint16(tiff) === 0x4949;
      const ifd = tiff + view.getUint32(tiff + 4, little);
      if (ifd + 2 > view.byteLength) return 1;
      const entries = view.getUint16(ifd, little);
      for (let i = 0; i < entries; i++) {
        const entry = ifd + 2 + i * 12;
        if (entry + 12 > view.byteLength) return 1;
        if (view.getUint16(entry, little) === 0x0112) {
          const value = view.getUint16(entry + 8, little);
          return value >= 1 && value <= 8 ? value : 1;
        }
      }
      return 1;
    }
    // Start of scan: no more metadata segments.
    if (marker === 0xffda || (marker & 0xff00) !== 0xff00) return 1;
    offset += 2 + size;
  }
  return 1;
}

interface PreparedImage {
  bytes: Uint8Array;
  kind: "jpg" | "png";
  width: number;
  height: number;
}

/**
 * JPEG and PNG go in as they are (no quality loss) when they can. Everything
 * else — WebP, GIF, BMP, and rotated JPEGs — is drawn upright on a canvas and
 * re-encoded: PNG when it may have transparency, high-quality JPEG otherwise.
 */
async function prepareImage(file: Blob): Promise<PreparedImage> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  // createImageBitmap applies EXIF orientation by default ("from-image").
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    if (isPng) return { bytes, kind: "png", width, height };
    if (isJpeg && jpegOrientation(bytes) === 1) return { bytes, kind: "jpg", width, height };
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a canvas");
    const opaque = isJpeg;
    if (opaque) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0);
    const blob = await canvasToBlob(canvas, opaque ? "jpeg" : "png", 0.92);
    canvas.width = 0;
    canvas.height = 0;
    return { bytes: new Uint8Array(await blob.arrayBuffer()), kind: opaque ? "jpg" : "png", width, height };
  } finally {
    bitmap.close();
  }
}

export async function imagesToPdf(files: Blob[], options: ImagesToPdfOptions): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  for (const [i, file] of files.entries()) {
    throwIfAborted(options.signal);
    const img = await prepareImage(file);
    const embedded = img.kind === "jpg" ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
    // Pixels become points at 96 dpi (1 px = 0.75 pt): the size the image has on screen.
    const box = layoutImage(img.width * 0.75, img.height * 0.75, options);
    const page = doc.addPage([box.pageWidth, box.pageHeight]);
    page.drawImage(embedded, { x: box.x, y: box.y, width: box.width, height: box.height });
    options.onProgress?.(i + 1, files.length);
    await new Promise((r) => setTimeout(r, 0));
  }
  throwIfAborted(options.signal);
  doc.setProducer("markdownpdf.app");
  doc.setCreator("markdownpdf.app");
  return doc.save({ useObjectStreams: true });
}
