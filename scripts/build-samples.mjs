// Builds the sample PDFs in public/samples/ from real, redistributable documents
// (US federal government works are public domain; PLOS articles are CC BY 4.0).
// Sources, page selections and credits live in src/lib/samples.ts — keep both in sync.
//
//   node scripts/build-samples.mjs
//
// Long documents are cut to a few representative pages so a sample loads fast
// on a phone. The NACA report ships with a garbled hidden OCR layer; it is
// re-rendered to plain images so the sample is a true scan, as most scans are.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { createCanvas } from "@napi-rs/canvas";

const root = join(import.meta.dirname, "..");
const out = join(root, "public", "samples");
const thumbs = join(out, "thumbs");
mkdirSync(thumbs, { recursive: true });

const pdfjs = await import(join(root, "node_modules/pdfjs-dist/legacy/build/pdf.mjs"));
const dist = join(root, "node_modules/pdfjs-dist");
// Decoder assets: without the WASM modules, JBIG2 / JPEG 2000 scans render blank.
const open = (data) =>
  pdfjs.getDocument({
    data,
    verbosity: 0,
    wasmUrl: `${dist}/wasm/`,
    cMapUrl: `${dist}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${dist}/standard_fonts/`,
    iccUrl: `${dist}/iccs/`,
  }).promise;
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

const SAMPLES = [
  {
    file: "research-paper-ioannidis-2005.pdf",
    url: "https://journals.plos.org/plosmedicine/article/file?id=10.1371/journal.pmed.0020124&type=printable",
  },
  {
    file: "scanned-naca-report-460.pdf",
    url: "https://ntrs.nasa.gov/api/citations/19930091108/downloads/19930091108.pdf",
    pages: [3, 5, 6],
    rasterize: true,
  },
  {
    file: "census-income-2023-excerpt.pdf",
    url: "https://www2.census.gov/library/publications/2024/demo/p60-282.pdf",
    pages: [1, 7, 8, 21],
  },
  {
    file: "eia-energy-outlook-tables.pdf",
    url: "https://www.eia.gov/outlooks/steo/pdf/steo_full.pdf",
    pages: [32, 36],
  },
  { file: "irs-form-w9.pdf", url: "https://www.irs.gov/pub/irs-pdf/fw9.pdf" },
  { file: "nist-cybersecurity-framework-2.pdf", url: "https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf" },
];

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/pdf,*/*" } });
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!res.ok || new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
    throw new Error(`${url}: not a PDF (HTTP ${res.status})`);
  }
  return bytes;
}

async function renderPage(doc, n, width) {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });
  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  return { canvas, size: [base.width, base.height] };
}

for (const s of SAMPLES) {
  const src = await download(s.url);
  let bytes;
  if (s.rasterize) {
    const doc = await open(src.slice());
    const outDoc = await PDFDocument.create();
    for (const n of s.pages) {
      const { canvas, size } = await renderPage(doc, n, 1275); // ≈150 dpi on Letter
      const jpg = await outDoc.embedJpg(canvas.toBuffer("image/jpeg", 72));
      outDoc.addPage(size).drawImage(jpg, { x: 0, y: 0, width: size[0], height: size[1] });
    }
    bytes = await outDoc.save();
  } else if (s.pages) {
    const srcDoc = await PDFDocument.load(src, { ignoreEncryption: true });
    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(srcDoc, s.pages.map((p) => p - 1));
    copied.forEach((p) => outDoc.addPage(p));
    bytes = await outDoc.save({ useObjectStreams: true });
  } else {
    bytes = src;
  }
  writeFileSync(join(out, s.file), bytes);

  const doc = await open(bytes.slice());
  const { canvas } = await renderPage(doc, 1, 480);
  writeFileSync(join(thumbs, s.file.replace(/\.pdf$/, ".webp")), canvas.toBuffer("image/webp", 80));
  console.log(`${s.file}: ${doc.numPages} pages, ${(bytes.length / 1024).toFixed(0)} KB`);
}
