// ------------------------------------------------------------------
// scripts/copy-ocr-assets.mjs — Self-host the OCR engine and pdf.js decoders.
//
// Tesseract.js fetches its worker, its WASM core and its language data from
// cdn.jsdelivr.net unless told otherwise. That was true here until 2026-09-18:
// the PDF never left the browser, but every visitor who hit a scanned page made
// a request to a third-party CDN we did not disclose. Serving the same files
// from our own origin removes that dependency, lets the CSP forbid it, and is
// the prerequisite for offering OCR languages other than English.
//
// Runs as `predev` / `prebuild`, copying from node_modules into public/ocr/.
// Nothing binary is committed: public/ocr/ is gitignored. The Tesseract version
// is part of the path, so the files can be cached as immutable.
// ------------------------------------------------------------------

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = (...p) => join(root, "node_modules", ...p);
const version = JSON.parse(readFileSync(nm("tesseract.js", "package.json"), "utf8")).version;

// Must stay in sync with OCR_LANGUAGES in src/lib/ocr.ts.
const LANGS = ["eng", "fra", "spa", "deu", "por", "ita", "ara"];

// Only the LSTM builds: tesseract.js picks one of these at runtime depending on
// the browser's SIMD support. The legacy (non-LSTM) builds are never loaded.
const CORE_FILES = [
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-relaxedsimd-lstm.wasm.js",
];

const outRoot = join(root, "public", "ocr");
const out = join(outRoot, version);
rmSync(outRoot, { recursive: true, force: true });
mkdirSync(join(out, "core"), { recursive: true });
mkdirSync(join(out, "lang"), { recursive: true });

cpSync(nm("tesseract.js", "dist", "worker.min.js"), join(out, "worker.min.js"));
for (const f of CORE_FILES) cpSync(nm("tesseract.js-core", f), join(out, "core", f));
for (const lang of LANGS) {
  const src = nm("@tesseract.js-data", lang, "4.0.0_best_int", `${lang}.traineddata.gz`);
  if (!existsSync(src)) throw new Error(`Missing OCR language data: ${src}`);
  cpSync(src, join(out, "lang", `${lang}.traineddata.gz`));
}

console.log(`OCR assets -> public/ocr/${version} (${LANGS.length} languages, ${CORE_FILES.length} core builds)`);

// ---- pdf.js decoder assets ----
// Without `wasmUrl`, pdf.js cannot decode JBIG2 or JPEG 2000 images — and JBIG2
// is what most office scanners produce for black-and-white pages. Such a page
// rendered blank, so OCR found nothing on exactly the documents that need it.
// cmaps are needed to extract CJK text correctly, standard_fonts to render PDFs
// that reference the 14 standard fonts without embedding them.
const pdfjsVersion = JSON.parse(readFileSync(nm("pdfjs-dist", "package.json"), "utf8")).version;
const pdfOutRoot = join(root, "public", "pdfjs");
const pdfOut = join(pdfOutRoot, pdfjsVersion);
rmSync(pdfOutRoot, { recursive: true, force: true });
for (const dir of ["wasm", "cmaps", "standard_fonts", "iccs"]) {
  cpSync(nm("pdfjs-dist", dir), join(pdfOut, dir), { recursive: true });
}
console.log(`pdf.js assets -> public/pdfjs/${pdfjsVersion} (wasm, cmaps, standard_fonts, iccs)`);
