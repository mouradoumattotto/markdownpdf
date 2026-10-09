import { unzipSync, zipSync, strToU8 } from "fflate";
import { writeFileSync } from "node:fs";
import { test, expect, upload, downloadBytes, pdfInfo, gaEvents, expectNoHorizontalScroll } from "./helpers";

test.describe("Unlock PDF", () => {
  test("removes the open password once the right one is given @cross", async ({ page }) => {
    await page.goto("/unlock-pdf");
    await upload(page, "encrypted.pdf");
    await page.getByLabel("Password", { exact: true }).fill("wrong");
    await page.getByRole("button", { name: "Unlock PDF" }).click();
    await expect(page.getByText("That password is not correct")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("secret");
    await page.getByRole("button", { name: "Unlock PDF" }).click();
    await expect(page.getByText("PDF unlocked")).toBeVisible();

    const out = await downloadBytes(page, () => page.getByRole("button", { name: "Download unlocked PDF" }).click());
    expect(Buffer.from(out.bytes).toString("latin1")).not.toContain("/Encrypt");
    expect((await pdfInfo(out.bytes)).pages).toBe(1);
  });

  test("the encrypted-PDF error elsewhere points to Unlock PDF", async ({ page, problems }) => {
    await page.goto("/split-pdf");
    await upload(page, "encrypted.pdf");
    await expect(page.locator('p[role="alert"]')).toContainText("Unlock PDF");
    // pdf.js logs the password exception itself; that one is expected here.
    problems.console.length = 0;
  });
});

test.describe("Redact PDF", () => {
  test("searched text is gone from the saved PDF, other pages keep theirs @cross", async ({ page }) => {
    await page.goto("/redact-pdf");
    await upload(page, "text-simple.pdf");
    await expect(page.getByTestId("redact-summary")).toBeVisible();
    await page.getByLabel("Text to redact").fill("Quarterly Report");
    await page.getByRole("button", { name: "Mark all matches" }).click();
    await expect(page.getByTestId("search-note")).toContainText(/1 match|1 new/);
    await page.getByRole("button", { name: "Redact and save" }).click();
    await expect(page.getByTestId("redact-done")).toBeVisible();

    const out = await downloadBytes(page, () => page.getByTestId("redact-done").getByRole("button", { name: /^Download/ }).click());
    const info = await pdfInfo(out.bytes);
    expect(info.text).not.toContain("Quarterly");
    expect(info.text).not.toContain("Executive Summary");
    expect(info.images).toBeGreaterThan(0);
    expect(Buffer.from(out.bytes).toString("latin1")).not.toContain("Quarterly Report");
    await expectNoHorizontalScroll(page);
  });
});

test.describe("HTML to PDF", () => {
  test("an .html file becomes a PDF with its text, without scripts", async ({ page }) => {
    await page.goto("/html-to-pdf");
    await upload(page, "sample.html");
    await page.getByRole("button", { name: "Convert to PDF" }).click();
    await expect(page.getByText("PDF ready")).toBeVisible();
    const out = await downloadBytes(page, () => page.getByRole("button", { name: "Download PDF" }).click());
    const { text } = await pdfInfo(out.bytes);
    expect(text).toContain("Release Notes");
    expect(text).toContain("Second change");
    expect(text).not.toContain("alert");
  });
});

/** A minimal, valid EPUB 3 with two chapters. */
function buildEpub(path: string) {
  const xhtml = (title: string, body: string) =>
    `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title}</title></head><body>${body}</body></html>`;
  const files = {
    mimetype: [strToU8("application/epub+zip"), { level: 0 }] as [Uint8Array, { level: 0 }],
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
    ),
    "OEBPS/content.opf": strToU8(
      `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">urn:uuid:1</dc:identifier><dc:title>The Test Book</dc:title><dc:language>en</dc:language></metadata><manifest><item id="c2" href="two.xhtml" media-type="application/xhtml+xml"/><item id="c1" href="one.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/><itemref idref="c2"/></spine></package>`,
    ),
    "OEBPS/one.xhtml": strToU8(xhtml("One", "<h1>Chapter One</h1><p>The lighthouse keeper counted ships.</p>")),
    "OEBPS/two.xhtml": strToU8(xhtml("Two", "<h1>Chapter Two</h1><p>The storm arrived at midnight.</p>")),
  };
  writeFileSync(path, zipSync(files));
}

test.describe("EPUB ↔ PDF", () => {
  test("an EPUB becomes a PDF in spine order", async ({ page }, info) => {
    const path = info.outputPath("book.epub");
    buildEpub(path);
    await page.goto("/epub-to-pdf");
    await page.locator('input[type="file"]').first().setInputFiles(path);
    await expect(page.getByTestId("epub-pdf-done")).toBeVisible();
    const out = await downloadBytes(page, () => page.getByTestId("epub-pdf-done").getByRole("button", { name: /^Download/ }).click());
    const { text } = await pdfInfo(out.bytes);
    expect(text.indexOf("Chapter One")).toBeGreaterThanOrEqual(0);
    expect(text.indexOf("Chapter One")).toBeLessThan(text.indexOf("Chapter Two"));
    expect(text).toContain("lighthouse keeper");
  });

  test("a PDF becomes a valid EPUB with mimetype first", async ({ page }) => {
    await page.goto("/pdf-to-epub");
    await upload(page, "text-simple.pdf");
    await expect(page.getByTestId("pdf-epub-done")).toBeVisible();
    const out = await downloadBytes(page, () => page.getByTestId("pdf-epub-done").getByRole("button", { name: /^Download/ }).click());
    expect(out.name).toMatch(/\.epub$/);
    const bytes = new Uint8Array(out.bytes);
    // The first local file header must be the uncompressed "mimetype".
    expect(Buffer.from(bytes.slice(30, 38)).toString()).toBe("mimetype");
    const entries = unzipSync(bytes);
    expect(new TextDecoder().decode(entries.mimetype)).toBe("application/epub+zip");
    const chapters = Object.keys(entries).filter((n) => n.endsWith(".xhtml") && !n.endsWith("nav.xhtml"));
    const all = chapters.map((n) => new TextDecoder().decode(entries[n])).join("\n");
    expect(all).toContain("Quarterly Report");
  });
});

test.describe("PNG pages", () => {
  test("PDF to PNG defaults to PNG and reports its own tool name", async ({ page }) => {
    await page.goto("/pdf-to-png");
    await upload(page, "pages-10.pdf");
    await page.getByLabel(/^All 10 pages/).uncheck();
    await page.getByLabel("Pages to convert").fill("1");
    await page.getByLabel("Resolution").selectOption("72");
    await page.getByRole("button", { name: "Convert 1 page to PNG" }).click();
    await expect(page.getByTestId("images-result")).toContainText("✓ 1 image");
    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "pdf-to-png", output_format: "png" });
  });
});
