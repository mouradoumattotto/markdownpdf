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

const { analyzePdf, buildParts, parseRanges, partFileName, planByChapters, planByLimits, planEvery, rangeWords } = await import("@/lib/pdf-split");
const { PDFDocument } = await import("pdf-lib");

const bytesOf = (name: string) => {
  const b = readFileSync(join(root, "tests/fixtures/generated", name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};
const pages = (words: number[]) => words.map((w) => ({ words: w, hasText: w > 0 }));

describe("planning", () => {
  it("packs pages under a word limit with the fewest parts", () => {
    expect(planByLimits(pages([40, 40, 40, 40, 40]), { maxWords: 100 })).toEqual([
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 4, to: 4 },
    ]);
  });
  it("respects a page limit", () => {
    expect(planByLimits(pages(Array(250).fill(10)), { maxPages: 100 }).map((r) => r.to - r.from + 1)).toEqual([100, 100, 50]);
  });
  it("keeps an oversized single page as its own part", () => {
    expect(planByLimits(pages([10, 500, 10]), { maxWords: 100 })).toEqual([
      { from: 0, to: 0 },
      { from: 1, to: 1 },
      { from: 2, to: 2 },
    ]);
  });
  it("returns one part when everything fits", () => {
    expect(planByLimits(pages([1, 2, 3]), { maxWords: 1000, maxPages: 100 })).toEqual([{ from: 0, to: 2 }]);
  });
  it("splits by chapter, subdividing only chapters that are too long", () => {
    const r = planByChapters(pages(Array(12).fill(10)), [
      { title: "One", start: 1 },
      { title: "Two", start: 4 },
    ], { maxPages: 5 });
    expect(r).toEqual([
      { from: 0, to: 0, label: "Front matter" },
      { from: 1, to: 3, label: "One" },
      { from: 4, to: 8, label: "Two (1/2)" },
      { from: 9, to: 11, label: "Two (2/2)" },
    ]);
  });
  it("splits every N pages", () => {
    expect(planEvery(7, 3)).toEqual([{ from: 0, to: 2 }, { from: 3, to: 5 }, { from: 6, to: 6 }]);
  });
  it("parses human page ranges and reports mistakes", () => {
    expect(parseRanges("1-3, 5, 8-", 10)).toEqual({ ranges: [{ from: 0, to: 2 }, { from: 4, to: 4 }, { from: 7, to: 9 }] });
    expect(parseRanges("0-2", 10)).toHaveProperty("error");
    expect(parseRanges("5-2", 10)).toHaveProperty("error");
    expect(parseRanges("abc", 10)).toHaveProperty("error");
    expect(parseRanges("11", 10)).toHaveProperty("error");
  });
  it("names parts so they sort correctly", () => {
    expect(partFileName("report", 1, 12, { from: 50, to: 99 })).toBe("report-part-02-p51-100.pdf");
  });
});

describe("analysis and building on real PDFs", () => {
  it("counts words per page and reads bookmarks as chapters", async () => {
    const a = await analyzePdf(bytesOf("outline.pdf"));
    expect(a.pages).toHaveLength(12);
    expect(a.chapters.map((c) => [c.title, c.start])).toEqual([
      ["Chapter One", 0],
      ["Chapter Two", 3],
      ["Chapter Three", 8],
    ]);
    expect(rangeWords(a.pages, { from: 0, to: 11 })).toBeGreaterThan(50);
  });

  it("marks scanned pages as having no text", async () => {
    const a = await analyzePdf(bytesOf("mixed-text-and-scan.pdf"));
    expect(a.pages.map((p) => p.hasText)).toEqual([true, false]);
  });

  it("writes parts with exactly the requested pages", async () => {
    const data = bytesOf("pages-50.pdf");
    const parts = await buildParts(data, planEvery(50, 20));
    expect(parts.map((p) => p.range)).toEqual([{ from: 0, to: 19 }, { from: 20, to: 39 }, { from: 40, to: 49 }]);
    const counts = await Promise.all(parts.map(async (p) => (await PDFDocument.load(p.bytes)).getPageCount()));
    expect(counts).toEqual([20, 20, 10]);
    // The text really moved with its pages.
    const a = await analyzePdf(parts[1].bytes.buffer.slice(parts[1].bytes.byteOffset, parts[1].bytes.byteOffset + parts[1].bytes.byteLength) as ArrayBuffer);
    expect(a.pages).toHaveLength(20);
  });

  it("re-splits a part that exceeds a byte limit", async () => {
    const big = await buildParts(bytesOf("pages-300.pdf"), [{ from: 0, to: 299 }], { maxBytes: 60_000 });
    expect(big.length).toBeGreaterThan(1);
    for (const p of big) if (p.range.to > p.range.from) expect(p.bytes.byteLength).toBeLessThanOrEqual(60_000);
    expect(big[0].range.from).toBe(0);
    expect(big.at(-1)!.range.to).toBe(299);
  });

  it("refuses encrypted PDFs with a recognisable error", async () => {
    await expect(buildParts(bytesOf("encrypted.pdf"), [{ from: 0, to: 0 }])).rejects.toThrow(/encrypt/i);
  });
});
