import { unzipSync } from "fflate";
import { PDFDocument } from "pdf-lib";
import { test, expect, upload, downloadBytes, gaEvents, expectNoPrivateDataInEvents, expectNoHorizontalScroll, pdfInfo } from "./helpers";

/** Width × height of a PNG or JPEG, read from its header. */
function imageSize(bytes: Uint8Array): { width: number; height: number; type: "png" | "jpeg" } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) === 0x89504e47) return { type: "png", width: view.getUint32(16), height: view.getUint32(20) };
  let o = 2;
  while (o < bytes.length) {
    const marker = view.getUint16(o);
    if (marker >= 0xffc0 && marker <= 0xffc3) return { type: "jpeg", height: view.getUint16(o + 5), width: view.getUint16(o + 7) };
    o += 2 + view.getUint16(o + 2);
  }
  throw new Error("not an image");
}

test.describe("PDF to JPG", () => {
  test("renders selected pages as JPGs at the chosen resolution @cross", async ({ page }) => {
    await page.goto("/pdf-to-jpg");
    await upload(page, "pages-10.pdf");
    await expect(page.getByTestId("images-summary")).toContainText("10 pages");
    await page.getByLabel(/^All 10 pages/).uncheck();
    await page.getByLabel("Pages to convert").fill("2-3");
    await page.getByLabel("Resolution").selectOption("72");
    await page.getByRole("button", { name: "Convert 2 pages to JPG" }).click();
    await expect(page.getByTestId("images-result")).toContainText("✓ 2 images");

    const zip = await downloadBytes(page, () => page.getByRole("button", { name: "Download all (.zip)" }).click());
    expect(zip.name).toBe("pages-10-jpg.zip");
    const entries = unzipSync(new Uint8Array(zip.bytes));
    expect(Object.keys(entries).sort()).toEqual(["pages-10-page-02.jpg", "pages-10-page-03.jpg"]);
    // A4 at 72 dpi is 595 × 842 points → pixels.
    const size = imageSize(entries["pages-10-page-02.jpg"]);
    expect(size).toMatchObject({ type: "jpeg", width: 595, height: 841 });

    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "pdf-to-jpg", output_format: "jpg", export_mode: "72dpi" });
    await expectNoPrivateDataInEvents(page, ["pages-10"]);
  });

  test("renders a single page as PNG at 150 dpi", async ({ page }) => {
    await page.goto("/pdf-to-jpg");
    await upload(page, "text-simple.pdf");
    await page.getByText("PNG", { exact: true }).click();
    await page.getByRole("button", { name: /^Convert 1 page to PNG$/ }).click();
    const file = await downloadBytes(page, () => page.getByRole("button", { name: "Download text-simple-page-01.png" }).click());
    const size = imageSize(new Uint8Array(file.bytes));
    expect(size.type).toBe("png");
    expect(size.width).toBe(Math.floor((595.28 * 150) / 72));
  });

  test("rejects encrypted PDFs", async ({ page }) => {
    await page.goto("/pdf-to-jpg");
    await upload(page, "encrypted.pdf");
    await expect(page.locator('p[role="alert"]')).toContainText("password-protected");
  });
});

