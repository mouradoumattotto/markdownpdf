import { test, expect, upload, downloadText, downloadBytes, eventNames, gaEvents, expectNoPrivateDataInEvents, expectNoHorizontalScroll } from "./helpers";

const output = (page: import("@playwright/test").Page) => page.getByLabel("Converted Markdown");

test.describe("PDF to Markdown (/)", () => {
  test("rebuilds structure from a text PDF, downloads it, and tracks the funnel @cross", async ({ page }) => {
    await page.goto("/");
    await upload(page, "text-simple.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
    const md = await output(page).inputValue();
    expect(md).toContain("# Quarterly Report");
    expect(md).toMatch(/^##+ Executive Summary/m);
    expect(md).toContain("- First bullet item");
    expect(md).toContain("1. Open the file");
    expect(md).toContain("**bold phrase**");
    expect(md).toContain("*in italics*");

    const file = await downloadText(page, () => page.getByRole("button", { name: "Download .md" }).click());
    expect(file.name).toBe("text-simple.md");
    expect(file.text).toBe(md);

    const names = await eventNames(page);
    expect(names).toEqual(
      expect.arrayContaining(["file_selected", "conversion_start", "conversion_success", "output_download"]),
    );
    const success = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(success).toMatchObject({ tool_name: "pdf-to-markdown", input_format: "pdf", output_format: "md", page_count_bucket: "1", ocr_used: false });
    await expectNoPrivateDataInEvents(page, ["Quarterly", "text-simple", "bullet"]);
  });

  test("runs OCR on a scanned page with the self-hosted engine @cross", async ({ page }) => {
    const ocrRequests: string[] = [];
    page.on("request", (r) => {
      if (/\/ocr\//.test(r.url())) ocrRequests.push(new URL(r.url()).pathname);
    });
    await page.goto("/");
    await upload(page, "scanned-en.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible({ timeout: 120_000 });
    const md = (await output(page).inputValue()).toLowerCase();
    expect(md).toContain("brown fox");
    expect(md).toContain("lazy dog");
    await expect(page.getByText("(1 via OCR)")).toBeVisible();
    expect(ocrRequests.some((p) => p.endsWith("/lang/eng.traineddata.gz"))).toBe(true);
    const names = await eventNames(page);
    expect(names).toEqual(expect.arrayContaining(["ocr_start", "ocr_complete", "conversion_success"]));
    const done = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(done).toMatchObject({ ocr_used: true, ocr_language: "eng" });
  });

  test("reads a French scan when French is selected, and remembers the choice", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Language of scanned pages:").selectOption("fra");
    await upload(page, "scanned-fr.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible({ timeout: 120_000 });
    const md = await output(page).inputValue();
    expect(md).toMatch(/Facture num[ée]ris[ée]e/);
    expect(md).toMatch(/trente jours/);
    expect(md).toMatch(/d[ée]çu/);
    await page.reload();
    await expect(page.getByLabel("Language of scanned pages:")).toHaveValue("fra");
  });

  test("reads an Arabic scan when Arabic is selected", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Language of scanned pages:").selectOption("ara");
    await upload(page, "scanned-ar.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible({ timeout: 120_000 });
    const md = await output(page).inputValue();
    expect(md).toMatch(/مرحبا|بالعالم/);
    expect(md).toMatch(/شكرا|ثقتكم/);
  });

  test("mixes text extraction and OCR in one document", async ({ page }) => {
    await page.goto("/");
    await upload(page, "mixed-text-and-scan.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible({ timeout: 120_000 });
    const md = await output(page).inputValue();
    expect(md).toContain("TEXTPAGE");
    expect(md.toLowerCase()).toContain("brown fox");
    await expect(page.getByText("2 pages (1 via OCR)")).toBeVisible();
  });

  test("keeps both columns and table cells, and non-Latin text", async ({ page }) => {
    await page.goto("/");
    await upload(page, "columns.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
    let md = await output(page).inputValue();
    expect(md).toContain("LEFTCOL");
    expect(md).toContain("RIGHTCOL");

    await upload(page, "table.pdf");
    await expect(output(page)).toHaveValue(/Starter/);
    md = await output(page).inputValue();
    for (const cell of ["Plan", "Price", "Starter", "USD 12", "Unlimited"]) expect(md).toContain(cell);

    await upload(page, "multilingual-text.pdf");
    await expect(output(page)).toHaveValue(/Rapport multilingue/);
    md = await output(page).inputValue();
    expect(md).toContain("déçu");
    expect(md).toContain("größeren");
    expect(md).toContain("pingüino");
    expect(md).toMatch(/[؀-ۿ]/);
  });

  test("can be cancelled mid-conversion", async ({ page }) => {
    await page.goto("/");
    await upload(page, "pages-300.pdf");
    await expect(page.getByText(/page \d+ of 300/)).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeHidden();
    await expect(page.getByText("Conversion complete")).toBeHidden();
    await expect(page.getByText(/Drop your PDF here/)).toBeVisible();
    expect(await eventNames(page)).toContain("conversion_cancel");
    // And the tool still works afterwards.
    await upload(page, "text-simple.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
  });

  test("can cancel during OCR", async ({ page }) => {
    await page.goto("/");
    await upload(page, "scanned-en.pdf");
    await expect(page.getByText(/OCR/).first()).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText(/Drop your PDF here/)).toBeVisible();
    expect(await eventNames(page)).toContain("conversion_cancel");
  });

  for (const [file, message, code] of [
    ["empty.pdf", /file is empty/, "empty_file"],
    ["not-a-pdf.pdf", /not a PDF/, "not_supported_type"],
    ["corrupted.pdf", /could not be read as a PDF/, "corrupted"],
    ["encrypted.pdf", /password-protected/, "encrypted"],
  ] as const) {
    test(`explains a bad input: ${file}`, async ({ page, problems }) => {
      await page.goto("/");
      await upload(page, file);
      await expect(page.locator('p[role="alert"]')).toContainText(message);
      const err = (await gaEvents(page)).find(([n]) => n === "conversion_error")![1];
      expect(err.error_code).toBe(code);
      // pdf.js logs its own parse failure for damaged files; that one is expected.
      problems.console.length = 0;
    });
  }

  test("is usable on a phone @mobile", async ({ page }) => {
    await page.goto("/");
    await expectNoHorizontalScroll(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("PDF to Markdown");
    await upload(page, "text-simple.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
    await expect(output(page)).toHaveValue(/# Quarterly Report/);
    await expectNoHorizontalScroll(page);
  });

  test("keyboard users can reach and open the file picker", async ({ page }) => {
    await page.goto("/");
    const zone = page.getByRole("button", { name: /Drop your PDF here/ });
    await zone.focus();
    await expect(zone).toBeFocused();
    const chooser = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");
    await chooser;
  });
});

test.describe("PDF to Markdown — images", () => {
  test("extracts embedded images in place, once each, skipping decoration @cross", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Extract images").check();
    await upload(page, "with-images.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
    const md = await page.getByLabel("Converted Markdown").inputValue();
    const refs = [...md.matchAll(/!\[\]\(images\/([^)]+)\)/g)].map((m) => m[1]);
    expect(refs).toHaveLength(3);
    // Each image sits between the text above and below it.
    const photo = md.indexOf(`images/${refs[1]}`);
    expect(md.indexOf("Text before the image on page 1.")).toBeLessThan(photo);
    expect(photo).toBeLessThan(md.indexOf("Text after the image on page 1."));
    const chart = md.indexOf(`images/${refs[2]}`);
    expect(md.indexOf("Text before the image on page 2.")).toBeLessThan(chart);
    expect(refs[2]).toMatch(/^page-2-/);

    const { unzipSync } = await import("fflate");
    const zip = await downloadBytes(page, () => page.getByRole("button", { name: "Download .zip (with images)" }).click());
    expect(zip.name).toBe("with-images.zip");
    const entries = Object.keys(unzipSync(new Uint8Array(zip.bytes))).sort();
    expect(entries).toEqual(["with-images.md", ...refs.map((r) => `images/${r}`)].sort());
    // The 800×600 photo is large and opaque: saved as JPEG.
    expect(refs[1]).toMatch(/\.jpg$/);
  });

  test("leaves images out unless asked", async ({ page }) => {
    await page.goto("/");
    await upload(page, "with-images.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
    expect(await page.getByLabel("Converted Markdown").inputValue()).not.toContain("![](");
    await expect(page.getByRole("button", { name: /with images/ })).toHaveCount(0);
  });
});
