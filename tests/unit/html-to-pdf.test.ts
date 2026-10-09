// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EmptyHtmlError, htmlTitle, htmlToPdf, pdfFileName, prepareHtml } from "@/lib/html-to-pdf";

const root = join(__dirname, "..", "..");
const sample = readFileSync(join(root, "tests/fixtures/generated/sample.html")).toString();

const PAGE = `<!doctype html><html><head><title> Quarterly
  update </title><script>alert(1)</script></head><body>
<header><a href="/">Site</a></header>
<nav><a href="/a">Menu A</a></nav>
<main><h1>Report</h1><p>Revenue grew <strong>12%</strong>.</p><img src="img/chart.png" alt="Growth chart"></main>
<footer>Copyright footer</footer></body></html>`;

describe("htmlTitle", () => {
  it("prefers <title>, collapses whitespace, falls back to the first heading", () => {
    expect(htmlTitle(PAGE)).toBe("Quarterly update");
    expect(htmlTitle("<h1>Only a heading</h1><p>x</p>")).toBe("Only a heading");
    expect(htmlTitle("<p>no title</p>")).toBeUndefined();
  });
});

describe("prepareHtml", () => {
  it("keeps the main content and drops menus, footers and scripts by default", async () => {
    const { markdown, title } = await prepareHtml(PAGE);
    expect(title).toBe("Quarterly update");
    expect(markdown).toContain("# Report");
    expect(markdown).toContain("**12%**");
    expect(markdown).not.toContain("Menu A");
    expect(markdown).not.toContain("Copyright footer");
    expect(markdown).not.toContain("alert");
    expect(markdown).toContain("![Growth chart](img/chart.png)");
  });

  it("keeps everything but scripts when main-content extraction is off, and can drop images", async () => {
    const { markdown } = await prepareHtml(PAGE, { mainContentOnly: false, keepImages: false });
    expect(markdown).toContain("Menu A");
    expect(markdown).toContain("Copyright footer");
    expect(markdown).not.toContain("![");
    expect(markdown).toContain("Growth chart");
  });

  it("converts tables, lists and code from the shared fixture", async () => {
    const { markdown } = await prepareHtml(sample);
    expect(markdown).toContain("# Release Notes");
    expect(markdown).toContain("- First change");
    expect(markdown.replace(/[ \t]+/g, " ")).toContain("| Tool | Status |");
    expect(markdown).toContain("```js");
  });

  it("refuses HTML with no readable text", async () => {
    await expect(prepareHtml("<html><body><nav>Menu</nav><script>x()</script></body></html>")).rejects.toBeInstanceOf(
      EmptyHtmlError,
    );
    await expect(prepareHtml('<img src="a.png">')).rejects.toBeInstanceOf(EmptyHtmlError);
  });
});

describe("pdfFileName", () => {
  it("slugs the title, strips accents, falls back when empty", () => {
    expect(pdfFileName("Quarterly update — Q3 2026", "page")).toBe("quarterly-update-q3-2026.pdf");
    expect(pdfFileName("Café résumé", "page")).toBe("cafe-resume.pdf");
    expect(pdfFileName(undefined, "my-file")).toBe("my-file.pdf");
    expect(pdfFileName("日本語", "page")).toBe("page.pdf");
    expect(pdfFileName("a".repeat(80), "page")).toHaveLength(64);
  });
});

describe("htmlToPdf", () => {
  it("writes a PDF with the page's text and title", async () => {
    const result = await htmlToPdf(sample, { keepImages: false });
    expect(result.title).toBe("Sample");
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({ data: bytes, verbosity: 0 });
    const doc = await task.promise;
    const text = (await (await doc.getPage(1)).getTextContent()).items.map((i) => ("str" in i ? i.str : "")).join(" ");
    expect(text).toContain("Release Notes");
    expect(text).toContain("First change");
    await task.destroy();
  });
});
