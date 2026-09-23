import { unzipSync } from "fflate";
import { test, expect, upload, downloadBytes, gaEvents, expectNoPrivateDataInEvents, expectNoHorizontalScroll, pdfInfo } from "./helpers";

test.describe("Split PDF", () => {
  test("splits by ranges into a ZIP of parts @cross", async ({ page }) => {
    await page.goto("/split-pdf");
    await upload(page, "pages-10.pdf");
    await expect(page.getByTestId("split-summary")).toContainText("10 pages");
    await page.getByLabel(/^Pages/).fill("1-3, 4-");
    await expect(page.getByTestId("split-plan")).toContainText("2 PDFs will be created");
    await page.getByRole("button", { name: "Split PDF" }).click();
    await expect(page.getByTestId("split-done")).toContainText("2 files ready");

    const zip = await downloadBytes(page, () => page.getByRole("button", { name: "Download all (.zip)" }).click());
    expect(zip.name).toBe("pages-10-split.zip");
    const entries = unzipSync(new Uint8Array(zip.bytes));
    const names = Object.keys(entries).sort();
    expect(names).toEqual(["pages-10-part-01-p1-3.pdf", "pages-10-part-02-p4-10.pdf"]);
    expect((await pdfInfo(entries[names[0]])).pages).toBe(3);
    expect((await pdfInfo(entries[names[1]])).pages).toBe(7);

    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "split-pdf", export_mode: "ranges", file_count_bucket: "2-5" });
    await expectNoPrivateDataInEvents(page, ["pages-10"]);
  });

  test("extracts selected pages into one PDF, in the order typed", async ({ page }) => {
    await page.goto("/split-pdf");
    await upload(page, "pages-10.pdf");
    await page.getByLabel("Extract pages").check();
    await page.getByLabel(/^Pages/).fill("7, 2-3");
    await expect(page.getByTestId("split-plan")).toContainText("1 PDF will be created with 3 pages");
    await page.getByRole("button", { name: "Extract pages" }).click();
    const file = await downloadBytes(page, () => page.getByRole("button", { name: "Download pages-10-extracted.pdf" }).click());
    const info = await pdfInfo(file.bytes);
    expect(info.pages).toBe(3);
    // Each fixture page carries a MARKER-PAGE-n; the order must follow the input.
    const at = (n: number) => info.text.indexOf(`MARKER-PAGE-${n} `);
    expect(at(7)).toBeGreaterThanOrEqual(0);
    expect(at(7)).toBeLessThan(at(2));
    expect(at(2)).toBeLessThan(at(3));
    expect(at(1)).toBe(-1);
  });

  test("validates ranges before splitting", async ({ page }) => {
    await page.goto("/split-pdf");
    await upload(page, "pages-10.pdf");
    await page.getByLabel(/^Pages/).fill("4-2");
    await expect(page.getByTestId("split-plan-error")).toContainText("goes backwards");
    await expect(page.getByRole("button", { name: "Split PDF" })).toBeDisabled();
    await page.getByLabel(/^Pages/).fill("12");
    await expect(page.getByTestId("split-plan-error")).toContainText("outside 1–10");
  });

  test("splits every page and every N pages", async ({ page }) => {
    await page.goto("/split-pdf");
    await upload(page, "pages-10.pdf");
    await page.getByLabel("Every N pages").check();
    await page.getByLabel("Pages per part").fill("4");
    await expect(page.getByTestId("split-plan")).toContainText("3 PDFs");
    await page.getByRole("radio", { name: /^Every page\b/ }).check();
    await expect(page.getByTestId("split-plan")).toContainText("10 PDFs");
    await page.getByRole("button", { name: "Split PDF" }).click();
    await expect(page.getByTestId("split-done")).toContainText("10 files ready");
    await expect(page.getByRole("button", { name: "Download pages-10-page-01.pdf" })).toBeVisible();
  });

  test("rejects encrypted and non-PDF files", async ({ page }) => {
    await page.goto("/split-pdf");
    await upload(page, "not-a-pdf.pdf");
    await expect(page.locator('p[role="alert"]')).toContainText("not a PDF");
    await upload(page, "encrypted.pdf");
    await expect(page.locator('p[role="alert"]')).toContainText("password-protected");
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/split-pdf");
    await upload(page, "pages-10.pdf");
    await expect(page.getByTestId("split-summary")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test.describe("Merge PDF", () => {
  test("merges files in the chosen order @cross", async ({ page }) => {
    await page.goto("/merge-pdf");
    await upload(page, ["pages-10.pdf", "text-simple.pdf"]);
    await expect(page.getByTestId("merge-summary")).toContainText("2 files");
    // Move text-simple to the front.
    await page.getByRole("button", { name: "Move text-simple.pdf up" }).click();
    const order = page.getByRole("list", { name: "Merge order" }).getByRole("listitem");
    await expect(order.first()).toContainText("text-simple.pdf");

    await page.getByRole("button", { name: "Merge 2 PDFs" }).click();
    await expect(page.getByTestId("merge-done")).toBeVisible();
    const file = await downloadBytes(page, () => page.getByRole("button", { name: "Download merged.pdf" }).click());
    expect(file.name).toBe("merged.pdf");
    const info = await pdfInfo(file.bytes);
    const simple = await pdfInfo((await import("node:fs")).readFileSync("tests/fixtures/generated/text-simple.pdf"));
    expect(info.pages).toBe(simple.pages + 10);
    expect(info.text.indexOf("Quarterly Report")).toBeGreaterThanOrEqual(0);

    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "merge-pdf", file_count_bucket: "2-5" });
    await expectNoPrivateDataInEvents(page, ["text-simple", "Quarterly"]);
  });

  test("skips files it cannot merge, and says why", async ({ page }) => {
    await page.goto("/merge-pdf");
    await upload(page, ["pages-10.pdf", "encrypted.pdf", "not-a-pdf.pdf"]);
    const alert = page.getByTestId("merge-skipped");
    await expect(alert).toContainText("encrypted.pdf: password-protected");
    await expect(alert).toContainText("not-a-pdf.pdf: not a PDF");
    await expect(page.getByTestId("merge-summary")).toContainText("1 file");
    await expect(page.getByRole("button", { name: /^Merge/ })).toBeDisabled();
  });

  test("removes and sorts files", async ({ page }) => {
    await page.goto("/merge-pdf");
    await upload(page, ["text-simple.pdf", "pages-10.pdf", "columns.pdf"]);
    await expect(page.getByTestId("merge-summary")).toContainText("3 files");
    await page.getByRole("button", { name: "Sort by name" }).click();
    const order = page.getByRole("list", { name: "Merge order" }).getByRole("listitem");
    await expect(order.nth(0)).toContainText("columns.pdf");
    await expect(order.nth(2)).toContainText("text-simple.pdf");
    await page.getByRole("button", { name: "Remove columns.pdf" }).click();
    await expect(page.getByTestId("merge-summary")).toContainText("2 files");
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/merge-pdf");
    await upload(page, ["pages-10.pdf", "text-simple.pdf"]);
    await expect(page.getByTestId("merge-summary")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
