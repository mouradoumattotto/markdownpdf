/**
 * Merging PDFs in the browser with pdf-lib. Pages are copied as they are —
 * nothing is re-rendered or re-compressed, so text stays selectable and the
 * output is roughly the sum of the inputs.
 */

import { throwIfAborted } from "@/lib/files";

export interface MergeInput {
  data: ArrayBuffer;
  /** 0-based page indices to take, in order. Omitted: every page. */
  pages?: number[];
}

export async function mergePdfs(
  inputs: MergeInput[],
  { signal, onProgress }: { signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {},
): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create({ updateMetadata: false });
  for (const [i, input] of inputs.entries()) {
    throwIfAborted(signal);
    const src = await PDFDocument.load(input.data, { updateMetadata: false });
    const indices = input.pages ?? src.getPageIndices();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
    onProgress?.(i + 1, inputs.length);
    // Let the progress bar paint between large files.
    await new Promise((r) => setTimeout(r, 0));
  }
  throwIfAborted(signal);
  out.setProducer("markdownpdf.app");
  out.setCreator("markdownpdf.app");
  return out.save({ useObjectStreams: true });
}
