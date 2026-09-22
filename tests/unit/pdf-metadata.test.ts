import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const root = join(__dirname, "..", "..");
vi.mock("@/lib/pdfjs", async () => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return {
    PDFJS_ASSET_VERSION: "test",
    loadPdfjs: async () => pdfjs,
    openPdf: async (data: ArrayBuffer) =>
      pdfjs.getDocument({
        data: new Uint8Array(data),
        standardFontDataUrl: join(root, "node_modules/pdfjs-dist/standard_fonts/"),
        verbosity: 0,
      }),
  };
});

const { readPdfMetadata, writePdfMetadata } = await import("@/lib/pdf-metadata");

const bytesOf = (name: string) => {
  const b = readFileSync(join(root, "tests/fixtures/generated", name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};
const asText = (bytes: Uint8Array) => Buffer.from(bytes).toString("latin1");
/**
 * pdf-lib writes Info strings as UTF-16BE hex, so searching the bytes for plain
 * text is not enough on its own: check that encoding too before concluding a
 * value is gone.
 */
const asHexString = (value: string) =>
  "FEFF" + [...value].map((c) => c.charCodeAt(0).toString(16).padStart(4, "0")).join("").toUpperCase();
const toBuffer = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

describe("reading metadata", () => {
  it("reports the Info dictionary, the XMP packet and a document overview", async () => {
    const { metadata, overview } = await readPdfMetadata(bytesOf("metadata.pdf"));
    expect(metadata.title).toContain("ALICE_SECRET");
    expect(metadata.author).toBe("ALICE_SECRET");
    expect(metadata.creator).toContain("ALICE_SECRET");
    expect(metadata.keywords).toContain("confidential");
    expect(metadata.createdAt).toBe("2024-01-02");
    expect(metadata.modifiedAt).toBe("2024-02-03");
    expect(metadata.xmp).toContain("ALICE_SECRET_XMP");
    expect(overview).toMatchObject({ pages: 1 });
    expect(overview.pageSize).toEqual({ width: 210, height: 297 }); // A4
    expect(overview.pdfVersion).toBeTruthy();
  });

  it("flags pages with no text layer", async () => {
    const { overview } = await readPdfMetadata(bytesOf("scanned-en.pdf"));
    expect(overview.scannedSample).toEqual({ checked: 1, withoutText: 1 });
  });
});

describe("removing metadata", () => {
  it("erases every trace from the file's bytes, not just from the viewer", async () => {
    const original = bytesOf("metadata.pdf");
    expect(asText(new Uint8Array(original))).toContain("ALICE_SECRET_XMP");

    const { bytes, removed } = await writePdfMetadata(original, { clearAll: true });
    const text = asText(bytes);
    expect(text).not.toContain("ALICE_SECRET");
    expect(text).not.toContain("ALICE_SECRET_XMP");
    expect(text.toUpperCase()).not.toContain(asHexString("ALICE_SECRET"));
    expect(removed).toEqual(expect.arrayContaining(["Title", "Author", "XMP metadata"]));

    const after = await readPdfMetadata(toBuffer(bytes));
    expect(after.metadata.title).toBeUndefined();
    expect(after.metadata.author).toBeUndefined();
    expect(after.metadata.xmp).toBeUndefined();
    expect(after.metadata.createdAt).toBeUndefined();
    expect(after.overview.pages).toBe(1); // the document itself is intact
  });

  it("can keep the dates while clearing the rest", async () => {
    const { bytes } = await writePdfMetadata(bytesOf("metadata.pdf"), { clearAll: true, keepDates: true });
    const after = await readPdfMetadata(toBuffer(bytes));
    expect(after.metadata.author).toBeUndefined();
    expect(after.metadata.createdAt).toBe("2024-01-02");
  });

  it("writes new values and drops the ones set to empty", async () => {
    const { bytes } = await writePdfMetadata(bytesOf("metadata.pdf"), {
      clearAll: true,
      values: { title: "Public report", author: "" },
    });
    const after = await readPdfMetadata(toBuffer(bytes));
    expect(after.metadata.title).toBe("Public report");
    expect(after.metadata.author).toBeUndefined();
  });

  it("adds metadata to a PDF that had none", async () => {
    const { bytes } = await writePdfMetadata(bytesOf("pages-10.pdf"), { values: { author: "Mourad" } });
    const after = await readPdfMetadata(toBuffer(bytes));
    expect(after.metadata.author).toBe("Mourad");
  });

  it("refuses an encrypted PDF", async () => {
    await expect(writePdfMetadata(bytesOf("encrypted.pdf"), { clearAll: true })).rejects.toThrow(/encrypt/i);
  });
});
