import { test, expect, upload, downloadText, downloadBytes, eventNames, gaEvents, expectNoHorizontalScroll, pdfInfo } from "./helpers";

test.describe("PDF to Text", () => {
  test("extracts plain text without Markdown syntax @cross", async ({ page }) => {
    await page.goto("/pdf-to-text");
    await upload(page, "text-simple.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
    const text = await page.getByLabel("Converted Text").inputValue();
    expect(text).toContain("Quarterly Report");
    expect(text).toContain("First bullet item");
    expect(text).not.toContain("# ");
    expect(text).not.toContain("**");

    const file = await downloadText(page, () => page.getByRole("button", { name: "Download .txt" }).click());
    expect(file.name).toBe("text-simple.txt");
    expect(file.text).toBe(text);
    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "pdf-to-text", output_format: "txt" });
  });

  test("runs OCR on a scanned PDF", async ({ page }) => {
    await page.goto("/pdf-to-text");
    await upload(page, "scanned-en.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible({ timeout: 120_000 });
    expect((await page.getByLabel("Converted Text").inputValue()).toLowerCase()).toContain("brown fox");
  });
});

test.describe("OCR a PDF", () => {
  test("adds a text layer to a scanned page and keeps typed pages as they are", async ({ page }) => {
    await page.goto("/ocr-pdf");
    await upload(page, "mixed-text-and-scan.pdf");
    await expect(page.getByTestId("ocr-done")).toBeVisible({ timeout: 150_000 });
    await expect(page.getByTestId("ocr-done")).toContainText("1 of 2 pages recognised");

    const file = await downloadBytes(page, () => page.getByRole("button", { name: /^Download .*searchable\.pdf$/ }).click());
    const info = await pdfInfo(file.bytes);
    expect(info.pages).toBe(2);
    // Page 1 kept its original text, page 2 gained a text layer it did not have.
    expect(info.text).toContain("TEXTPAGE");
    expect(info.text.toLowerCase()).toContain("brown fox");

    const done = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(done).toMatchObject({ tool_name: "ocr-pdf", ocr_used: true, ocr_language: "eng" });
    expect(await eventNames(page)).toEqual(expect.arrayContaining(["ocr_start", "ocr_complete", "output_download"]));
  });

  test("says so when the PDF already has text", async ({ page }) => {
    await page.goto("/ocr-pdf");
    await upload(page, "text-simple.pdf");
    await expect(page.locator('p[role="alert"]')).toContainText(/already contains real text/);
  });

  test("reads a French scan when French is selected", async ({ page }) => {
    await page.goto("/ocr-pdf");
    await page.getByLabel("Language of the document:").selectOption("fra");
    await upload(page, "scanned-fr.pdf");
    await expect(page.getByTestId("ocr-done")).toBeVisible({ timeout: 150_000 });
    const file = await downloadBytes(page, () => page.getByRole("button", { name: /^Download / }).click());
    const info = await pdfInfo(file.bytes);
    expect(info.text).toMatch(/Facture|num[ée]ris[ée]e/);
  });
});

test.describe("Image to Text", () => {
  test("reads a screenshot @cross", async ({ page }) => {
    await page.goto("/image-to-text");
    await upload(page, "image-en.png");
    await expect(page.getByLabel("Recognised text")).toHaveValue(/brown fox/i, { timeout: 120_000 });
    const file = await downloadText(page, () => page.getByRole("button", { name: "Download .txt" }).click());
    expect(file.name).toBe("extracted-text.txt");
    expect(file.text.toLowerCase()).toContain("lazy dog");
  });

  test("reads Arabic when Arabic is selected", async ({ page }) => {
    await page.goto("/image-to-text");
    await page.getByLabel("Language in the image:").selectOption("ara");
    await upload(page, "image-ar.png");
    await expect(page.getByLabel("Recognised text")).toHaveValue(/مرحبا|بالعالم/, { timeout: 120_000 });
  });

  test("handles several images and labels each one", async ({ page }) => {
    await page.goto("/image-to-text");
    await upload(page, ["image-en.png", "image-small.png"]);
    await expect(page.getByLabel("Recognised text")).toHaveValue(/image-small\.png/, { timeout: 150_000 });
    const text = await page.getByLabel("Recognised text").inputValue();
    expect(text.toLowerCase()).toContain("brown fox");
    expect(text.toLowerCase()).toContain("photo page");
    const done = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(done).toMatchObject({ tool_name: "image-to-text", file_count_bucket: "2-5" });
  });

  test("rejects a non-image file", async ({ page }) => {
    await page.goto("/image-to-text");
    await upload(page, "sample.csv");
    await expect(page.locator('p[role="alert"]')).toContainText(/not images/);
  });

  test("works on a phone @mobile", async ({ page }) => {
    await page.goto("/image-to-text");
    await expectNoHorizontalScroll(page);
    await upload(page, "image-small.png");
    await expect(page.getByLabel("Recognised text")).toHaveValue(/photo page/i, { timeout: 120_000 });
    await expectNoHorizontalScroll(page);
  });
});
