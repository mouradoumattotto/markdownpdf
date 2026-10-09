import { test, expect, upload } from "./helpers";

// "Continue with": a result goes straight into the next tool, through this
// browser's IndexedDB — the shared fixture still fails the test on any request
// to a third-party host, so the no-upload promise is checked here too.
test.describe("Continue with", () => {
  test("PDF to Markdown result opens in the token counter @cross", async ({ page }) => {
    await page.goto("/");
    await upload(page, "text-simple.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
    await page.getByRole("button", { name: "Token Counter" }).click();
    await expect(page).toHaveURL(/\/token-counter$/);
    await expect(page.getByRole("textbox").first()).toHaveValue(/Quarterly Report/);
    await expect(page.getByTestId("tokens-o200k")).not.toHaveText("0");
  });

  test("images combined into a PDF continue to Merge PDF", async ({ page }) => {
    await page.goto("/png-to-pdf");
    await upload(page, ["image-small.png", "image-en.png"]);
    await page.getByRole("button", { name: "Create PDF" }).click();
    await expect(page.getByTestId("jpg-done")).toBeVisible();
    await page.getByRole("button", { name: "Merge PDF" }).click();
    await expect(page).toHaveURL(/\/merge-pdf$/);
    await expect(page.getByTestId("merge-summary")).toContainText("1 file · 2 pages");
  });

  test("a handed-over file is delivered once, not on reload", async ({ page }) => {
    await page.goto("/");
    await upload(page, "text-simple.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
    await page.getByRole("button", { name: "Markdown Chunker for RAG" }).click();
    await expect(page).toHaveURL(/\/markdown-chunker$/);
    await expect(page.getByRole("textbox").first()).toHaveValue(/Quarterly Report/);
    await page.reload();
    await expect(page.getByRole("textbox").first()).toHaveValue("");
  });
});
