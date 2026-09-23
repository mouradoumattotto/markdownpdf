/**
 * The one place pdf.js is loaded and configured. Every tool that reads a PDF
 * goes through openPdf(), so decoder assets are always wired correctly.
 *
 * pdf.js is imported lazily — it never ships in a page's initial JavaScript.
 */

/** Must equal the installed pdfjs-dist version (asserted in tests/unit). */
export const PDFJS_ASSET_VERSION = "6.3.289";

type PdfJs = typeof import("pdfjs-dist");
let loaded: Promise<PdfJs> | null = null;

export function loadPdfjs(): Promise<PdfJs> {
  loaded ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    return pdfjs;
  });
  return loaded;
}

export type PdfDocument = Awaited<ReturnType<PdfJs["getDocument"]>["promise"]>;
export type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;

/**
 * Opens a PDF from bytes. Decoder assets (JBIG2 / JPEG 2000 WASM, CJK cmaps,
 * standard fonts, ICC profiles) are served from our own origin by
 * scripts/copy-ocr-assets.mjs — without them, scanned JBIG2 pages render blank.
 *
 * pdf.js takes ownership of (and may detach) the buffer it is given, so pass a
 * copy if the caller still needs the bytes.
 */
export async function openPdf(data: Uint8Array | ArrayBuffer, password?: string) {
  const pdfjs = await loadPdfjs();
  const base = `${window.location.origin}/pdfjs/${PDFJS_ASSET_VERSION}`;
  return pdfjs.getDocument({
    data,
    password,
    wasmUrl: `${base}/wasm/`,
    cMapUrl: `${base}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base}/standard_fonts/`,
    iccUrl: `${base}/iccs/`,
    // Nothing here displays PDF text through the DOM: text is extracted, and
    // pages are only ever painted to a canvas (OCR, thumbnails, images), where
    // glyph outlines render identically. Skipping FontFace registration saves
    // main-thread work on every font of every page.
    disableFontFace: true,
  });
}
