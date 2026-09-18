import type { Page } from "@playwright/test";
import { test, expect, downloadBytes, eventNames, gaEvents, expectNoHorizontalScroll, fixture, pdfInfo } from "./helpers";

const editor = (page: Page) => page.getByLabel("Markdown input");
const preview = (page: Page) => page.getByTestId("md-preview");
const quick = (page: Page) => page.getByRole("button", { name: "Download PDF" });

async function quickPdf(page: Page) {
  const file = await downloadBytes(page, () => quick(page).click());
  return { name: file.name, ...(await pdfInfo(file.bytes)) };
}

test.describe("Markdown to PDF", () => {
  test("quick export produces real, highlighted text with checkboxes @cross", async ({ page }) => {
    await page.goto("/markdown-to-pdf");
    await expect(preview(page).locator("h1")).toHaveText("Project Proposal");
    await expect(preview(page).locator("code .hljs-keyword").first()).toBeVisible();
    const pdf = await quickPdf(page);
    expect(pdf.name).toBe("project-proposal.pdf");
    expect(pdf.pages).toBeGreaterThanOrEqual(1);
    for (const s of ["Project Proposal", "Beta release", "Single sign-on support", "console.log"]) expect(pdf.text).toContain(s);
    const names = await eventNames(page);
    expect(names).toEqual(expect.arrayContaining(["conversion_start", "conversion_success", "output_download"]));
    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "markdown-to-pdf", export_mode: "quick", output_format: "pdf" });
  });

  test("renders Mermaid and LaTeX in the preview and embeds them in the PDF", async ({ page }) => {
    await page.goto("/markdown-to-pdf");
    await page.getByRole("button", { name: "Try diagrams & math" }).click();
    await expect(preview(page).locator(".mermaid-block svg")).toBeVisible({ timeout: 60_000 });
    await expect(preview(page).locator(".math-display svg")).toBeVisible({ timeout: 60_000 });
    await expect(preview(page).locator(".math-inline svg")).toBeVisible();
    await expect(preview(page).locator("del")).toHaveText("Old approach");
    const pdf = await quickPdf(page);
    expect(pdf.text).toContain("Architecture Notes");
    expect(pdf.text).toContain("tokens");
    // Diagram + display formula + inline formula, at least.
    expect(pdf.images).toBeGreaterThanOrEqual(3);
  });

  test("embeds a Unicode font for Greek and Cyrillic text", async ({ page }) => {
    await page.goto("/markdown-to-pdf");
    await editor(page).fill("# Ελληνικά και Русский\n\nΚαλημέρα κόσμε. Привет, мир → готово ✓\n\n**Жирный** и *курсив*.");
    const pdf = await quickPdf(page);
    expect(pdf.text).toContain("Ελληνικά");
    expect(pdf.text).toContain("Привет");
    expect(pdf.text).toContain("Жирный");
  });

  test("routes Arabic text to the browser engine, which prints it correctly", async ({ page }) => {
    await page.goto("/markdown-to-pdf");
    await editor(page).fill("# فاتورة\n\nمرحبا بالعالم، شكرا لكم على ثقتكم.\n\n$$a^2 + b^2 = c^2$$");
    await expect(quick(page)).toBeDisabled();
    await expect(page.getByText("contains Arabic text")).toBeVisible();
    await expect(preview(page).locator(".math-display svg")).toBeVisible({ timeout: 60_000 });
    await page.evaluate(() => {
      (window as unknown as { __printed: number }).__printed = 0;
      window.print = () => {
        (window as unknown as { __printed: number }).__printed++;
      };
    });
    await page.getByRole("button", { name: "Save as PDF (full fidelity)" }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __printed: number }).__printed)).toBe(1);
    await expect(page.locator("#md-print-root .md-doc")).toContainText("مرحبا");
    const bytes = await page.pdf({ format: "A4" });
    const info = await pdfInfo(bytes);
    expect(info.pages).toBe(1); // only the document, not the site around it
    expect(info.text).toMatch(/[؀-ۿ]/);
    expect(info.text).not.toContain("All MarkdownPDF tools");
    const ok = (await gaEvents(page)).find(([n, p]) => n === "conversion_success" && p.export_mode === "print");
    expect(ok).toBeTruthy();
  });

  test("uses attached local images and reports missing ones", async ({ page }) => {
    await page.goto("/markdown-to-pdf");
    await editor(page).fill("# Photos\n\n![Sample](image-sample.jpg)\n\n![Missing one](nowhere.png)\n");
    await expect(page.getByText("2 image(s) not found")).toBeVisible();
    await page.getByTestId("image-input").setInputFiles(fixture("image-sample.jpg"));
    await expect(page.getByRole("button", { name: "Remove image-sample.jpg" })).toBeVisible();
    await expect(preview(page).locator('img[alt="Sample"]')).toHaveAttribute("src", /^blob:/);
    await expect(page.getByText("1 image(s) not found")).toBeVisible();
    const pdf = await quickPdf(page);
    expect(pdf.images).toBe(1);
    expect(pdf.text).toContain("Missing one");
    await expect(page.getByText(/could not be embedded/)).toBeVisible();
  });

  test("keeps going when a diagram has a syntax error", async ({ page, problems }) => {
    await page.goto("/markdown-to-pdf");
    await editor(page).fill("# Broken\n\n```mermaid\nflowchart LR\n  A --> \n```\n\nText after.");
    await expect(preview(page).locator(".mermaid-error")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/diagram\(s\) contain a Mermaid syntax error/)).toBeVisible();
    const pdf = await quickPdf(page);
    expect(pdf.text).toContain("Text after.");
    // Mermaid reports its own parse error on the console; that one is expected.
    problems.console.length = 0;
  });

  test("does not treat prices as math", async ({ page }) => {
    await page.goto("/markdown-to-pdf");
    await editor(page).fill("It costs $5 and $10 today.");
    await expect(preview(page)).toContainText("It costs $5 and $10 today.");
    await expect(preview(page).locator(".math-inline")).toHaveCount(0);
  });

  test("opens a .md file", async ({ page }) => {
    await page.goto("/markdown-to-pdf");
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Open .md file" }).click();
    await (await chooser).setFiles({ name: "notes.md", mimeType: "text/markdown", buffer: Buffer.from("# From a file\n\nHello.") });
    await expect(preview(page).locator("h1")).toHaveText("From a file");
    expect(await eventNames(page)).toContain("file_selected");
  });

  test("works on a phone @mobile", async ({ page }) => {
    await page.goto("/markdown-to-pdf");
    await expectNoHorizontalScroll(page);
    await page.getByRole("tab", { name: "preview" }).click();
    await expect(preview(page).locator("h1")).toHaveText("Project Proposal");
    await expectNoHorizontalScroll(page);
  });

  test("the cheat sheet can still be downloaded as a PDF", async ({ page }) => {
    await page.goto("/blog/markdown-cheat-sheet");
    const file = await downloadBytes(page, () => page.getByRole("button", { name: "Download as PDF" }).click());
    const info = await pdfInfo(file.bytes);
    expect(info.pages).toBeGreaterThanOrEqual(2);
    expect(info.text).toContain("Markdown Cheat Sheet");
  });
});
