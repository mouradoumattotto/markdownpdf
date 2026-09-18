import { describe, expect, it } from "vitest";
import { createMarked, decodeSource, detectFeatures, lexMarkdown, needsUnicodeFont } from "@/lib/markdown-render";

describe("math syntax (pandoc rules)", () => {
  const types = (md: string) => JSON.stringify(lexMarkdown(md));
  it("recognises inline and display math", () => {
    expect(types("Energy $E=mc^2$ here")).toContain('"type":"inlineMath"');
    expect(types("$$\n\\int_0^1 x\\,dx\n$$\n")).toContain('"type":"blockMath"');
  });
  it("leaves prices alone", () => {
    expect(types("It costs $5 and $10 today.")).not.toContain("Math");
    expect(types("Between $ 5 and 10 $ dollars")).not.toContain("Math");
  });
});

describe("rendered placeholders survive sanitisation", () => {
  it("URI-encodes diagram sources so '-->' is never in an attribute", async () => {
    const html = await createMarked().parse("```mermaid\nflowchart LR\n  A-->B\n```\n");
    expect(html).not.toContain("-->");
    const code = /data-code="([^"]*)"/.exec(html)![1];
    expect(decodeSource(code)).toBe("flowchart LR\n  A-->B");
  });
  it("keeps normal code blocks escaped", async () => {
    const html = await createMarked().parse("```\n<script>alert(1)</script>\n```\n");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("feature detection", () => {
  it("counts diagrams, math, images and code", () => {
    const f = detectFeatures("```mermaid\ngraph TD\nA-->B\n```\n\n$x$ and ![a](b.png)\n\n```js\n1\n```\n");
    expect(f).toMatchObject({ mermaid: 1, math: 1, images: 1, code: 1, complexScript: null });
  });
  it("flags scripts the quick export cannot lay out", () => {
    expect(detectFeatures("مرحبا").complexScript).toBe("arabic");
    expect(detectFeatures("שלום").complexScript).toBe("hebrew");
    expect(detectFeatures("你好").complexScript).toBe("cjk");
    expect(detectFeatures("Привет").complexScript).toBeNull();
  });
  it("needs a Unicode font beyond Windows-1252 only", () => {
    expect(needsUnicodeFont("Café — “quoted” €5")).toBe(false);
    expect(needsUnicodeFont("Ελληνικά")).toBe(true);
    expect(needsUnicodeFont("arrow →")).toBe(true);
  });
});
