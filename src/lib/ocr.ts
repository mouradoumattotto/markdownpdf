import type { Worker } from "tesseract.js";

/**
 * Version of the self-hosted Tesseract assets under /public/ocr/<version>/.
 * Must equal the installed tesseract.js version — tests/unit/ocr.test.ts fails
 * the build if they drift, because a mismatched worker and core break silently.
 */
export const OCR_ASSET_VERSION = "7.0.0";

/**
 * Languages the OCR engine can read. Each code maps to a traineddata file copied
 * by scripts/copy-ocr-assets.mjs — keep the two lists in sync.
 */
export const OCR_LANGUAGES = [
  { code: "eng", label: "English" },
  { code: "fra", label: "French" },
  { code: "spa", label: "Spanish" },
  { code: "deu", label: "German" },
  { code: "por", label: "Portuguese" },
  { code: "ita", label: "Italian" },
  { code: "ara", label: "Arabic" },
] as const;

export type OcrLanguage = (typeof OCR_LANGUAGES)[number]["code"];

export const DEFAULT_OCR_LANGUAGE: OcrLanguage = "eng";

export function isOcrLanguage(value: string): value is OcrLanguage {
  return OCR_LANGUAGES.some((l) => l.code === value);
}

function assetBase(): string {
  return `${window.location.origin}/ocr/${OCR_ASSET_VERSION}`;
}

/**
 * Creates a Tesseract worker that loads everything — worker script, WASM core,
 * language data — from our own origin. Nothing is fetched from a CDN, and the
 * image being recognized never leaves the browser.
 *
 * Loaded lazily: tesseract.js is only imported the first time OCR is needed.
 */
export async function createOcrWorker(
  language: OcrLanguage,
  /** Progress within the current page or image, 0..1. */
  onProgress?: (ratio: number) => void,
): Promise<Worker> {
  const { createWorker } = await import("tesseract.js");
  const base = assetBase();
  return createWorker(language, 1, {
    // Only set `logger` when there is something to report: passing an explicit
    // `undefined` overrides tesseract.js's own default and it then calls it,
    // throwing "v is not a function" for every progress tick — which silently
    // aborted recognition on PDF pages.
    ...(onProgress
      ? {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text") onProgress(m.progress);
          },
        }
      : {}),
    workerPath: `${base}/worker.min.js`,
    corePath: `${base}/core`,
    langPath: `${base}/lang`,
    gzip: true,
    // Load the worker straight from its URL instead of wrapping it in a blob:
    // URL, so the CSP can keep worker-src to 'self'.
    workerBlobURL: false,
    // Language data is cached by the browser's HTTP cache (immutable, versioned
    // path); skipping tesseract's own IndexedDB copy avoids storing it twice.
    cacheMethod: "none",
  });
}
