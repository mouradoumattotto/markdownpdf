import { test, expect, upload, gaEvents } from "./helpers";

const output = (page: import("@playwright/test").Page) => page.getByLabel("Converted Markdown");

// Performance budgets. Run alone (`--project=perf`, one worker): measured in
// parallel with OCR tests, CPU contention inflated a 74 ms task to 1087 ms.

test.describe("Performance budgets", () => {
  test("converts a 300-page PDF without freezing the page", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (window as unknown as { __longest: number }).__longest = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          (window as unknown as { __longest: number }).__longest = Math.max((window as unknown as { __longest: number }).__longest, e.duration);
      }).observe({ type: "longtask", buffered: false });
    });
    const t0 = Date.now();
    await upload(page, "pages-300.pdf");
    await expect(page.getByText(/page \d+ of 300/)).toBeVisible();
    await expect(page.getByText("Conversion complete")).toBeVisible({ timeout: 150_000 });
    const elapsed = Date.now() - t0;
    const md = await output(page).inputValue();
    expect(md).toContain("MARKER-PAGE-1 ");
    expect(md).toContain("MARKER-PAGE-150 ");
    expect(md).toContain("MARKER-PAGE-300 ");
    const longest = await page.evaluate(() => (window as unknown as { __longest: number }).__longest);
    console.log(`300 pages: ${elapsed} ms, longest main-thread task ${Math.round(longest)} ms`);
    expect(longest, "longest main-thread task (ms)").toBeLessThan(250);
    const done = (await gaEvents(page)).find(([n]) => n === "conversion_success")![1];
    expect(done.page_count_bucket).toBe("200+");
  });

});
