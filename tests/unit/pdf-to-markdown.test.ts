import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

// Run the real conversion code in Node: only the pdf.js loader is swapped for
// the legacy (Node-compatible) build with local asset paths.
const root = join(__dirname, "..", "..");
vi.mock("@/lib/pdfjs", async () => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return {
    PDFJS_ASSET_VERSION: "test",
    loadPdfjs: async () => pdfjs,
    openPdf: async (data: ArrayBuffer | Uint8Array) =>
      pdfjs.getDocument({
        data: new Uint8Array(data),
        standardFontDataUrl: join(root, "node_modules/pdfjs-dist/standard_fonts/"),
        cMapUrl: join(root, "node_modules/pdfjs-dist/cmaps/"),
        cMapPacked: true,
        verbosity: 0,
      }),
  };
});

const { convertPdfToMarkdown, convertPdfToText } = await import("@/lib/pdf-to-markdown");

const fixture = (name: string) => {
  const bytes = readFileSync(join(root, "tests/fixtures/generated", name));
  return new File([bytes], name, { type: "application/pdf" });
};

describe("PDF -> Markdown structure", () => {
  it("rebuilds headings, emphasis and lists", async () => {
    const { output, pageCount, ocrPages } = await convertPdfToMarkdown(fixture("text-simple.pdf"));
    expect(pageCount).toBe(1);
    expect(ocrPages).toBe(0);
    expect(output).toContain("# Quarterly Report");
    expect(output).toMatch(/^##+ Executive Summary$/m);
    expect(output).toContain("**bold phrase**");
    expect(output).toContain("*in italics*");
    expect(output).toContain("- First bullet item\n- Second bullet item\n- Third bullet item");
    expect(output).toContain("1. Open the file\n2. Check the output\n3. Download the result");
  });

  it("plain text mode adds no Markdown syntax", async () => {
    const { output } = await convertPdfToText(fixture("text-simple.pdf"));
    expect(output).toContain("Quarterly Report");
    expect(output).not.toContain("#");
    expect(output).not.toContain("**");
    expect(output).toContain("bold phrase");
    expect(output).toContain("First bullet item");
  });

  it("extracts every page of a long document in order", async () => {
    const { output, pageCount } = await convertPdfToMarkdown(fixture("pages-100.pdf"));
    expect(pageCount).toBe(100);
    const positions = [1, 50, 100].map((i) => output.indexOf(`MARKER-PAGE-${i} `));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("keeps accented and Arabic characters from an embedded Unicode font", async () => {
    const { output } = await convertPdfToMarkdown(fixture("multilingual-text.pdf"));
    expect(output).toContain("déçu");
    expect(output).toContain("größeren");
    expect(output).toMatch(/[؀-ۿ]/);
  });

  it("stops when cancelled", async () => {
    const controller = new AbortController();
    const run = convertPdfToMarkdown(fixture("pages-300.pdf"), {
      signal: controller.signal,
      onProgress: (p) => {
        if (p.page === 5) controller.abort();
      },
    });
    await expect(run).rejects.toMatchObject({ name: "CancelledError" });
  });
});

describe("PDF -> Markdown tables", () => {
  it("rebuilds a table as a Markdown table and reports it", async () => {
    const { output, tables } = await convertPdfToMarkdown(fixture("table.pdf"));
    expect(output).toContain("| Plan | Price | Pages |");
    expect(output).toContain("| --- | --- | --- |");
    expect(output).toContain("| Team | USD 12 | Unlimited |");
    expect(tables).toEqual([
      {
        page: 1,
        rows: [
          ["Plan", "Price", "Pages"],
          ["Starter", "USD 0", "Unlimited"],
          ["Team", "USD 12", "Unlimited"],
        ],
      },
    ]);
  });

  it("does not mistake a two-column layout for a table", async () => {
    const { output, tables } = await convertPdfToMarkdown(fixture("columns.pdf"));
    expect(tables).toEqual([]);
    expect(output).not.toContain("|");
    expect(output).toContain("LEFTCOL");
    expect(output).toContain("RIGHTCOL");
    // Read column by column: the left column is one paragraph that ends before
    // the right column starts, instead of the two interleaving line by line.
    const left = output.slice(output.indexOf("LEFTCOL"), output.indexOf("RIGHTCOL"));
    expect(left.trim().split("\n").filter(Boolean)).toHaveLength(1);
    expect(left.split(" ").length).toBeGreaterThan(30);
  });

  it("returns each page's output for mapping text back to its page", async () => {
    const { pageOutputs, pageCount } = await convertPdfToMarkdown(fixture("pages-10.pdf"));
    expect(pageOutputs).toHaveLength(pageCount);
    pageOutputs.forEach((p, i) => expect(p).toContain(`MARKER-PAGE-${i + 1} `));
  });
});