test.describe("JPG to PDF", () => {
  test("combines images in the chosen order, upright @cross", async ({ page }) => {
    await page.goto("/jpg-to-pdf");
    await upload(page, ["image-sample.jpg", "image-rotated.jpg", "image-small.png"]);
    await expect(page.getByTestId("jpg-summary")).toContainText("3 images");
    await page.getByRole("button", { name: "Move image-small.png up" }).click();
    await page.getByLabel("Page size").selectOption("fit");
    await page.getByRole("button", { name: "Create PDF" }).click();
    await expect(page.getByTestId("jpg-done")).toContainText("3 pages");

    const file = await downloadBytes(page, () => page.getByRole("button", { name: "Download images.pdf" }).click());
    const doc = await PDFDocument.load(file.bytes);
    const sizes = doc.getPages().map((p) => [Math.round(p.getWidth()), Math.round(p.getHeight())]);
    // 800×600 px at 96 dpi = 600×450 pt; the rotated photo is displayed 600×800 px = 450×600 pt.
    expect(sizes).toEqual([
      [600, 450],
      [600, 450],
      [450, 600],
    ]);
    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "jpg-to-pdf", export_mode: "fit", file_count_bucket: "2-5" });
    await expectNoPrivateDataInEvents(page, ["image-sample", "image-rotated"]);
  });

  test("embeds an upright JPEG without re-compressing it", async ({ page }) => {
    await page.goto("/jpg-to-pdf");
    await upload(page, "image-sample.jpg");
    await page.getByRole("button", { name: "Create PDF" }).click();
    const file = await downloadBytes(page, () => page.getByRole("button", { name: "Download images.pdf" }).click());
    const original = (await import("node:fs")).readFileSync("tests/fixtures/generated/image-sample.jpg");
    // The exact JPEG bytes are inside the PDF.
    expect(Buffer.from(file.bytes).indexOf(original.subarray(0, 2000))).toBeGreaterThan(0);
    const info = await pdfInfo(file.bytes);
    expect(info.pages).toBe(1);
    // A4 by default.
    expect(Math.round((await PDFDocument.load(file.bytes)).getPage(0).getWidth())).toBe(842);
  });

  test("skips files that are not images", async ({ page }) => {
    await page.goto("/jpg-to-pdf");
    await upload(page, ["image-small.png", "text-simple.pdf"]);
    await expect(page.getByTestId("images-skipped")).toContainText("text-simple.pdf: not a supported image");
    await expect(page.getByTestId("jpg-summary")).toContainText("1 image");
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/jpg-to-pdf");
    await upload(page, ["image-sample.jpg", "image-small.png"]);
    await expect(page.getByTestId("jpg-summary")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test.describe("Organize PDF", () => {
  test("reorders, rotates and deletes pages @cross", async ({ page }) => {
    await page.goto("/organize-pdf");
    await upload(page, "pages-10.pdf");
    await expect(page.getByTestId("page-card")).toHaveCount(10);
    await expect(page.getByRole("img", { name: "Page 10" })).toBeVisible();

    await page.getByRole("button", { name: "Delete page 1", exact: true }).click();
    await expect(page.getByTestId("organize-summary")).toContainText("9 of 10 pages");
    // What was page 3 is now first-but-one; move it to the front and rotate it.
    await page.getByRole("button", { name: "Move page 2 earlier" }).click();
    await page.getByRole("button", { name: "Rotate page 1", exact: true }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    const file = await downloadBytes(page, () => page.getByRole("button", { name: "Download pages-10-organized.pdf" }).click());
    const doc = await PDFDocument.load(file.bytes);
    expect(doc.getPageCount()).toBe(9);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
    const info = await pdfInfo(file.bytes);
    const at = (n: number) => info.text.indexOf(`MARKER-PAGE-${n} `);
    expect(at(1)).toBe(-1);
    expect(at(3)).toBeLessThan(at(2));
    expect(at(2)).toBeLessThan(at(4));
  });

  test("duplicates a page and undoes everything", async ({ page }) => {
    await page.goto("/organize-pdf");
    await upload(page, "pages-10.pdf");
    await page.getByRole("button", { name: "Duplicate page 5" }).click();
    await expect(page.getByTestId("page-card")).toHaveCount(11);
    await page.getByRole("button", { name: "Undo all changes" }).click();
    await expect(page.getByTestId("page-card")).toHaveCount(10);
    await expect(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/organize-pdf");
    await upload(page, "pages-10.pdf");
    await expect(page.getByTestId("page-card")).toHaveCount(10);
    await expectNoHorizontalScroll(page);
  });
});
