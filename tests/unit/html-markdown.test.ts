// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docxToMarkdown, htmlToMarkdown, markdownToHtml } from "@/lib/html-markdown";

const root = join(__dirname, "..", "..");
const fixture = (name: string) => readFileSync(join(root, "tests/fixtures/generated", name));
/** Turndown pads table cells so columns line up; compare without the padding. */
const squashed = (md: string) => md.replace(/[ \t]+/g, " ");

describe("HTML to Markdown", () => {
  const html = fixture("sample.html").toString();

  it("converts headings, emphasis, links, lists, tables and code", async () => {
    const md = await htmlToMarkdown(html);
    expect(md).toContain("# Release Notes");
    expect(md).toContain("**OCR**");
    expect(md).toContain("*faster*");
    expect(md).toContain("[the docs](https://example.com/docs)");
    expect(md).toContain("- First change");
    expect(squashed(md)).toContain("| Tool | Status |");
    expect(squashed(md)).toContain("| Split | Done |");
    expect(md).toContain("```js\nconst x = 1;\n```");
  });

  it("never carries scripts or styles across", async () => {
    const md = await htmlToMarkdown(html);
    expect(md).not.toContain("alert(");
    expect(md).not.toContain("color:red");
  });

  it("can strip page furniture", async () => {
    const page = `<body><nav><a href="/x">Menu</a></nav><main><h1>Real</h1><p>Body</p></main><footer>Legal</footer></body>`;
    const full = await htmlToMarkdown(page);
    expect(full).toContain("Menu");
    const main = await htmlToMarkdown(page, { mainContentOnly: true });
    expect(main).toContain("# Real");
    expect(main).not.toContain("Menu");
    expect(main).not.toContain("Legal");
  });

  it("keeps an article's own header when stripping the page frame", async () => {
    const page = `<header>Site</header><article><header><h1>Post title</h1></header><p>Text</p></article>`;
    const md = await htmlToMarkdown(page, { mainContentOnly: true });
    expect(md).toContain("# Post title");
    expect(md).not.toContain("Site");
  });

  it("keeps images only when asked", async () => {
    const withImage = `<p><img src="photo.png" alt="A photo"></p>`;
    expect(await htmlToMarkdown(withImage)).toBe("A photo\n");
    expect(await htmlToMarkdown(withImage, { keepImages: true })).toContain("![A photo](photo.png)");
  });
});

describe("Markdown to HTML", () => {
  it("returns a sanitised fragment by default", async () => {
    const html = await markdownToHtml("# Title\n\n- one\n- two\n\n<script>alert(1)</script>\n");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<li>one</li>");
    expect(html).not.toContain("<script>");
  });

  it("can wrap the fragment in a full document", async () => {
    const html = await markdownToHtml("# Hello", { fullDocument: true, title: "My page" });
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("<title>My page</title>");
    expect(html).toContain("<h1>Hello</h1>");
  });

  it("exports diagrams and math as portable source, not site-only placeholders", async () => {
    const html = await markdownToHtml("```mermaid\ngraph TD; A-->B\n```\n\nArea $\\pi r^2$\n");
    expect(html).toContain('class="language-mermaid"');
    expect(html).toContain("A--&gt;B");
    expect(html).toContain("$\\pi r^2$");
    expect(html).not.toContain("data-code");
    expect(html).not.toContain("data-tex");
  });

  it("drops YAML front matter", async () => {
    const html = await markdownToHtml("---\ntitle: Hello\ntags: [a]\n---\n\n# Body\n");
    expect(html).toContain("<h1>Body</h1>");
    expect(html).not.toContain("title: Hello");
    expect(html).not.toContain("<hr>");
  });

  it("round-trips through HTML without losing structure", async () => {
    const source = "# Title\n\n**bold** and *italic*\n\n- a\n- b\n\n| x | y |\n| --- | --- |\n| 1 | 2 |\n";
    const back = await htmlToMarkdown(await markdownToHtml(source));
    expect(back).toContain("# Title");
    expect(back).toContain("**bold**");
    expect(back).toContain("- a");
    expect(squashed(back)).toContain("| x | y |");
  });
});

describe("DOCX to Markdown", () => {
  const docxFile = () => new File([new Uint8Array(fixture("sample.docx"))], "sample.docx");

  it("keeps headings, emphasis, lists and tables", async () => {
    const { markdown } = await docxToMarkdown(docxFile());
    expect(markdown).toContain("# Release Notes");
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("**OCR**");
    expect(markdown).toContain("*faster*");
    expect(markdown).toContain("- First change");
    expect(squashed(markdown)).toContain("| Tool | Status |");
  });

  it("omits images by default and extracts them on request", async () => {
    const omitted = await docxToMarkdown(docxFile(), "omit");
    expect(omitted.images).toHaveLength(0);
    expect(omitted.markdown).not.toContain("](images/");

    const extracted = await docxToMarkdown(docxFile(), "extract");
    expect(extracted.images).toHaveLength(1);
    expect(extracted.images[0].name).toMatch(/^image-01\.(png|jpg)$/);
    expect(extracted.markdown).toContain("](images/image-01");

    const embedded = await docxToMarkdown(docxFile(), "embed");
    expect(embedded.markdown).toContain("](data:image/png;base64,");
  });
});
