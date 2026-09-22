import type { Metadata } from "next";
import Link from "next/link";
import HubPage from "@/components/HubPage";

export const metadata: Metadata = {
  title: "Free PDF Tools — No Upload, No Account",
  description:
    "Free PDF tools that run in your browser: convert PDFs to Markdown with OCR, split them for AI tools, build PDFs from Markdown. Your files never leave your device.",
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
          <strong>You are going the other way.</strong> <Link href="/markdown-to-pdf">Markdown to PDF</Link> turns
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
