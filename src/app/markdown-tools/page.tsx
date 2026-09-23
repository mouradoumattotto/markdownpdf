import type { Metadata } from "next";
import Link from "next/link";
import HubPage from "@/components/HubPage";

export const metadata: Metadata = {
  title: "Free Markdown Tools: Word, HTML and PDF",
  description:
    "Free Markdown converters that run in your browser: PDF, Word and HTML to Markdown, and Markdown to PDF or HTML. Nothing is uploaded.",
  alternates: { canonical: "/markdown-tools" },
  openGraph: {
    title: "Markdown tools that never upload your files",
    description: "Word, HTML and PDF to and from Markdown, converted in your browser.",
    url: "/markdown-tools",
  },
};

export default function MarkdownToolsPage() {
  return (
    <HubPage
      category="markdown"
      heading="Markdown tools: in from anything, out to anything"
      lead={
        <>
          Markdown is plain text with just enough structure — headings, lists, tables, links — which makes it the
          easiest format to edit, version, publish and hand to an AI model. These converters get your documents
          into Markdown and back out again, entirely in your browser.
        </>
      }
      guides={["what-is-markdown-complete-guide", "markdown-cheat-sheet", "pdf-vs-word-vs-markdown", "why-llms-prefer-markdown"]}
    >
      <h2>Which one do you need?</h2>
      <ul>
        <li>
          <strong>You have a PDF.</strong> <Link href="/">PDF to Markdown</Link> recovers headings, lists and
          emphasis, and runs OCR on scanned pages.
        </li>
        <li>
          <strong>You have a Word document.</strong> <Link href="/docx-to-markdown">Word to Markdown</Link> reads
          the .docx directly, including tables and images.
        </li>
        <li>
          <strong>You have a web page or a Google Doc.</strong> <Link href="/html-to-markdown">HTML to Markdown</Link>{" "}
          takes pasted HTML or formatted text copied from the page.
        </li>
        <li>
          <strong>You wrote Markdown and need to share it.</strong>{" "}
          <Link href="/markdown-to-pdf">Markdown to PDF</Link> for a document, with diagrams and math;{" "}
          <Link href="/markdown-to-html">Markdown to HTML</Link> for a web page, a CMS or an email.
        </li>
      </ul>
      <h2>Why convert through Markdown at all?</h2>
      <p>
        Because it separates what a document says from how it looks. The same Markdown file can become a PDF, a
        web page or a slide deck; it diffs cleanly in Git; and language models read it with fewer tokens and fewer
        mistakes than PDF or HTML. The <Link href="/blog/pdf-vs-word-vs-markdown">PDF vs Word vs Markdown</Link>{" "}
        guide covers when each format is the right one to keep.
      </p>
    </HubPage>
  );
}
