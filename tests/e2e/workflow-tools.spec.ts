import { unzipSync, strFromU8 } from "fflate";
import { test, expect, upload, downloadText, downloadBytes, expectNoHorizontalScroll } from "./helpers";

test.describe("PDF tables to CSV", () => {
  test("finds the table and exports it as CSV @cross", async ({ page }) => {
    await page.goto("/pdf-tables-to-csv");
    await upload(page, "table.pdf");
    await expect(page.getByRole("heading", { name: "1 table found" })).toBeVisible();
    const csv = await downloadText(page, () => page.getByRole("button", { name: "Download .csv" }).click());
    expect(csv.name).toBe("table-p1-table1.csv");
    expect(csv.text.replace(/^﻿/, "")).toBe("Plan,Price,Pages\r\nStarter,USD 0,Unlimited\r\nTeam,USD 12,Unlimited\r\n");
  });

  test("says so when a PDF has no table", async ({ page }) => {
    await page.goto("/pdf-tables-to-csv");
    await upload(page, "columns.pdf");
    await expect(page.getByRole("heading", { name: "No table found" })).toBeVisible();
  });
});

test.describe("Batch PDF to Markdown", () => {
  test("converts several PDFs into one ZIP, keeping same-named files apart @cross", async ({ page }) => {
    await page.goto("/batch-pdf-to-markdown");
    await upload(page, ["text-simple.pdf", "table.pdf"]);
    await upload(page, ["text-simple.pdf"]);
    await page.getByRole("button", { name: "Convert 3 PDFs" }).click();
    await expect(page.getByText("✓ 1 page")).toHaveCount(3);
    const zip = await downloadBytes(page, () => page.getByRole("button", { name: "Download all (.zip)" }).click());
    const files = unzipSync(new Uint8Array(zip.bytes));
    expect(Object.keys(files).sort()).toEqual(["table.md", "text-simple (2).md", "text-simple.md"]);
    expect(strFromU8(files["text-simple.md"])).toContain("# Quarterly Report");
    expect(strFromU8(files["table.md"])).toContain("| Team | USD 12 | Unlimited |");
  });
});

test.describe("PDF to Obsidian", () => {
  test("writes a note with properties and page markers", async ({ page }) => {
    await page.goto("/pdf-to-obsidian");
    await upload(page, "text-simple.pdf");
    const note = page.getByLabel("Obsidian note");
    await expect(note).toHaveValue(/^---\ntitle: "Quarterly Report"\nsource: "text-simple.pdf"\npages: 1\n/);
    await expect(note).toHaveValue(/%% page 1 %%/);
    const file = await downloadText(page, () => page.getByRole("button", { name: "Download .md" }).click());
    expect(file.name).toBe("Quarterly Report.md");
  });
});

test.describe("Examples and the result view", () => {
  test("runs a real sample live from /examples @mobile", async ({ page }) => {
    await page.goto("/examples");
    await expectNoHorizontalScroll(page);
    await page.getByRole("link", { name: "Run it live →" }).first().click();
    await expect(page).toHaveURL(/\?sample=research-paper/);
    await expect(page.getByText("Conversion complete")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Converted Markdown")).toHaveValue(/# Why Most Published Research Findings/);
  });

  test("clicking a line of Markdown outlines it in the original PDF", async ({ page }) => {
    test.skip(page.viewportSize()!.width < 1024, "side-by-side view only");
    await page.goto("/?sample=research-paper");
    const text = page.getByLabel("Converted Markdown");
    await expect(text).toHaveValue(/Several methodologists/, { timeout: 60_000 });
    const md = await text.inputValue();
    const at = md.indexOf("Several methodologists") + 5;
    await text.evaluate((el: HTMLTextAreaElement, i) => {
      el.focus();
      el.setSelectionRange(i, i);
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }, at);
    await expect(page.getByTestId("pdf-highlight")).toBeVisible();
  });

  test("Copy for AI wraps the Markdown with its source", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "clipboard permissions");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await upload(page, "text-simple.pdf");
    await expect(page.getByText("Conversion complete")).toBeVisible();
    await page.getByRole("button", { name: "Copy for AI" }).first().click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toMatch(/^<document source="text-simple.pdf" pages="1" format="markdown">\n# Quarterly Report/);
    expect(copied.trimEnd().endsWith("</document>")).toBe(true);
  });
});
