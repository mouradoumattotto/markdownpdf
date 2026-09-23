// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { imageDimensions, markdownToDocx } from "@/lib/markdown-docx";
import { docxToMarkdown } from "@/lib/html-markdown";

const SAMPLE = `---
title: Ignored front matter
---

# Project plan

Intro with **bold**, *italic*, ~~gone~~, \`code\` and a [link](https://example.com).

## Steps

1. First
2. Second
   - nested bullet

- [x] done task
- [ ] open task

> A quoted remark

| Name | Qty |
| :--- | ---: |
| Apples | 3 |

\`\`\`js
const a = 1;
const b = 2;
\`\`\`

Area is $\\pi r^2$.
`;

async function xmlOf(blob: Blob, path = "word/document.xml") {
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  return strFromU8(files[path]);
}

describe("markdownToDocx", () => {
  it("maps Markdown structure to real Word constructs", async () => {
    const { blob, warnings } = await markdownToDocx(SAMPLE, { title: "Project plan" });
    const xml = await xmlOf(blob);
    expect(xml).toContain('w:val="Heading1"');
    expect(xml).toContain('w:val="Heading2"');
    expect(xml).toContain("<w:b/>");
    expect(xml).toContain("<w:i/>");
    expect(xml).toContain("<w:strike/>");
    expect(xml).toContain("w:hyperlink");
    expect(xml).toContain("<w:tbl>");
    expect(xml).toContain("<w:tblHeader/>");
    expect(xml).toContain("w:numPr");
    expect(xml).toContain("☑ ");
    expect(xml).toContain("const b = 2;");
    expect(xml).not.toContain("Ignored front matter");
    expect(warnings.join(" ")).toMatch(/LaTeX math/);
    expect(await xmlOf(blob, "docProps/core.xml")).toContain("Project plan");
    // Outline levels are what the navigation pane and a table of contents use.
    const styles = await xmlOf(blob, "word/styles.xml");
    expect(styles).toMatch(/w:styleId="Heading2"[\s\S]*?<w:outlineLvl w:val="1"\/>/);
  });

  it("restarts numbering for each ordered list", async () => {
    const { blob } = await markdownToDocx("1. a\n2. b\n\nText\n\n1. c\n");
    const xml = await xmlOf(blob);
    const ids = [...xml.matchAll(/<w:numId w:val="(\d+)"\/>/g)].map((m) => m[1]);
    expect(ids).toHaveLength(3);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[0]);
  });

  it("round-trips through Word to Markdown", async () => {
    const { blob } = await markdownToDocx(SAMPLE);
    const file = new File([blob], "plan.docx");
    const { markdown } = await docxToMarkdown(file);
    expect(markdown).toContain("# Project plan");
    expect(markdown).toContain("## Steps");
    expect(markdown).toContain("**bold**");
    expect(markdown).toContain("[link](https://example.com)");
    expect(markdown).toMatch(/1\. First/);
    expect(markdown.replace(/[ \t]+/g, " ")).toContain("| Name | Qty |");
  });

  it("embeds data: URI images and reports linked ones", async () => {
    // 1×1 transparent PNG.
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const { blob, warnings } = await markdownToDocx(`![dot](${png})\n\n![remote](https://example.com/a.png)\n`);
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    expect(Object.keys(files).some((f) => f.startsWith("word/media/"))).toBe(true);
    expect(await xmlOf(blob)).toContain("[remote]");
    expect(warnings.join(" ")).toMatch(/not embedded/);
  });

  it("produces a valid document from empty input", async () => {
    const { blob } = await markdownToDocx("");
    expect(await xmlOf(blob)).toContain("<w:body>");
  });
});

describe("imageDimensions", () => {
  it("reads PNG and GIF headers, rejects garbage", () => {
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
    expect(imageDimensions(png)).toEqual({ type: "png", width: 1, height: 1 });
    const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 3, 0, 2, 0, ...new Array(20).fill(0)]);
    expect(imageDimensions(gif)).toEqual({ type: "gif", width: 3, height: 2 });
    expect(imageDimensions(new Uint8Array(30))).toBeNull();
  });
});
