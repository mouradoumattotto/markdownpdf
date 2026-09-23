import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import MarkdownToHtmlTool from "@/components/MarkdownToHtmlTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Convert Markdown to clean, sanitised HTML with a live preview — a fragment to paste into a CMS, or a complete page. GitHub-flavored, free, in your browser.";

export const metadata: Metadata = {
  title: "Markdown to HTML Converter with Live Preview",
  description: DESCRIPTION,
  alternates: { canonical: "/markdown-to-html" },
  openGraph: {
    title: "Markdown to HTML with a live preview",
    description: "Sanitised, GitHub-flavored HTML from Markdown — a fragment or a full page.",
    url: "/markdown-to-html",
  },
};

const faqItems = [
  {
    question: "Fragment or complete page — which do I need?",
    answer:
      "A fragment (the default) is just the converted content: <h1>, <p>, <ul> and so on, ready to paste into a CMS, an email template or an existing page. A complete page wraps it in <!doctype html>, <head> and a little CSS so it opens nicely on its own in a browser; its <title> is taken from the first heading.",
  },
  {
    question: "Which Markdown syntax is supported?",
    answer:
      "GitHub-flavored Markdown: headings, emphasis, links, images, lists, task lists, pipe tables with alignment, strikethrough, blockquotes and fenced code blocks, which keep their language as class=\"language-…\" for any syntax highlighter. YAML front matter at the top of the file is left out of the HTML.",
  },
  {
    question: "Is the output safe to put on my site?",
    answer:
      "The HTML is sanitised with DOMPurify: <script> tags, inline event handlers such as onclick and javascript: links are removed, even if they were written into the Markdown as raw HTML. Harmless raw HTML such as <details> or <kbd> is kept.",
  },
  {
    question: "What about Mermaid diagrams and math?",
    answer:
      "They are exported as their source — a ```mermaid code block and $…$ expressions — which is what GitHub, GitLab and most documentation generators expect and render themselves. For a document with the diagrams and equations drawn, use Markdown to PDF.",
  },
  {
    question: "Is my Markdown uploaded?",
    answer: "No. The conversion runs in your browser as you type. Nothing is sent to a server or stored.",
  },
];

export default function MarkdownToHtmlPage() {
  const tool = getTool("markdown-to-html")!;
  return (
    <>
      <ToolJsonLd slug="markdown-to-html" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Markdown to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              HTML
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Write or paste Markdown and get clean, sanitised HTML as you type — a fragment for your CMS or a complete
            page. With a live preview, and nothing uploaded.
          </p>
          <div className="mt-10">
            <MarkdownToHtmlTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Markdown in, HTML out</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Markdown is the pleasant way to write; HTML is what browsers, email clients and most CMS editors
            actually take. This converter produces plain, semantic HTML — no wrapper <code>div</code>s, no inline
            styles, no framework classes — so it drops into any design and inherits its styling.
          </p>
          <h3>Why the output is sanitised</h3>
          <p>
            Markdown allows raw HTML, so a Markdown file from someone else can hide a <code>&lt;script&gt;</code>{" "}
            or an <code>onerror</code> handler. Pasting that into a CMS is a classic way to inject code into a site.
            Every conversion here goes through DOMPurify first, so what you copy is safe to publish.
          </p>
          <h3>Other formats</h3>
          <p>
            Need a document rather than a web page? <Link href="/markdown-to-pdf">Markdown to PDF</Link> draws
            Mermaid diagrams and LaTeX math too. Starting from a page you already have?{" "}
            <Link href="/html-to-markdown">HTML to Markdown</Link> goes the other way. New to the syntax? Start with
            the <Link href="/blog/markdown-cheat-sheet">cheat sheet</Link>.
          </p>
        </div>
      </section>

      <AdSlot placement="tool" />

      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-bold text-neutral-900">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>Mermaid diagrams and math are exported as source, not drawn.</li>
          <li>Footnotes, definition lists and other extensions beyond GitHub-flavored Markdown are not converted.</li>
        </ul>
      </section>

      <RelatedTools slug="markdown-to-html" />
      <ToolGuides slug="markdown-to-html" />
    </>
  );
}
