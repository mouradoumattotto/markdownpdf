/**
 * The images embedded in a PDF page, with where they sit on it.
 *
 * pdf.js exposes no "list the images" call. The images are found the way a
 * renderer finds them: by walking the page's operator list, tracking the
 * current transformation matrix through save/restore/transform and form
 * XObjects, and noting each image paint. An image is drawn into the unit
 * square, so the matrix at that moment gives its position and size in points.
 */

import type { PdfPage } from "@/lib/pdfjs";

export interface PageImage {
  /** Top edge, in PDF user space (y grows upwards), for ordering with text. */
  top: number;
  /** Displayed size on the page, in points. */
  widthPt: number;
  heightPt: number;
  /** Pixel size of the image itself. */
  width: number;
  height: number;
  blob: Blob;
  ext: "png" | "jpg";
  /** Cheap content fingerprint, to drop an image repeated on every page (a logo). */
  fingerprint: string;
}

type Matrix = [number, number, number, number, number, number];

const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

/** Bounding box of the unit square under a matrix. */
export function unitSquareBox(m: Matrix): { left: number; bottom: number; right: number; top: number } {
  const pts = [
    [m[4], m[5]],
    [m[0] + m[4], m[1] + m[5]],
    [m[2] + m[4], m[3] + m[5]],
    [m[0] + m[2] + m[4], m[1] + m[3] + m[5]],
  ];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { left: Math.min(...xs), right: Math.max(...xs), bottom: Math.min(...ys), top: Math.max(...ys) };
}

interface ImagePaint {
  objId: string | null;
  inline: unknown;
  box: ReturnType<typeof unitSquareBox>;
}

/** Walks an operator list and returns every image paint with its box. Pure; unit-tested. */
export function findImagePaints(
  fnArray: ArrayLike<number>,
  argsArray: ArrayLike<unknown>,
  OPS: Record<string, number>,
): ImagePaint[] {
  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  const stack: Matrix[] = [];
  const out: ImagePaint[] = [];
  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const args = argsArray[i] as unknown[] | null;
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() ?? ctm;
    else if (fn === OPS.transform && args) ctm = multiply(ctm, args as Matrix);
    else if (fn === OPS.paintFormXObjectBegin && args) {
      stack.push(ctm);
      if (Array.isArray(args[0]) && args[0].length === 6) ctm = multiply(ctm, args[0] as Matrix);
    } else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() ?? ctm;
    else if (fn === OPS.paintImageXObject && args) {
      out.push({ objId: String(args[0]), inline: null, box: unitSquareBox(ctm) });
    } else if (fn === OPS.paintInlineImageXObject && args) {
      out.push({ objId: null, inline: args[0], box: unitSquareBox(ctm) });
    }
  }
  return out;
}

interface PdfImageData {
  width: number;
  height: number;
  kind?: number;
  data?: Uint8Array | Uint8ClampedArray;
  bitmap?: ImageBitmap;
}

function objectOf(page: PdfPage, id: string, timeoutMs = 3000): Promise<PdfImageData | null> {
  // Ids starting with "g_" are shared between pages (commonObjs).
  const store = (id.startsWith("g_") ? page.commonObjs : page.objs) as unknown as {
    get(id: string, cb: (v: unknown) => void): void;
  };
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    try {
      store.get(id, (v) => {
        clearTimeout(timer);
        resolve((v as PdfImageData) ?? null);
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

/** RGBA pixels from pdf.js raw image data (1-bit grey, RGB or RGBA). */
function toRgba(img: PdfImageData): Uint8ClampedArray | null {
  const { width, height, kind, data } = img;
  if (!data) return null;
  const out = new Uint8ClampedArray(width * height * 4);
  if (kind === 3) {
    out.set(data.subarray(0, out.length));
  } else if (kind === 2) {
    for (let s = 0, d = 0; d < out.length; s += 3, d += 4) {
      out[d] = data[s];
      out[d + 1] = data[s + 1];
      out[d + 2] = data[s + 2];
      out[d + 3] = 255;
    }
  } else if (kind === 1) {
    const rowBytes = (width + 7) >> 3;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bit = (data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
        const v = bit ? 255 : 0;
        const d = (y * width + x) * 4;
        out[d] = out[d + 1] = out[d + 2] = v;
        out[d + 3] = 255;
      }
    }
  } else return null;
  return out;
}

function fingerprint(rgba: Uint8ClampedArray, width: number, height: number): string {
  let h = 2166136261;
  const step = Math.max(4, Math.floor(rgba.length / 4096) * 4);
  for (let i = 0; i < rgba.length; i += step) h = Math.imul(h ^ rgba[i] ^ (rgba[i + 1] << 8) ^ (rgba[i + 2] << 16), 16777619);
  return `${width}x${height}:${(h >>> 0).toString(36)}`;
}

async function encode(img: PdfImageData): Promise<{ blob: Blob; ext: "png" | "jpg"; fingerprint: string } | null> {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  let rgba: Uint8ClampedArray | null;
  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
    rgba = ctx.getImageData(0, 0, img.width, img.height).data;
  } else {
    rgba = toRgba(img);
    if (!rgba) return null;
    ctx.putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, img.width, img.height), 0, 0);
  }
  let opaque = true;
  for (let i = 3; i < rgba.length; i += 4 * 97) {
    if (rgba[i] < 255) {
      opaque = false;
      break;
    }
  }
  // Photos as JPEG (a fraction of the size), everything else lossless.
  const photo = opaque && img.width * img.height > 250_000 && img.kind !== 1;
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, photo ? "image/jpeg" : "image/png", 0.9));
  const print = fingerprint(rgba, img.width, img.height);
  canvas.width = canvas.height = 0;
  return blob ? { blob, ext: photo ? "jpg" : "png", fingerprint: print } : null;
}

/** Images smaller than this on the page (in points) are decoration: rules, bullets, icons. */
const MIN_DISPLAY_PT = 36;

export async function extractPageImages(page: PdfPage): Promise<PageImage[]> {
  const { loadPdfjs } = await import("@/lib/pdfjs");
  const { OPS } = await loadPdfjs();
  const ops = await page.getOperatorList();
  const paints = findImagePaints(ops.fnArray, ops.argsArray, OPS as unknown as Record<string, number>);
  const out: PageImage[] = [];
  for (const p of paints) {
    const widthPt = p.box.right - p.box.left;
    const heightPt = p.box.top - p.box.bottom;
    if (widthPt < MIN_DISPLAY_PT || heightPt < MIN_DISPLAY_PT) continue;
    const data = p.objId ? await objectOf(page, p.objId) : (p.inline as PdfImageData);
    if (!data?.width || !data?.height) continue;
    const encoded = await encode(data);
    if (!encoded) continue;
    out.push({ top: p.box.top, widthPt, heightPt, width: data.width, height: data.height, ...encoded });
  }
  return out;
}
