import { unzipSync, strFromU8 } from "fflate";
import { test, expect, upload, downloadBytes, downloadText, gaEvents, expectNoPrivateDataInEvents, expectNoHorizontalScroll } from "./helpers";

test.describe("Markdown to Word", () => {
  test("downloads a .docx with real Word structure @cross", async ({ page }) => {
    await page.goto("/markdown-to-docx");
    await page.getByLabel("Markdown", { exact: true }).fill("# Secret plan\n\n- one\n- two\n\n| A | B |\n| - | - |\n| 1 | 2 |\n");
    const file = await downloadBytes(page, () => page.getByRole("button", { name: "Download .docx" }).click());
    expect(file.name).toBe("document.docx");
    const xml = strFromU8(unzipSync(new Uint8Array(file.bytes))["word/document.xml"]);
    expect(xml).toContain('w:val="Heading1"');
    expect(xml).toContain("<w:tbl>");
    expect(xml).toContain("Secret plan");
    await expect(page.getByTestId("docx-done")).toBeVisible();
    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "markdown-to-docx", output_format: "docx" });
    await expectNoPrivateDataInEvents(page, ["Secret plan"]);
  });

  test("names the file after a dropped .md and warns about linked images", async ({ page }) => {
    await page.goto("/markdown-to-docx");
    await page.locator('input[type="file"]').setInputFiles({
      name: "notes.md",
      mimeType: "text/markdown",
      buffer: Buffer.from("# Notes\n\n![chart](https://example.com/chart.png)\n"),
    });
    await expect(page.getByLabel("Markdown", { exact: true })).toHaveValue(/# Notes/);
    const file = await downloadBytes(page, () => page.getByRole("button", { name: "Download .docx" }).click());
    expect(file.name).toBe("notes.docx");
    await expect(page.getByTestId("docx-warnings")).toContainText("not embedded");
  });
});

test.describe("Markdown table generator", () => {
  test("builds a table from typed cells and alignment", async ({ page }) => {
    await page.goto("/markdown-table-generator");
    await page.getByLabel("Header, column 1").fill("Item");
    await page.getByLabel("Header, column 2").fill("Qty");
    await page.getByLabel("Row 1, column 1").fill("Apples | green");
    await page.getByLabel("Row 1, column 2").fill("3");
    await page.getByLabel("Alignment of column 2").selectOption("right");
    await page.getByRole("button", { name: "Delete column 3" }).click();
    await page.getByRole("button", { name: "Delete row 2" }).click();
    const md = page.getByLabel("Markdown table");
    await expect(md).toHaveValue("| Item            | Qty |\n| --------------- | --: |\n| Apples \\| green |   3 |\n");
  });

  test("imports spreadsheet cells and exports CSV @cross", async ({ page }) => {
    await page.goto("/markdown-table-generator");
    await page.getByLabel("Data to import").fill("Name\tCity\nAna\tLisbon\nSam\tOslo");
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(page.getByLabel("Markdown table")).toHaveValue(/\| Ana  \| Lisbon \|/);
    const csv = await downloadText(page, () => page.getByRole("button", { name: "Download .csv" }).click());
    expect(csv.text).toBe("Name,City\nAna,Lisbon\nSam,Oslo\n");
  });

  test("pasting a block into a cell fills the grid", async ({ page }) => {
    await page.goto("/markdown-table-generator");
    const cell = page.getByLabel("Row 1, column 1");
    await cell.focus();
    await cell.evaluate((el) => {
      const data = new DataTransfer();
      data.setData("text/plain", "a\tb\tc\td\ne\tf\tg\th\n");
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
    await expect(page.getByLabel("Row 2, column 4")).toHaveValue("h");
    await expect(page.getByLabel("Header, column 4")).toHaveValue("");
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/markdown-table-generator");
    await expectNoHorizontalScroll(page);
  });
});

test.describe("Token counter", () => {
  test("counts exactly, in a worker @cross", async ({ page }) => {
    await page.goto("/token-counter");
    await page.getByLabel(/^Text, a prompt/).fill("hello world");
    await expect(page.getByTestId("tokens-o200k")).toHaveText("2");
    await expect(page.getByTestId("tokens-cl100k")).toHaveText("2");
    await expect(page.getByTestId("tokens-estimate")).toHaveText("1–3");
    await expect(page.getByTestId("text-stats")).toHaveText("2 · 11");
    expect(page.workers().length).toBeGreaterThan(0);
  });

  test("counts a PDF's text", async ({ page }) => {
    await page.goto("/token-counter");
    await upload(page, "text-simple.pdf");
    await expect(page.getByLabel(/^Text, a prompt/)).toHaveValue(/Quarterly Report/);
    await expect(page.getByTestId("tokens-o200k")).toHaveText(/^\d{2,}$/);
    const ok = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(ok).toMatchObject({ tool_name: "token-counter", input_format: "pdf" });
    await expectNoPrivateDataInEvents(page, ["Quarterly"]);
  });

  test("rejects binary files", async ({ page }) => {
    await page.goto("/token-counter");
    await upload(page, "image-small.png");
    await expect(page.locator('p[role="alert"]')).toContainText("not text");
  });
});

test.describe("Markdown chunker", () => {
  const doc = `# Guide\n\n${"Intro sentence here. ".repeat(40)}\n\n## Setup\n\n${"Setup step described. ".repeat(60)}\n\n\`\`\`bash\nnpm install\n\`\`\`\n`;

  test("chunks under the budget and exports JSONL @cross", async ({ page }) => {
    await page.goto("/markdown-chunker");
    await page.getByLabel("Markdown or plain text").fill(doc);
    await page.getByLabel("Max tokens per chunk").fill("128");
    await page.getByLabel("Overlap (tokens)").fill("16");
    await expect(page.getByTestId("chunks-summary")).toContainText("chunks");
    const file = await downloadText(page, () => page.getByRole("button", { name: "Download .jsonl" }).click());
    expect(file.name).toBe("chunks.jsonl");
    const rows = file.text.trim().split("\n").map((l) => JSON.parse(l));
    expect(rows.length).toBeGreaterThan(3);
    for (const r of rows) expect(r.tokens).toBeLessThanOrEqual(128);
    expect(rows.at(-1).text).toContain("npm install");
    expect(rows.at(-1).headings).toEqual(["# Guide", "## Setup"]);
  });

  test("validates the settings", async ({ page }) => {
    await page.goto("/markdown-chunker");
    await page.getByLabel("Max tokens per chunk").fill("10");
    await expect(page.getByRole("status")).toContainText("between 32 and 100,000");
    await page.getByLabel("Max tokens per chunk").fill("100");
    await page.getByLabel("Overlap (tokens)").fill("80");
    await expect(page.getByRole("status")).toContainText("half the chunk size");
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto("/markdown-chunker");
    await page.getByLabel("Markdown or plain text").fill(doc);
    await expect(page.getByTestId("chunks-summary")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test("the AI document tools hub lists its tools", async ({ page }) => {
  await page.goto("/ai-document-tools");
  for (const name of ["Token Counter", "Markdown Chunker for RAG", "Split PDF for AI", "PDF to Markdown"]) {
    await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
  }
});
