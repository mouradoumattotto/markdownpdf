import { getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";
import { TOOLS, liveCategories } from "@/lib/tools";

// /llms.txt — a plain-text map of the site for LLM crawlers and answer engines
// (https://llmstxt.org). Generated from the same post list as the sitemap so it
// never drifts from what is actually published.
export const dynamic = "force-static";

export function GET() {
  const posts = getAllPosts();
  const guide = (slug: string) => posts.find((p) => p.slug === slug);
  const line = (p: { slug: string; title: string; description: string }) =>
    `- [${p.title}](${SITE.url}/blog/${p.slug}): ${p.description}`;

  const featured = [
    "how-to-convert-pdf-to-markdown",
    "why-llms-prefer-markdown",
    "convert-pdf-to-markdown-for-chatgpt",
    "convert-pdf-to-markdown-for-claude",
    "pdf-to-markdown-for-notebooklm",
    "pdf-to-markdown-for-obsidian",
    "pdf-to-markdown-for-notion",
    "pdf-to-markdown-for-rag-pipelines",
    "extract-text-from-scanned-pdf",
    "markdown-cheat-sheet",
  ]
    .map(guide)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const featuredSlugs = new Set(featured.map((p) => p.slug));
  const rest = posts.filter((p) => !featuredSlugs.has(p.slug));

  const body = `# MarkdownPDF

> Free, browser-based converter between PDF and Markdown. PDF to Markdown extraction with automatic OCR for scanned pages, and Markdown to PDF export with real selectable text. Files are processed locally in the browser and are never uploaded to a server. No account, no watermark, no page limit.

Key facts:
- Every tool runs entirely client-side: text extraction with pdf.js, OCR with Tesseract.js (English, French, Spanish, German, Portuguese, Italian, Arabic), PDF writing with pdf-lib. The OCR engine is self-hosted; no third-party service processes files.
- Markdown to PDF produces a vector A4 PDF (selectable, searchable text) from CommonMark/GFM input, including tables and code blocks.
- Typical use: preparing PDFs for ChatGPT, Claude, NotebookLM, RAG pipelines, Obsidian, Notion, Logseq, docs-as-code sites, and Git-tracked notes.
- Publisher: MarkdownPDF (${SITE.url}), written and maintained by Mourad Oumita. Contact: contact@markdownpdf.app.

## Tools

${TOOLS.map((t) => `- [${t.name}](${SITE.url}${t.path === "/" ? "/" : t.path}): ${t.tagline} Input: ${t.input.join(", ")}. Output: ${t.output.join(", ")}.`).join("\n")}
${liveCategories().length ? `\n## Tool categories\n\n${liveCategories().map((c) => `- [${c.name}](${SITE.url}${c.path}): ${c.blurb}`).join("\n")}\n` : ""}
## Guides

${featured.map(line).join("\n")}

## More guides

${rest.map(line).join("\n")}

## About

- [About MarkdownPDF](${SITE.url}/about): Who builds it and why.
- [How it works](${SITE.url}/how-it-works): Local processing, the libraries used, and how to verify that files are never uploaded.
- [Sitemap](${SITE.url}/sitemap.xml)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
