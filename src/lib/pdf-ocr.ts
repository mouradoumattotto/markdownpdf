/**
 * Makes a scanned PDF searchable: an invisible text layer is added so the
 * document can be selected, searched and copied from, while it still looks
 * exactly the same.
 *
 * Pages that already carry text are copied from the original, untouched — so a
 * mixed document keeps its vector pages at full quality and only the scanned
 * ones are rebuilt from the image Tesseract read.
 */

import { CancelledError, throwIfAborted } from "@/lib/files";
import { DEFAULT_OCR_LANGUAGE, createOcrWorker, type OcrLanguage } from "@/lib/ocr";
import { openPdf } from "@/lib/pdfjs";

export interface OcrPdfProgress {
  page: number;
  totalPages: number;
  stage: "reading" | "loading_ocr" | "ocr" | "assembling";
}

export interface OcrPdfOptions {
  language?: OcrLanguage;
  signal?: AbortSignal;
  onProgress?: (p: OcrPdfProgress) => void;
  /** Rendering scale for scanned pages; 2 ≈ 144 dpi, a good OCR/size balance. */
  scale?: number;
}

export interface OcrPdfResult {
  bytes: Uint8Array;
  pageCount: number;
  /** Pages that had no text layer and were recognised. */
  ocrPages: number;
  /** Words the OCR added, as a rough quality signal. */
  wordsAdded: number;
}

const TEXT_THRESHOLD = 40;

export async function makeSearchablePdf(
  file: File,
  { language = DEFAULT_OCR_LANGUAGE, signal, onProgress, scale = 2 }: OcrPdfOptions = {},
): Promise<OcrPdfResult> {
  throwIfAborted(signal);
  const data = await file.arrayBuffer();
  const [{ PDFDocument }, task] = await Promise.all([import("pdf-lib"), openPdf(data.slice(0))]);
  let worker: Awaited<ReturnType<typeof createOcrWorker>> | null = null;
  const stopOcr = () => void worker?.terminate();
  signal?.addEventListener("abort", stopOcr, { once: true });

  try {
    const doc = await task.promise;
    const source = await PDFDocument.load(data, { updateMetadata: false });
    const out = await PDFDocument.create({ updateMetadata: false });
    let ocrPages = 0;
    let wordsAdded = 0;

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      throwIfAborted(signal);
      onProgress?.({ page: pageNum, totalPages: doc.numPages, stage: "reading" });
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items.map((it) => ("str" in it ? it.str : "")).join("");

      if (text.replace(/\s/g, "").length >= TEXT_THRESHOLD) {
        // Already searchable: keep the original page exactly as it is.
        const [copied] = await out.copyPages(source, [pageNum - 1]);
        out.addPage(copied);
        page.cleanup();
        continue;
      }

      if (!worker) {
        onProgress?.({ page: pageNum, totalPages: doc.numPages, stage: "loading_ocr" });
        worker = await createOcrWorker(language);
      }
      onProgress?.({ page: pageNum, totalPages: doc.numPages, stage: "ocr" });

      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create a canvas for OCR");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, canvas, viewport }).promise;

      const { data: recognized } = await worker.recognize(canvas, {}, { pdf: true, text: true });
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();

      if (!recognized.pdf?.length) throw new Error("OCR produced no page");
      wordsAdded += recognized.text.split(/\s+/).filter(Boolean).length;
      // Tesseract returns a one-page PDF: the page image with an invisible
      // text layer on top, at the size it was given.
      const ocrDoc = await PDFDocument.load(Uint8Array.from(recognized.pdf), { updateMetadata: false });
      const [copied] = await out.copyPages(ocrDoc, [0]);
      out.addPage(copied);
      ocrPages++;
    }

    onProgress?.({ page: doc.numPages, totalPages: doc.numPages, stage: "assembling" });
    const title = source.getTitle();
    if (title) out.setTitle(title);
    out.setProducer("markdownpdf.app");
    out.setCreator("markdownpdf.app");
    return { bytes: await out.save({ useObjectStreams: true }), pageCount: doc.numPages, ocrPages, wordsAdded };
  } finally {
    signal?.removeEventListener("abort", stopOcr);
    await worker?.terminate().catch(() => {});
    await task.destroy();
  }
}

export { CancelledError };
