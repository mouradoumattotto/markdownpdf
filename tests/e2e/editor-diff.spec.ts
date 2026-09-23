import { test, expect, downloadText, downloadBytes, gaEvents, expectNoHorizontalScroll } from "./helpers";

test.describe("Compare text & documents", () => {
  test("highlights the changed words and exports a .diff @cross", async ({ page }) => {
    await page.goto("/text-diff");
    await page.getByLabel("Original", { exact: true }).fill("Payment within 30 days.\nSame line\nRemoved line\n");
    await page.getByLabel("Changed", { exact: true }).fill("Payment within 45 days.\nSame line\nAdded line\nExtra\n");
    const summary = page.getByTestId("diff-summary");
    await expect(summary).toContainText("+1 added");
    await expect(summary).toContainText("2 changed");
    await expect(page.locator("del", { hasText: "30" })).toBeVisible();
    await expect(page.locator("ins", { hasText: "45" })).toBeVisible();
    const diff = await downloadText(page, () => page.getByRole("button", { name: "Download .diff" }).click());
    expect(diff.name).toBe("original-vs-changed.diff");
    expect(diff.text).toContain("-Payment within 30 days.");
    expect(diff.text).toContain("+Payment within 45 days.");
  });

  test("compares two PDFs by their text", async ({ page }) => {
    await page.goto("/text-diff");
    await page.getByLabel("Original file").setInputFiles("tests/fixtures/generated/pages-10.pdf");
    await page.getByLabel("Changed file").setInputFiles("tests/fixtures/generated/text-simple.pdf");
    await expect(page.getByLabel("Changed", { exact: true })).toHaveValue(/Quarterly Report/);
    await expect(page.getByTestId("diff-summary")).toContainText("added");
    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "text-diff" });
  });

  test("says when texts are identical under the chosen options", async ({ page }) => {
    await page.goto("/text-diff");
    await page.getByLabel("Original", { exact: true }).fill("Hello   World");
    await page.getByLabel("Changed", { exact: true }).fill("hello world");
    await expect(page.getByTestId("diff-summary")).toContainText("changed");
    await page.getByLabel("Ignore case").check();
    await page.getByLabel("Ignore spacing").check();
    await expect(page.getByTestId("diff-summary")).toContainText("No differences");
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/text-diff");
    await page.getByLabel("Original", { exact: true }).fill("a long line of text that should wrap on a phone screen without overflow");
    await page.getByLabel("Changed", { exact: true }).fill("a long line of changed text that should wrap on a phone screen without overflow");
    await expect(page.getByTestId("diff-summary")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test.describe("Markdown editor", () => {
  test("formats with the toolbar and shortcuts, undoably @cross", async ({ page }) => {
    await page.goto("/markdown-editor");
    const editor = page.getByLabel("Markdown editor");
    await editor.fill("make this bold");
    await editor.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(5, 9));
    await page.getByRole("button", { name: "Bold" }).click();
    await expect(editor).toHaveValue("make **this** bold");
    await expect(page.getByTestId("editor-preview").locator("strong")).toHaveText("this");
    await editor.press("ControlOrMeta+z");
    await expect(editor).toHaveValue("make this bold");
    await editor.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, 4));
    await editor.press("ControlOrMeta+i");
    await expect(editor).toHaveValue("*make* this bold");
  });

  test("autosaves in the browser and restores after a reload", async ({ page }) => {
    await page.goto("/markdown-editor");
    await page.getByLabel("Markdown editor").fill("# Kept draft\n\nSome words");
    await expect(page.getByTestId("editor-status")).toContainText("Saved in this browser");
    await page.reload();
    await expect(page.getByLabel("Markdown editor")).toHaveValue("# Kept draft\n\nSome words");
  });

  test("exports Markdown, HTML, PDF and Word", async ({ page }) => {
    await page.goto("/markdown-editor");
    await page.getByLabel("Markdown editor").fill("# Export test\n\n- one\n");
    const md = await downloadText(page, () => page.getByRole("button", { name: ".md", exact: true }).click());
    expect(md.name).toBe("export-test.md");
    const html = await downloadText(page, () => page.getByRole("button", { name: ".html", exact: true }).click());
    expect(html.text).toContain("<h1>Export test</h1>");
    const pdf = await downloadBytes(page, () => page.getByRole("button", { name: ".pdf", exact: true }).click());
    expect(Buffer.from(pdf.bytes).subarray(0, 5).toString()).toBe("%PDF-");
    const docx = await downloadBytes(page, () => page.getByRole("button", { name: ".docx", exact: true }).click());
    expect(Buffer.from(docx.bytes).subarray(0, 2).toString()).toBe("PK");
  });

  test("opens a Markdown file", async ({ page }) => {
    await page.goto("/markdown-editor");
    await page.getByLabel("Open a Markdown file").setInputFiles({ name: "notes.md", mimeType: "text/markdown", buffer: Buffer.from("# From disk\n") });
    await expect(page.getByLabel("Markdown editor")).toHaveValue("# From disk\n");
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/markdown-editor");
    await expect(page.getByLabel("Markdown editor")).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.getByRole("tab", { name: "preview" }).click();
    await expect(page.getByTestId("editor-preview")).toBeVisible();
  });
});
