import { test, expect, upload, downloadBytes, eventNames, gaEvents, expectNoHorizontalScroll } from "./helpers";

async function titleOf(bytes: Buffer) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(new Uint8Array(bytes), { updateMetadata: false });
  return { title: doc.getTitle(), author: doc.getAuthor(), pages: doc.getPageCount() };
}

test.describe("PDF metadata", () => {
  test("shows every hidden field, including the XMP packet @cross", async ({ page }) => {
    await page.goto("/pdf-metadata");
    await upload(page, "metadata.pdf");
    await expect(page.getByTestId("overview")).toContainText("1 page");
    await expect(page.getByTestId("overview")).toContainText("210×297 mm");
    await expect(page.getByTestId("metadata-found")).toContainText("Author");
    await expect(page.getByTestId("metadata-found")).toContainText("XMP packet");
    await expect(page.getByLabel("Author")).toHaveValue("ALICE_SECRET");
    await expect(page.getByLabel("Title")).toHaveValue(/ALICE_SECRET/);
    await expect(page.getByText(/created 2024-01-02/)).toBeVisible();
    await expect(page.getByText(/XMP metadata packet/)).toBeVisible();
    expect(await eventNames(page)).toContain("file_selected");
  });

  test("removes metadata from the downloaded file's bytes", async ({ page }) => {
    await page.goto("/pdf-metadata");
    await upload(page, "metadata.pdf");
    await page.getByRole("button", { name: "Remove all metadata" }).click();
    await expect(page.getByTestId("saved")).toContainText("Removed:");
    await expect(page.getByTestId("saved")).toContainText("XMP metadata");

    const file = await downloadBytes(page, () => page.getByRole("button", { name: /^Download metadata-no-metadata\.pdf$/ }).click());
    expect(file.name).toBe("metadata-no-metadata.pdf");
    expect(file.bytes.toString("latin1")).not.toContain("ALICE_SECRET");
    const after = await titleOf(file.bytes);
    expect(after.title).toBeUndefined();
    expect(after.author).toBeUndefined();
    expect(after.pages).toBe(1);

    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "pdf-metadata", export_mode: "clean" });
  });

  test("keeps the dates when asked", async ({ page }) => {
    await page.goto("/pdf-metadata");
    await upload(page, "metadata.pdf");
    await page.getByLabel("Keep the creation and modification dates").check();
    await page.getByRole("button", { name: "Remove all metadata" }).click();
    const file = await downloadBytes(page, () => page.getByRole("button", { name: /^Download / }).click());
    expect(file.bytes.toString("latin1")).not.toContain("ALICE_SECRET");
    // Dates live in the Info dictionary, which the writer compresses into an
    // object stream — so they are read back rather than searched for in bytes.
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(new Uint8Array(file.bytes), { updateMetadata: false });
    expect(doc.getCreationDate()?.toISOString().slice(0, 10)).toBe("2024-01-02");
    expect(doc.getAuthor()).toBeUndefined();
  });

  test("saves edited values", async ({ page }) => {
    await page.goto("/pdf-metadata");
    await upload(page, "metadata.pdf");
    await page.getByLabel("Title").fill("Public quarterly report");
    await page.getByLabel("Author").fill("");
    await page.getByRole("button", { name: "Save my changes" }).click();
    const file = await downloadBytes(page, () => page.getByRole("button", { name: /^Download metadata-updated\.pdf$/ }).click());
    const after = await titleOf(file.bytes);
    expect(after.title).toBe("Public quarterly report");
    expect(after.author).toBeUndefined();
    expect(file.bytes.toString("latin1")).not.toContain("ALICE_SECRET");
  });

  test("refuses an encrypted PDF", async ({ page, problems }) => {
    await page.goto("/pdf-metadata");
    await upload(page, "encrypted.pdf");
    await expect(page.locator('p[role="alert"]')).toContainText(/password-protected/);
    problems.console.length = 0;
  });

  test("works on a phone @mobile", async ({ page }) => {
    await page.goto("/pdf-metadata");
    await expectNoHorizontalScroll(page);
    await upload(page, "metadata.pdf");
    await expect(page.getByTestId("metadata-found")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
