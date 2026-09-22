import type { Page } from "@playwright/test";
import { test, expect, upload, downloadBytes, eventNames, gaEvents, expectNoHorizontalScroll, pdfInfo } from "./helpers";

const summary = (page: Page) => page.getByTestId("pdf-summary");

async function useCustom(page: Page, values: { pages?: string; words?: string; mb?: string }) {
  await page.getByRole("radio", { name: "Custom limits" }).click();
  if (values.pages) await page.getByLabel("Max pages per part").fill(values.pages);
  if (values.words) await page.getByLabel("Max words per part").fill(values.words);
  if (values.mb) await page.getByLabel("Max MB per part").fill(values.mb);
}

test.describe("Split PDF for AI", () => {
  test("says when no split is needed @cross", async ({ page }) => {
    await page.goto("/split-pdf-for-ai");
    await upload(page, "pages-10.pdf");
    await expect(summary(page)).toContainText("10 pages");
    await expect(page.getByTestId("fits")).toContainText("No split needed");
    expect(await eventNames(page)).toContain("file_selected");
  });

  test("splits a long PDF into parts and zips them", async ({ page }) => {
    await page.goto("/split-pdf-for-ai");
    await upload(page, "pages-50.pdf");
    await expect(summary(page)).toContainText("50 pages");
    await useCustom(page, { pages: "20" });
    await expect(page.getByTestId("plan-summary")).toHaveText("3 parts");
    await expect(page.getByText("pages 21–40")).toBeVisible();

    await page.getByRole("button", { name: "Create 3 PDFs" }).click();
    await expect(page.getByText("3 files ready")).toBeVisible();
    await expect(page.getByText("pages-50-part-02-p21-40.pdf")).toBeVisible();

    const first = await downloadBytes(page, () => page.getByRole("button", { name: "Download", exact: true }).first().click());
    const info = await pdfInfo(first.bytes);
    expect(info.pages).toBe(20);
    expect(info.text).toContain("MARKER-PAGE-1 ");
    expect(info.text).not.toContain("MARKER-PAGE-21 ");

    const zip = await downloadBytes(page, () => page.getByRole("button", { name: "Download all (.zip)" }).click());
    expect(zip.name).toBe("pages-50-parts.zip");
    expect(zip.bytes.subarray(0, 2).toString("latin1")).toBe("PK");

    const done = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(done).toMatchObject({ tool_name: "split-pdf-for-ai", target: "custom", file_count_bucket: "2-5" });
  });

  test("uses the PDF's bookmarks as chapters", async ({ page }) => {
    await page.goto("/split-pdf-for-ai");
    await upload(page, "outline.pdf");
    await expect(summary(page)).toContainText("3 chapters");
    await expect(page.getByLabel(/Split at chapter boundaries/)).toBeChecked();
    await expect(page.getByTestId("plan-summary")).toHaveText("3 parts");
    await expect(page.getByText("Chapter Two", { exact: false })).toBeVisible();

    // Unchecking packs by limits instead, which for this small file is one part.
    await page.getByLabel(/Split at chapter boundaries/).uncheck();
    await expect(page.getByTestId("fits")).toBeVisible();
  });

  test("applies the Claude 100-page rule", async ({ page }) => {
    await page.goto("/split-pdf-for-ai");
    await upload(page, "pages-300.pdf");
    await page.getByRole("radio", { name: "Claude (chat)" }).click();
    await expect(page.getByTestId("target-note")).toContainText("Charts and images are read only in PDFs of 100 pages or fewer");
    await expect(page.getByTestId("plan-summary")).toHaveText("3 parts");
    await expect(page.getByText("pages 101–200")).toBeVisible();
  });

  test("warns about scanned pages and links to OCR", async ({ page }) => {
    await page.goto("/split-pdf-for-ai");
    await upload(page, "mixed-text-and-scan.pdf");
    await expect(page.getByText(/1 of 2 pages have no text layer/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Convert with OCR" })).toHaveAttribute("href", "/");
  });

  test("refuses an encrypted PDF with a clear message", async ({ page, problems }) => {
    await page.goto("/split-pdf-for-ai");
    await upload(page, "encrypted.pdf");
    await expect(page.locator('p[role="alert"]')).toContainText(/password-protected/);
    const err = (await gaEvents(page)).find(([n]) => n === "conversion_error")![1];
    expect(err.error_code).toBe("encrypted");
    problems.console.length = 0;
  });

  test("can be cancelled while analysing", async ({ page }) => {
    await page.goto("/split-pdf-for-ai");
    await upload(page, "pages-300.pdf");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText(/Drop the PDF to split/)).toBeVisible();
    expect(await eventNames(page)).toContain("conversion_cancel");
  });

  test("works on a phone @mobile", async ({ page }) => {
    await page.goto("/split-pdf-for-ai");
    await expectNoHorizontalScroll(page);
    await upload(page, "pages-50.pdf");
    await expect(summary(page)).toContainText("50 pages");
    await expectNoHorizontalScroll(page);
  });
});
