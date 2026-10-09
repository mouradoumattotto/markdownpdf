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

const { assembleRedactedPdf, boundingRect, buildPattern, clampRect, findMatches, itemQuad, searchPdf, toPixels } =
  await import("@/lib/pdf-redact");
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const toBuffer = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

function regex(options: Parameters<typeof buildPattern>[0]): RegExp {
  const built = buildPattern(options);
  if ("error" in built) throw new Error(built.error);
  return built.regex;
}

describe("buildPattern", () => {
  it("escapes plain text and matches any whitespace between words", () => {
    const re = regex({ mode: "text", query: "a.b  (c)" });
    expect("x a.b\n(c) y".match(re)?.[0]).toBe("a.b\n(c)");
    expect("axb (c)".match(re)).toBeNull();
  });

  it("is case-insensitive unless asked otherwise", () => {
    expect("ALICE".match(regex({ mode: "text", query: "alice" }))).not.toBeNull();
    expect("ALICE".match(regex({ mode: "text", query: "alice", caseSensitive: true }))).toBeNull();
  });

  it("whole word skips matches inside longer words, including accented ones", () => {
    const re = regex({ mode: "text", query: "Ann", wholeWord: true });
    expect("Anne Annécy Ann.".match(re)).toEqual(["Ann"]);
  });

  it("reports an invalid regex instead of throwing", () => {
    expect(buildPattern({ mode: "regex", query: "(unclosed" })).toHaveProperty("error");
    expect(buildPattern({ mode: "text", query: "   " })).toHaveProperty("error");
  });
});

describe("findMatches", () => {
  it("finds a match split across several text items", () => {
    const items = [{ str: "Call 06 12" }, { str: " 34 56 78" }, { str: " now", hasEOL: true }];
    const [m] = findMatches(items, regex({ mode: "phone" }), "phone");
    expect(m.text).toBe("06 12 34 56 78");
    expect(m.segments).toEqual([
      { item: 0, from: 5, to: 10 },
      { item: 1, from: 0, to: 9 },
    ]);
  });

  it("keeps phone candidates with 7 to 15 digits only", () => {
    const items = [{ str: "Room 12-34, ref 2026, tel +33 1 23 45 67 89" }];
    expect(findMatches(items, regex({ mode: "phone" }), "phone").map((m) => m.text)).toEqual(["+33 1 23 45 67 89"]);
  });

  it("finds email addresses", () => {
    const items = [{ str: "Write to jane.doe+hr@example.co.uk or bob@ex.io.", hasEOL: true }];
    expect(findMatches(items, regex({ mode: "email" }), "email").map((m) => m.text)).toEqual([
      "jane.doe+hr@example.co.uk",
      "bob@ex.io",
    ]);
  });

  it("survives zero-length matches and honours the limit", () => {
    const items = [{ str: "aaaa" }];
    expect(findMatches(items, /a*?/g)).toEqual([]);
    expect(findMatches(items, /a/g, "regex", 2)).toHaveLength(2);
  });
});

describe("geometry", () => {
  it("places a character range proportionally along a horizontal item", () => {
    // 10 characters, 100 pt wide, font size 10, baseline at (50, 700).
    const r = boundingRect(itemQuad([10, 0, 0, 10, 50, 700], 100, 2, 5, 10));
    expect(r.x).toBeCloseTo(50 + 20 - 1.5);
    expect(r.x + r.width).toBeCloseTo(50 + 50 + 1.5);
    expect(r.y).toBeCloseTo(700 - 2.8);
    expect(r.y + r.height).toBeCloseTo(710);
  });

  it("follows rotated text", () => {
    // Text running straight up: direction (0, 1), "up" (-1, 0).
    const r = boundingRect(itemQuad([0, 10, -10, 0, 100, 100], 50, 0, 10, 10));
    expect(r.height).toBeGreaterThan(45);
    expect(r.width).toBeCloseTo(12.8);
  });

  it("clamps to the page and drops empty rects", () => {
    expect(clampRect({ x: -10, y: 5, width: 30, height: 10 }, { width: 100, height: 100 })).toEqual({ x: 0, y: 5, width: 20, height: 10 });
    expect(clampRect({ x: 120, y: 5, width: 30, height: 10 }, { width: 100, height: 100 })).toBeNull();
    expect(clampRect({ x: 30, y: 30, width: -10, height: -10 }, { width: 100, height: 100 })).toEqual({ x: 20, y: 20, width: 10, height: 10 });
  });

  it("grows pixel rects outward so anti-aliased edges are covered", () => {
    expect(toPixels({ x: 10.2, y: 10.7, width: 5, height: 5 }, 2)).toEqual({ x: 19, y: 20, width: 13, height: 13 });
  });
});

async function samplePdf(): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle("SECRET_TITLE");
  doc.setAuthor("SECRET_AUTHOR");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const text of ["Patient: John SECRETNAME, born 1970", "Nothing to hide on this page"]) {
    const page = doc.addPage([400, 300]);
    page.drawText(text, { x: 40, y: 200, size: 14, font });
  }
  return doc.save();
}

async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 });
  const doc = await task.promise;
  const out: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    out.push(content.items.map((it) => ("str" in it ? it.str : "")).join(""));
  }
  await task.destroy();
  return out;
}

// 1×1 white PNG, standing in for the rendered page (no canvas in Node).
const PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC"),
  (c) => c.charCodeAt(0),
);

describe("searchPdf", () => {
  it("returns a box over the matched word, in top-left page coordinates", async () => {
    const result = await searchPdf(toBuffer(await samplePdf()), { mode: "text", query: "secretname" });
    expect(result.matches).toBe(1);
    expect(result.boxes).toHaveLength(1);
    const [box] = result.boxes;
    expect(box.pageIndex).toBe(0);
    expect(box.text).toBe("SECRETNAME");
    // Baseline at y=200 from the bottom of a 300 pt page → ~100 pt from the top.
    expect(box.rect.y).toBeLessThan(100);
    expect(box.rect.y + box.rect.height).toBeGreaterThan(100);
    expect(box.rect.x).toBeGreaterThan(40);
    expect(box.rect.x + box.rect.width).toBeLessThan(330);
  });
});

describe("assembleRedactedPdf", () => {
  it("replaces redacted pages by an image, keeps the others, and drops metadata", async () => {
    const original = await samplePdf();
    const out = await assembleRedactedPdf(toBuffer(original), new Map([[0, { bytes: PNG, format: "png", width: 400, height: 300 }]]));
    const texts = await pageTexts(out);
    expect(texts).toHaveLength(2);
    expect(texts[0]).toBe("");
    expect(texts[1]).toContain("Nothing to hide");
    const raw = Buffer.from(out).toString("latin1");
    expect(raw).not.toContain("SECRETNAME");
    expect(raw).not.toContain("SECRET_TITLE");

    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(out);
    expect(doc.getTitle()).toBeUndefined();
    expect(doc.getAuthor()).toBeUndefined();
    expect(doc.getPage(0).getSize()).toEqual({ width: 400, height: 300 });
  });
});
