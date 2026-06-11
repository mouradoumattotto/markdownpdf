import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "MarkdownPDF is a free, privacy-first converter between PDF and Markdown. Learn why we built it and how it works.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
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
            <Link href="/pdf-to-markdown">PDF to Markdown</Link> extracts the text from a PDF and
            rebuilds its structure — headings, lists, emphasis — as clean Markdown. When a page is
            scanned and has no text layer, built-in OCR recognizes the text automatically.
          </li>
          <li>
            <Link href="/markdown-to-pdf">Markdown to PDF</Link> turns Markdown into a polished A4
            PDF with real, selectable vector text — including tables, code blocks, and links.
          </li>
        </ul>
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
