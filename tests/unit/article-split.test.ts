import { describe, expect, it } from "vitest";
import { splitAtMiddleSection } from "@/lib/article-split";

describe("splitAtMiddleSection", () => {
  it("splits before the section heading nearest the middle", () => {
    const html = `<h2>A</h2><p>${"x".repeat(100)}</p><h2 id="b">B</h2><p>${"y".repeat(100)}</p><h2>C</h2><p>z</p>`;
    const [before, after] = splitAtMiddleSection(html)!;
    expect(after.startsWith('<h2 id="b">B</h2>')).toBe(true);
    expect(before + after).toBe(html);
  });

  it("never splits before the first section", () => {
    const html = `<p>intro</p><h2>Only</h2><p>${"x".repeat(500)}</p>`;
    expect(splitAtMiddleSection(html)).toBeNull();
  });

  it("does not mistake other tags for headings", () => {
    expect(splitAtMiddleSection("<h2>A</h2><p>a</p><h20>no</h20><p>b</p>")).toBeNull();
  });
});
