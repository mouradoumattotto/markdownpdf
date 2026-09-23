import { unzipSync } from "fflate";
import { test, expect, upload, downloadText, downloadBytes, eventNames, gaEvents, expectNoPrivateDataInEvents, expectNoHorizontalScroll } from "./helpers";

const squashed = (s: string) => s.replace(/[ \t]+/g, " ");

test.describe("Word to Markdown", () => {
  test("converts a .docx with headings, lists and a table @cross", async ({ page }) => {
    await page.goto("/docx-to-markdown");
    await upload(page, "sample.docx");
    const output = page.getByLabel("Markdown output");
    await expect(output).toHaveValue(/# Release Notes/);
    const md = await output.inputValue();
    expect(md).toContain("## Summary");
    expect(md).toContain("**OCR**");
    expect(md).toContain("- First change");
    expect(squashed(md)).toContain("| Tool | Status |");
    expect(md).not.toContain("](images/");

    const file = await downloadText(page, () => page.getByRole("button", { name: "Download .md" }).click());
    expect(file.name).toBe("sample.md");
    expect(file.text).toBe(md);

    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "docx-to-markdown", input_format: "docx", output_format: "md", export_mode: "omit" });
    await expectNoPrivateDataInEvents(page, ["Release Notes", "sample.docx", "First change"]);
  });

  test("extracts images into a ZIP next to the Markdown", async ({ page }) => {
    await page.goto("/docx-to-markdown");
    await page.getByLabel(/Save images to a folder/).check();
    await upload(page, "sample.docx");
    await expect(page.getByLabel("Markdown output")).toHaveValue(/\]\(images\/image-01\.png\)/);
    const zip = await downloadBytes(page, () => page.getByRole("button", { name: /Download \.zip/ }).click());
    expect(zip.name).toBe("sample.zip");
    const entries = unzipSync(new Uint8Array(zip.bytes));
    expect(Object.keys(entries).sort()).toEqual(["images/image-01.png", "sample.md"]);
    // A real PNG, not an empty placeholder.
    expect(Array.from(entries["images/image-01.png"].slice(1, 4))).toEqual([0x50, 0x4e, 0x47]);
  });

  test("re-converts when the image option changes", async ({ page }) => {
    await page.goto("/docx-to-markdown");
    await upload(page, "sample.docx");
    const output = page.getByLabel("Markdown output");
    await expect(output).toHaveValue(/# Release Notes/);
    await page.getByLabel(/Embed images in the file/).check();
    await expect(output).toHaveValue(/\]\(data:image\/png;base64,/);
  });

  test("explains legacy .doc files and rejects other files", async ({ page }) => {
    await page.goto("/docx-to-markdown");
    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: "old.doc",
      mimeType: "application/msword",
      buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0, 0, 0]),
    });
    await expect(page.locator('p[role="alert"]')).toContainText("Word 97–2003");
    await upload(page, "not-a-pdf.pdf");
    await expect(page.locator('p[role="alert"]')).toContainText("not a Word .docx file");
    expect(await eventNames(page)).not.toContain("conversion_success");
  });
});

test.describe("HTML to Markdown", () => {
  test("converts pasted HTML code live", async ({ page }) => {
    await page.goto("/html-to-markdown");
    await page.getByLabel(/^HTML/).fill('<h2>Hello</h2><p>A <a href="https://example.com">link</a> and <b>bold</b>.</p><ul><li>one</li></ul>');
    const output = page.getByLabel("Markdown output");
    await expect(output).toHaveValue(/## Hello/);
    const md = await output.inputValue();
    expect(md).toContain("[link](https://example.com)");
    expect(md).toContain("**bold**");
    expect(md).toContain("- one");
  });

  test("uses the formatted version of a rich paste", async ({ page }) => {
    await page.goto("/html-to-markdown");
    const box = page.getByLabel(/^HTML/);
    await box.focus();
    await box.evaluate((el) => {
      const data = new DataTransfer();
      data.setData("text/plain", "Heading from Docs\nSome text");
      data.setData("text/html", "<h1>Heading from Docs</h1><p>Some <em>text</em></p>");
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
    await expect(page.getByLabel("Markdown output")).toHaveValue(/# Heading from Docs\n\nSome \*text\*/);
    await expect(page.getByText("Formatted content pasted")).toBeVisible();
    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "html-to-markdown", input_format: "clipboard" });
    await expectNoPrivateDataInEvents(page, ["Heading from Docs"]);
  });

  test("strips page furniture from a dropped HTML file", async ({ page }) => {
    await page.goto("/html-to-markdown");
    await upload(page, "sample.html");
    const output = page.getByLabel("Markdown output");
    await expect(output).toHaveValue(/# Release Notes/);
    const md = await output.inputValue();
    expect(squashed(md)).toContain("| Tool | Status |");
    expect(md).toContain("```js");
    expect(md).not.toContain("alert(");
    const file = await downloadText(page, () => page.getByRole("button", { name: "Download .md" }).click());
    expect(file.name).toBe("sample.md");
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/html-to-markdown");
    await page.getByRole("button", { name: "Try an example" }).click();
    await expect(page.getByLabel("Markdown output")).toHaveValue(/# Quarterly update/);
    await expectNoHorizontalScroll(page);
  });
});

test.describe("Markdown to HTML", () => {
  test("converts, previews and downloads a complete page @cross", async ({ page }) => {
    await page.goto("/markdown-to-html");
    await page.getByLabel("Markdown", { exact: true }).fill("# My notes\n\n- [x] done\n\n<img src=x onerror=alert(1)>\n");
    const output = page.getByLabel("HTML output");
    await expect(output).toHaveValue(/<h1>My notes<\/h1>/);
    expect(await output.inputValue()).not.toContain("onerror");

    await page.getByLabel(/Complete HTML page/).check();
    await expect(output).toHaveValue(/^<!doctype html>/);
    expect(await output.inputValue()).toContain("<title>My notes</title>");

    const file = await downloadText(page, () => page.getByRole("button", { name: "Download .html" }).click());
    expect(file.name).toBe("document.html");
    expect(file.text).toContain("<h1>My notes</h1>");

    await page.getByRole("tab", { name: "Preview" }).click();
    await expect(page.getByTestId("html-preview").getByRole("heading", { name: "My notes" })).toBeVisible();
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/markdown-to-html");
    await page.getByRole("button", { name: "Try an example" }).click();
    await expect(page.getByLabel("HTML output")).toHaveValue(/<table>/);
    await expectNoHorizontalScroll(page);
  });
});

test("the Markdown tools hub lists every Markdown tool", async ({ page }) => {
  await page.goto("/markdown-tools");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Markdown tools");
  for (const name of ["Word to Markdown", "HTML to Markdown", "Markdown to HTML", "Markdown to PDF", "PDF to Markdown"]) {
    await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
  }
});
