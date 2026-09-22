/**
 * Reading, editing and really removing PDF metadata, in the browser.
 *
 * "Really" matters: a PDF carries the same facts in two places — the Info
 * dictionary and an XMP stream — and a viewer that clears only the first
 * leaves the author's name sitting in the file for anyone with a text editor.
 * Cleaning here empties the Info dictionary, deletes the XMP stream *object*
 * from the document (not just the reference to it), and drops the per-page
 * metadata and application scratch data that editors leave behind.
 */

export const METADATA_FIELDS = ["title", "author", "subject", "keywords", "creator", "producer"] as const;
export type MetadataField = (typeof METADATA_FIELDS)[number];

export type MetadataValues = Partial<Record<MetadataField, string>>;

export interface PdfMetadata extends MetadataValues {
  createdAt?: string;
  modifiedAt?: string;
  /** Raw XMP packet, when the document carries one. */
  xmp?: string;
  /** Anything else the Info dictionary holds (editors add their own keys). */
  custom: Record<string, string>;
}

export interface PdfOverview {
  pages: number;
  bytes: number;
  pdfVersion?: string;
  /** First page size in millimetres, rounded. */
  pageSize?: { width: number; height: number };
  /** Pages sampled that carried no text layer (scanned). */
  scannedSample?: { checked: number; withoutText: number };
  hasForm?: boolean;
  encrypted?: boolean;
}

export interface MetadataReport {
  metadata: PdfMetadata;
  overview: PdfOverview;
}

const INFO_KEYS: Record<MetadataField, string> = {
  title: "Title",
  author: "Author",
  subject: "Subject",
  keywords: "Keywords",
  creator: "Creator",
  producer: "Producer",
};

