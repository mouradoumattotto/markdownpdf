import type { Metadata } from "next";
import Link from "next/link";
import HubPage from "@/components/HubPage";

export const metadata: Metadata = {
  title: "Free PDF Tools — No Upload, No Account",
  description:
    "Free PDF tools that run in your browser: convert PDFs to Markdown with OCR, split them for AI tools, build PDFs from Markdown. Files never leave your device.",
  alternates: { canonical: "/pdf-tools" },
  openGraph: {
    title: "Free PDF tools that never upload your files",
    description:
      "Convert, split and build PDFs in your browser — with OCR in seven languages, and nothing sent to a server.",
    url: "/pdf-tools",
  },
};

export default function PdfToolsPage() {
  return (
    <HubPage
      category="pdf"
      heading="PDF tools that never upload your files"
      lead={
        <>
          Every tool here runs inside your browser: the PDF is read from your disk, processed on your device, and
          handed back as a download. Nothing is sent to a server — which is the point, because the PDFs people need
          to convert are usually contracts, medical records, invoices or unpublished work.
        </>
      }
      guides={[
        "how-to-convert-pdf-to-markdown",
        "extract-text-from-scanned-pdf",
        "extract-tables-from-pdf-to-markdown",
        "best-pdf-to-markdown-converters",
      ]}
    >
      <h2>Which one do you need?</h2>
      <ul>
        <li>
          <strong>You want the text, structured.</strong> <Link href="/">PDF to Markdown</Link> rebuilds headings,
          lists and emphasis, and runs OCR automatically on scanned pages in seven languages.
        </li>
        <li>
          <strong>You are feeding an AI tool.</strong> <Link href="/split-pdf-for-ai">Split PDF for AI</Link> cuts a
          long document into parts that fit NotebookLM, ChatGPT, Claude or Gemini — by chapter when the PDF has
          bookmarks.
        </li>
        <li>
          <strong>You need fewer pages, or more files in one.</strong> <Link href="/split-pdf">Split PDF</Link> cuts
          by page ranges or extracts the pages you need; <Link href="/merge-pdf">Merge PDF</Link> combines files in
          the order you choose. Both copy pages untouched, so nothing loses quality.
        </li>
        <li>
          <strong>The pages need fixing.</strong> <Link href="/organize-pdf">Organize PDF</Link> reorders, rotates
          and deletes pages with a thumbnail of each.
        </li>
        <li>
          <strong>You need images, or have images.</strong> <Link href="/pdf-to-jpg">PDF to JPG</Link> and{" "}
          <Link href="/pdf-to-png">PDF to PNG</Link> render pages as images; <Link href="/jpg-to-pdf">JPG to PDF</Link>{" "}
          and <Link href="/png-to-pdf">PNG to PDF</Link> turn photos, scans and screenshots into one PDF.
        </li>
        <li>
          <strong>It is in another format.</strong> <Link href="/epub-to-pdf">EPUB to PDF</Link> makes a printable
          PDF of an e-book, <Link href="/pdf-to-epub">PDF to EPUB</Link> a reflowable e-book of a PDF, and{" "}
          <Link href="/html-to-pdf">HTML to PDF</Link> a clean document of a web page.
        </li>
        <li>
          <strong>You have two versions.</strong> <Link href="/text-diff">Compare text &amp; documents</Link> shows
          every changed word between two PDFs or Word files.
        </li>
        <li>
          <strong>You are about to share it.</strong> The <Link href="/pdf-metadata">PDF metadata viewer</Link> shows
          the author, software and dates hidden in the file, and removes them for good.{" "}
          <Link href="/redact-pdf">Redact PDF</Link> blacks out names, numbers and signatures so they cannot be
          copied back out.
        </li>
        <li>
          <strong>It is locked.</strong> <Link href="/unlock-pdf">Unlock PDF</Link> removes the password from a PDF
          you can open, so every other tool here can read it.
        </li>
        <li>
          <strong>You are going the other way.</strong> <Link href="/md-to-pdf">Markdown to PDF</Link> turns
          Markdown into a clean A4 document with real selectable text, diagrams and formulas included.
        </li>
      </ul>
      <p>
        Curious how conversion without a server actually works, or how to check the claim yourself? The{" "}
        <Link href="/how-it-works">how it works</Link> page explains the libraries involved and the two checks that
        prove no file is being uploaded.
      </p>
    </HubPage>
  );
}
