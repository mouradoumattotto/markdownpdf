import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { countPages, extractPages } from "@/lib/pdf-split";
import { mergePdfs } from "@/lib/pdf-merge";
import { classifyPdfError } from "@/lib/files";

const root = join(__dirname, "..", "..");
const bytesOf = (name: string) => {
  const b = readFileSync(join(root, "tests/fixtures/generated", name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};
const buf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

/** A PDF whose page i is (100 + i) points wide, so page order can be read back. */
async function numbered(count: number, offset = 0): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < count; i++) doc.addPage([100 + offset + i, 200]);
  return buf(await doc.save());
}
const widths = async (bytes: Uint8Array) =>
  (await PDFDocument.load(bytes)).getPages().map((p) => Math.round(p.getWidth()) - 100);

describe("extractPages", () => {
  it("copies the ranges into one PDF, in the order given", async () => {
    const out = await extractPages(await numbered(10), [
      { from: 4, to: 4 },
      { from: 0, to: 2 },
    ]);
    expect(await widths(out)).toEqual([4, 0, 1, 2]);
  });

  it("counts pages without pdf.js", async () => {
    expect(await countPages(bytesOf("pages-50.pdf"))).toBe(50);
  });
});

describe("mergePdfs", () => {
  it("concatenates files in order, all pages or a selection", async () => {
    const a = await numbered(3);
    const b = await numbered(2, 10);
    const out = await mergePdfs([{ data: b }, { data: a, pages: [2, 0] }]);
    expect(await widths(out)).toEqual([10, 11, 2, 0]);
  });

  it("keeps real text when merging real documents", async () => {
    const out = await mergePdfs([{ data: bytesOf("text-simple.pdf") }, { data: bytesOf("pages-10.pdf") }]);
    expect((await PDFDocument.load(out)).getPageCount()).toBe(
      (await countPages(bytesOf("text-simple.pdf"))) + 10,
    );
    expect(out.byteLength).toBeGreaterThan(1000);
  });

  it("refuses encrypted files with an actionable error", async () => {
    const err = await mergePdfs([{ data: bytesOf("encrypted.pdf") }]).catch((e) => e);
    expect(classifyPdfError(err).code).toBe("encrypted");
  });

  it("stops when cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(mergePdfs([{ data: await numbered(1) }], { signal: controller.signal })).rejects.toThrow("Cancelled");
  });
});