/** "D:20240102030405Z" -> "2024-01-02" */
function pdfDate(value: unknown): string | undefined {
  const s = typeof value === "string" ? value : "";
  const m = /^D?:?(\d{4})(\d{2})(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = value instanceof Date ? value : undefined;
  return d && !Number.isNaN(d.valueOf()) ? d.toISOString().slice(0, 10) : undefined;
}

const PT_TO_MM = 25.4 / 72;

export async function readPdfMetadata(data: ArrayBuffer, { samplePages = 5 } = {}): Promise<MetadataReport> {
  const { openPdf } = await import("@/lib/pdfjs");
  const task = await openPdf(data.slice(0));
  const doc = await task.promise;
  try {
    const raw = (await doc.getMetadata()) as unknown as {
      info: Record<string, unknown>;
      metadata?: { getRaw(): string } | null;
    };
    const { info, metadata } = raw;

    const values: MetadataValues = {};
    for (const field of METADATA_FIELDS) {
      const raw = info[INFO_KEYS[field]];
      if (typeof raw === "string" && raw.trim()) values[field] = raw.trim();
    }
    const known = new Set([...Object.values(INFO_KEYS), "CreationDate", "ModDate", "Trapped"]);
    const custom: Record<string, string> = {};
    for (const [key, raw] of Object.entries(info)) {
      // pdf.js also exposes parsing flags (IsLinearized…) that are not metadata.
      if (known.has(key) || key.startsWith("Is") || key === "PDFFormatVersion" || key === "Language") continue;
      if (typeof raw === "string" && raw.trim()) custom[key] = raw.trim();
    }

    const page = doc.numPages > 0 ? await doc.getPage(1) : null;
    const viewport = page?.getViewport({ scale: 1 });
    let withoutText = 0;
    const checked = Math.min(samplePages, doc.numPages);
    for (let i = 1; i <= checked; i++) {
      const p = await doc.getPage(i);
      const content = await p.getTextContent();
      const text = content.items.map((it) => ("str" in it ? it.str : "")).join("");
      if (text.replace(/\s/g, "").length < 40) withoutText++;
      p.cleanup();
    }

    return {
      metadata: {
        ...values,
        createdAt: pdfDate(info.CreationDate),
        modifiedAt: pdfDate(info.ModDate),
        xmp: metadata?.getRaw() || undefined,
        custom,
      },
      overview: {
        pages: doc.numPages,
        bytes: data.byteLength,
        pdfVersion: typeof info.PDFFormatVersion === "string" ? info.PDFFormatVersion : undefined,
        pageSize: viewport
          ? { width: Math.round(viewport.width * PT_TO_MM), height: Math.round(viewport.height * PT_TO_MM) }
          : undefined,
        scannedSample: checked ? { checked, withoutText } : undefined,
        hasForm: Boolean(info.IsAcroFormPresent),
        encrypted: false,
      },
    };
  } finally {
    await task.destroy();
  }
}

export interface WriteOptions {
  /** Field values to set. Empty string removes the field. */
  values?: MetadataValues;
  /** Wipe everything: Info, XMP, custom keys, dates, per-page metadata. */
  clearAll?: boolean;
  /** Keep the creation/modification dates (they are metadata too). */
  keepDates?: boolean;
}

export interface WriteResult {
  bytes: Uint8Array;
  /** What was found and removed, for the "here is what we deleted" summary. */
  removed: string[];
}

export async function writePdfMetadata(data: ArrayBuffer, options: WriteOptions): Promise<WriteResult> {
  const { PDFDocument, PDFDict, PDFName, PDFString } = await import("pdf-lib");
  // updateMetadata: false — pdf-lib otherwise stamps its own Producer and a
  // fresh ModDate on save, which would re-add metadata we were asked to remove.
  const doc = await PDFDocument.load(data, { updateMetadata: false });
  const context = doc.context;
  const removed: string[] = [];

  const infoRef = context.trailerInfo.Info;
  const info = infoRef ? context.lookupMaybe(infoRef, PDFDict) : undefined;

  if (options.clearAll && info) {
    for (const key of info.keys()) {
      const name = key.asString().replace("/", "");
      if (options.keepDates && (name === "CreationDate" || name === "ModDate")) continue;
      removed.push(name);
      info.delete(key);
    }
  }

  if (options.values && info) {
    for (const [field, value] of Object.entries(options.values) as [MetadataField, string][]) {
      const key = PDFName.of(INFO_KEYS[field]);
      if (value) info.set(key, PDFString.of(value));
      else info.delete(key);
    }
  } else if (options.values && !info) {
    const dict = context.obj({});
    for (const [field, value] of Object.entries(options.values) as [MetadataField, string][]) {
      if (value) dict.set(PDFName.of(INFO_KEYS[field]), PDFString.of(value));
    }
    context.trailerInfo.Info = context.register(dict);
  }

  if (options.clearAll) {
    // The XMP packet duplicates the Info dictionary. Deleting the catalog entry
    // is not enough: the stream object would still be written to the file, so
    // the object itself is removed from the document.
    const metadataRef = doc.catalog.get(PDFName.of("Metadata"));
    if (metadataRef) {
      doc.catalog.delete(PDFName.of("Metadata"));
      if ("objectNumber" in (metadataRef as object)) context.delete(metadataRef as never);
      removed.push("XMP metadata");
    }
    // Per-page metadata and the private scratch data editors leave behind.
    for (const page of doc.getPages()) {
      for (const key of ["Metadata", "PieceInfo"]) {
        const name = PDFName.of(key);
        if (page.node.get(name)) {
          const ref = page.node.get(name);
          page.node.delete(name);
          if (ref && "objectNumber" in (ref as object)) context.delete(ref as never);
          if (!removed.includes(`page ${key}`)) removed.push(`page ${key}`);
        }
      }
    }
    const piece = doc.catalog.get(PDFName.of("PieceInfo"));
    if (piece) {
      doc.catalog.delete(PDFName.of("PieceInfo"));
      removed.push("PieceInfo");
    }
  }

  return { bytes: await doc.save({ useObjectStreams: true }), removed };
}
