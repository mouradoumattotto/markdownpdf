import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "MarkdownPDF is a free, privacy-first converter between PDF and Markdown, built and maintained by Mourad Oumita. Learn why it exists and how it works.",
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
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">About MarkdownPDF</h1>
      <div className="prose prose-neutral mt-6 max-w-none prose-a:text-indigo-600">
        <p>
          MarkdownPDF is a free online tool for converting documents between PDF and Markdown. We
          built it around one simple idea: <strong>file conversion should not require uploading
          your documents to someone else&apos;s server.</strong>
        </p>
        <h2>Privacy by design</h2>
        <p>
          Most online converters send your file to a server, process it there, and send back the
          result. That means your contracts, reports, and notes pass through — and may be stored
          on — infrastructure you don&apos;t control. MarkdownPDF works differently: all conversion
          runs as JavaScript inside your own browser. Your files never leave your device. We
          couldn&apos;t read them even if we wanted to.
        </p>
        <h2>What the tools do</h2>
        <ul>
          <li>
            <Link href="/">PDF to Markdown</Link> extracts the text from a PDF and
            rebuilds its structure — headings, lists, emphasis — as clean Markdown. When a page is
            scanned and has no text layer, built-in OCR recognizes the text automatically.
          </li>
          <li>
            <Link href="/md-to-pdf">Markdown to PDF</Link> turns Markdown into a polished A4
            PDF with real, selectable vector text — including tables, code blocks, and links.
          </li>
        </ul>
        <h2>How it works under the hood</h2>
        <p>
          PDF to Markdown reads the file with <a href="https://mozilla.github.io/pdf.js/" rel="noopener">pdf.js</a>,
          the same open-source engine Firefox uses to display PDFs, and infers headings, lists,
          and emphasis from font sizes and weights. Pages that carry no text layer are rendered to
          an image and recognized with <a href="https://tesseract.projectnaptha.com/" rel="noopener">Tesseract.js</a>,
          an open-source OCR engine compiled to run in the browser. Markdown to PDF parses your
          text with a CommonMark/GFM parser and lays it out as vector text, so the result is
          selectable and searchable rather than a screenshot.
        </p>
        <h2>Who builds it</h2>
        <p>
          MarkdownPDF is built and maintained by <strong>{AUTHOR.name}</strong>, an independent
          software developer. The guides on the <Link href="/blog">blog</Link> are written by him,
          based on how the converter actually behaves on real documents — not on marketing copy.
        </p>
        <h2>Free, with no catch</h2>
        <p>
          Both tools are free, with no account, watermark, or artificial limits. The site is
          supported by advertising, which keeps the converters free for everyone.
        </p>
        <p>
          Questions or feedback? <Link href="/contact">Get in touch</Link> — we read everything.
        </p>
      </div>
    </div>
  );
}
