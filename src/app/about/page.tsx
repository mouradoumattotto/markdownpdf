import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import { TOOLS, liveCategories, toolsIn } from "@/lib/tools";

const UPDATED = "November 28, 2026";

export const metadata: Metadata = {
  title: "About",
  description:
    "MarkdownPDF is a set of free, privacy-first PDF, OCR and Markdown tools that run in your browser, built by Mourad Oumita. Why it exists, how it works and how it is tested.",
  alternates: { canonical: "/about" },
};

// Every bylined blog post points its `author` Person at /about. This page is
// where that entity is actually described, so the Person node lives here with
// a stable @id the posts can be reconciled against.
const AUTHOR = {
  name: "Mourad Oumita",
  id: `${SITE.url}/about#author`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "AboutPage",
              "@id": `${SITE.url}/about`,
              url: `${SITE.url}/about`,
              name: "About MarkdownPDF",
              about: { "@id": `${SITE.url}/#organization` },
              mainEntity: { "@id": AUTHOR.id },
            },
            {
              "@type": "Person",
              "@id": AUTHOR.id,
              name: AUTHOR.name,
              url: `${SITE.url}/about`,
              jobTitle: "Software developer",
              worksFor: { "@id": `${SITE.url}/#organization` },
              knowsAbout: [
                "PDF text extraction",
                "OCR",
                "Markdown",
                "Document conversion",
                "Browser-based (client-side) applications",
              ],
            },
          ],
        }}
      />
      <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-neutral-900">About MarkdownPDF</h1>
      <p className="mt-3 text-sm text-neutral-500">Last updated {UPDATED}</p>
      <div className="prose prose-neutral mt-6 max-w-none prose-a:text-indigo-600">
        <p>
          MarkdownPDF started in June 2026 as a single converter from PDF to Markdown. It is now a
          set of {TOOLS.length} free document tools — PDF, OCR, Markdown and AI preparation — built
          around one rule: <strong>converting a file should not require uploading it to someone
          else&apos;s server.</strong>
        </p>

        <h2>Privacy by design</h2>
        <p>
          Most online converters send your file to a server, process it there, and send back the
          result. Your contracts, reports and notes pass through — and may be stored on —
          infrastructure you don&apos;t control. Here, every tool runs as JavaScript inside your own
          browser tab: the file is read on your device and the result is saved straight back to it.
          We couldn&apos;t read your documents even if we wanted to. You can check it yourself:
          open your browser&apos;s developer tools on the Network tab while a conversion runs — the
          document never appears in an outgoing request. <Link href="/how-it-works">How it works</Link>{" "}
          explains each step in detail.
        </p>

        <h2>The tools</h2>
        <p>
          Every tool is free, with no account, no watermark and no daily limit. They are grouped by
          job:
        </p>
        {liveCategories().map((c) => (
          <div key={c.id}>
            <h3>
              <Link href={c.path}>{c.name}</Link>
            </h3>
            <p>{c.blurb}</p>
            <ul>
              {toolsIn(c.id).map((t) => (
                <li key={t.slug}>
                  <Link href={t.path}>{t.name}</Link> — {t.tagline}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <h2>How it works under the hood</h2>
        <p>
          PDFs are read with <a href="https://mozilla.github.io/pdf.js/" rel="noopener">pdf.js</a>,
          the open-source engine Firefox uses to display PDFs. To rebuild Markdown, the converter
          infers headings, lists, emphasis, columns and tables from font sizes, weights and the
          position of every line. Pages with no text layer are rendered to an image and recognized
          with <a href="https://tesseract.projectnaptha.com/" rel="noopener">Tesseract.js</a>, an
          open-source OCR engine compiled to run in the browser. Markdown to PDF parses your text
          with a CommonMark/GFM parser and lays it out as vector text, so the result is selectable
          and searchable rather than a screenshot. PDF editing tools — split, merge, organize,
          unlock, redact, metadata — rewrite the file itself in the browser. Redaction, for
          instance, replaces each redacted page with a flattened image, so the hidden text is
          really gone rather than sitting under a black box.
        </p>

        <h2>How the tools are tested</h2>
        <p>
          Each tool is tested against real public documents rather than hand-made demo files: a
          scanned 1930s NACA technical report for OCR, IRS and NIST publications for forms and
          long structured text, census and energy-agency PDFs for tables, and an open-access
          research paper for two-column layouts. Those same files are offered as samples on the
          converters, so you can see what the output looks like before you try your own — the{" "}
          <Link href="/examples">examples page</Link> shows them side by side. An automated test
          suite also runs every tool in Chrome, Firefox and mobile Chrome.
        </p>

        <h2>What has changed</h2>
        <ul>
          <li><strong>June 2026</strong> — launch with PDF to Markdown (with OCR) and Markdown to PDF, and the first guides.</li>
          <li><strong>July–August 2026</strong> — guides for using converted PDFs with Claude, ChatGPT, NotebookLM, Obsidian, Notion and RAG pipelines.</li>
          <li><strong>September 2026</strong> — OCR in seven languages running on your device; Split PDF for AI, sized for ChatGPT, Claude, NotebookLM and Gemini; the PDF metadata viewer and remover; PDF to Text, OCR a PDF, Image to Text; Word, HTML and Markdown converters; split, merge and organize; the token counter and RAG chunker.</li>
          <li><strong>October 2026</strong> — real sample documents on every converter, column-aware conversion, tables to CSV, batch conversion and PDF to Obsidian; then PNG, Unlock, Redact, EPUB and HTML to PDF tools, and “Continue with” to pass a result from one tool to the next without downloading it.</li>
          <li><strong>November 2026</strong> — the <Link href="/blog/ai-file-upload-limits">AI upload-limits guide</Link> rebuilt per tool and plan from the vendors&apos; own documentation.</li>
        </ul>

        <h2>Who builds it</h2>
        <p>
          MarkdownPDF is built and maintained by <strong>{AUTHOR.name}</strong>, an independent
          software developer. The guides on the <Link href="/blog">blog</Link> are written by him,
          based on how the tools actually behave on real documents — not on marketing copy — and
          are updated when a tool or a vendor limit changes; each guide shows when it was last
          revised. The source code is public on{" "}
          <a href="https://github.com/mouradoumattotto/markdownpdf" rel="noopener">GitHub</a>.
        </p>

        <h2>Corrections</h2>
        <p>
          If a guide is wrong or out of date, or a tool mangles one of your documents, please{" "}
          <Link href="/contact">tell us</Link>. Confirmed errors in guides are corrected and the
          revision date updated; conversion bugs are fixed and added to the test files.
        </p>

        <h2>Free, with no catch</h2>
        <p>
          The tools are free and will stay free. Because conversion runs on your device, there are
          no servers processing files to pay for; the site is supported by advertising, which is
          never placed inside a tool or next to a download button.
        </p>
      </div>
    </div>
  );
}
