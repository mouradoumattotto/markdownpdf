import type { Metadata } from "next";
import Link from "next/link";
import HubPage from "@/components/HubPage";

export const metadata: Metadata = {
  title: "AI Document Tools for ChatGPT & RAG",
  description:
    "Free tools to get documents ready for ChatGPT, Claude, NotebookLM and RAG: convert PDFs to Markdown, split to upload limits, count tokens, chunk text. No upload.",
  alternates: { canonical: "/ai-document-tools" },
  openGraph: {
    title: "AI document tools that never upload your files",
    description: "Convert, split, count and chunk documents for AI — in your browser.",
    url: "/ai-document-tools",
  },
};

export default function AiDocumentToolsPage() {
  return (
    <HubPage
      category="ai"
      heading="Get documents ready for AI — without handing them over"
      lead={
        <>
          AI tools read clean text best, have hard limits on what they accept, and bill by the token. These tools
          handle the preparation: turning PDFs into structured Markdown, splitting what is too long, and measuring
          what you are about to send. All of it runs in your browser, so the document goes to the AI of your choice
          and nowhere else.
        </>
      }
      guides={["ai-file-upload-limits", "why-llms-prefer-markdown", "pdf-to-markdown-for-rag-pipelines", "pdf-to-markdown-for-notebooklm"]}
    >
      <h2>Which one do you need?</h2>
      <ul>
        <li>
          <strong>The AI misreads your PDF.</strong> <Link href="/">PDF to Markdown</Link> gives it headings,
          lists and tables instead of broken lines — and OCRs scanned pages it would otherwise skip.
        </li>
        <li>
          <strong>The file is refused as too large.</strong> <Link href="/split-pdf-for-ai">Split PDF for AI</Link>{" "}
          cuts it to the limits of NotebookLM, ChatGPT, Claude or Gemini, at chapter boundaries.
        </li>
        <li>
          <strong>You need to know if it fits.</strong> The <Link href="/token-counter">token counter</Link> gives
          exact OpenAI counts for text, PDFs and Word files.
        </li>
        <li>
          <strong>You are building a RAG pipeline.</strong> The{" "}
          <Link href="/markdown-chunker">Markdown chunker</Link> splits documents into token-sized chunks at
          headings and exports JSONL.
        </li>
      </ul>
      <h2>Why prepare documents at all?</h2>
      <p>
        Because the answer can only be as good as what the model read. A PDF uploaded as-is may be partly skipped,
        its tables flattened, its scanned pages ignored — and the answer comes back confident anyway. The{" "}
        <Link href="/blog/ai-file-upload-limits">guide to AI upload limits</Link> covers what each tool accepts and
        what happens beyond it.
      </p>
    </HubPage>
  );
}
