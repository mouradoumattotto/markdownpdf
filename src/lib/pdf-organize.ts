/**
 * Reorder, rotate and delete pages. Pages are copied with pdf-lib, untouched
 * apart from their /Rotate entry, so text stays selectable and nothing is
 * re-compressed.
 */

export interface PageOp {
  /** 0-based index of the page in the source document. */
  source: number;
  /** Extra clockwise rotation to apply: 0, 90, 180 or 270. */
  rotate: number;
}

export function normalizeRotation(degrees: number): number {
  return ((Math.round(degrees / 90) * 90) % 360 + 360) % 360;
}

export async function organizePdf(data: ArrayBuffer, pages: PageOp[]): Promise<Uint8Array> {
  if (!pages.length) throw new Error("A PDF needs at least one page");
  const { PDFDocument, degrees } = await import("pdf-lib");
  const src = await PDFDocument.load(data, { updateMetadata: false });
  const out = await PDFDocument.create({ updateMetadata: false });
  const copied = await out.copyPages(
    src,
    pages.map((p) => p.source),
  );
  copied.forEach((page, i) => {
    const extra = normalizeRotation(pages[i].rotate);
    if (extra) page.setRotation(degrees(normalizeRotation(page.getRotation().angle + extra)));
    out.addPage(page);
  });
  const title = src.getTitle();
  if (title) out.setTitle(title);
  out.setProducer("markdownpdf.app");
  out.setCreator("markdownpdf.app");
  return out.save({ useObjectStreams: true });
}
