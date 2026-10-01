import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, Breadcrumbs } from "@/components/ToolSeo";
import { OCR_LANGUAGES } from "@/lib/ocr";

export const metadata: Metadata = {
  title: "How It Works: Local Processing, No Uploads",
  description:
    "How MarkdownPDF converts files without uploading them: which libraries run in your browser, what the network is used for, and how to verify it yourself.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How MarkdownPDF works — local processing, verifiable",
    description:
      "Which libraries run in your browser, what the network is used for, and how to check that your files are never uploaded.",
    url: "/how-it-works",
  },
};

const crumbs = [
  { name: "Home", path: "/" },
  { name: "How it works", path: "/how-it-works" },
];

const libraries = [
  { name: "pdf.js (Mozilla)", role: "Reads PDFs: text extraction, page rendering, JBIG2 and JPEG 2000 image decoding." },
  { name: "Tesseract.js", role: `OCR for scanned pages and images, in ${OCR_LANGUAGES.length} languages (${OCR_LANGUAGES.map((l) => l.label).join(", ")}).` },
  { name: "pdf-lib", role: "Writes PDFs: splitting, merging, reorganizing, metadata editing and removal." },
  { name: "marked", role: "Parses Markdown for previews and conversions." },
  { name: "jsPDF", role: "Generates PDFs with real, selectable text from Markdown." },
  { name: "Mermaid and MathJax", role: "Draw diagrams and equations in Markdown previews and PDFs." },
  { name: "mammoth", role: "Reads Word .docx files for Word to Markdown." },
  { name: "Turndown", role: "Turns HTML — pasted, saved or converted from Word — into Markdown." },
  { name: "docx", role: "Writes Word .docx files from Markdown." },
  { name: "DOMPurify", role: "Sanitises HTML so previews and exports cannot carry scripts." },
  { name: "js-tiktoken", role: "OpenAI's tokenizers, for exact token counts and chunking." },
  { name: "jsdiff", role: "Compares two texts line by line and word by word." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <BreadcrumbJsonLd crumbs={crumbs} />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-4xl">
        How MarkdownPDF works
      </h1>
      <div className="prose prose-neutral mt-8 max-w-none prose-a:text-indigo-600">
        <p className="lead">
          Every tool on this site processes your files inside your own browser. The file is read
          from your disk into the page, converted by JavaScript and WebAssembly running on your
          device, and handed back to you as a download. It is never sent to a server — ours or
          anyone else&apos;s. This page explains how that works and, more usefully, how you can
          check it yourself instead of taking our word for it.
        </p>

        <h2>What happens when you drop a file</h2>
        <ol>
          <li>
            <strong>Your browser reads the file locally.</strong> The page gets the bytes through
            the standard File API — the same mechanism a photo editor uses to open an image. No
            network request is involved.
          </li>
          <li>
            <strong>The conversion code runs on your device.</strong> The libraries listed below
            are downloaded once, like any other part of a web page, and then run locally. Heavy
            work (PDF parsing, OCR) happens in Web Workers so the page stays responsive.
          </li>
          <li>
            <strong>The result is built in memory and saved by your browser.</strong> Downloads are
            generated with a local <code>blob:</code> URL; nothing is uploaded to produce them.
          </li>
        </ol>

        <h2>The libraries doing the work</h2>
        <table>
          <thead>
            <tr>
              <th>Library</th>
              <th>What it does here</th>
            </tr>
          </thead>
          <tbody>
            {libraries.map((l) => (
              <tr key={l.name}>
                <td>{l.name}</td>
                <td>{l.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          All of them, including the OCR engine and its language files, are served from
          markdownpdf.app itself. No part of the conversion depends on a third-party CDN.
        </p>

        <h2>What the network is used for</h2>
        <ul>
          <li>
            <strong>Loading the site and its tools</strong> — HTML, JavaScript, the OCR engine,
            language data and fonts, all from markdownpdf.app. Large parts (like the OCR engine)
            load only when a tool needs them.
          </li>
          <li>
            <strong>Google Analytics</strong> — anonymous usage statistics: which pages are visited,
            and coarse tool events such as &ldquo;a conversion started&rdquo;, &ldquo;it
            succeeded&rdquo;, &ldquo;OCR was used&rdquo;. Events carry only buckets like the file
            size range (&ldquo;1–10 MB&rdquo;) and the format. File names, document text and
            document metadata are never sent: the code that sends events drops any parameter that
            is not on a short, fixed list.
          </li>
          <li>
            <strong>Images referenced by your Markdown</strong> — if your Markdown contains an image
            URL, your browser loads it from that address, as it would in any Markdown preview.
          </li>
          <li>
            <strong>Advertising, if enabled</strong> — the site may show Google ads. Ads are
            third-party content with their own cookies (see the{" "}
            <Link href="/privacy-policy">privacy policy</Link>); they have no access to the files
            you convert, which never leave the tool.
          </li>
        </ul>

        <h2>How to verify it yourself</h2>
        <p>You do not have to trust this page. Two checks take a minute:</p>
        <ol>
          <li>
            <strong>Watch the network.</strong> Open your browser&apos;s developer tools (F12),
            switch to the <em>Network</em> tab, then convert a file. You will see the tool&apos;s
            code load, and analytics pings — but no request carrying your document.
          </li>
          <li>
            <strong>Read the Content-Security-Policy.</strong> Every page is served with a{" "}
            <code>Content-Security-Policy</code> header. Its <code>connect-src</code> directive is
            the complete list of destinations the page is allowed to send data to: this site
            itself (which has no endpoint that accepts files) and Google Analytics. The browser
            enforces it — even a bug in our code could not send your file anywhere else.
          </li>
        </ol>

        <h2>What we cannot promise</h2>
        <ul>
          <li>
            <strong>Your own browser and extensions.</strong> Browser extensions with access to
            every page can read what any page reads. That is outside what a website can control.
          </li>
          <li>
            <strong>Speed on large files.</strong> Because the work happens on your device, a
            300-page scanned PDF takes as long as your computer needs. Every long task shows its
            progress and can be cancelled.
          </li>
          <li>
            <strong>Perfect conversions.</strong> Each tool lists its limitations on its own page.
            PDF is a layout format, not a structure format, so some conversions are best-effort.
          </li>
        </ul>

        <p>
          Questions or a finding that contradicts this page? Write to{" "}
          <a href="mailto:contact@markdownpdf.app">contact@markdownpdf.app</a> — it will be
          answered and, if we are wrong, fixed here.
        </p>
      </div>
    </div>
  );
}
