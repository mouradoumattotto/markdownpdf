import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import MarkdownChunkerTool from "@/components/MarkdownChunkerTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Split Markdown, PDFs and Word files into token-sized chunks for RAG and embeddings — at headings, never inside code — and export JSONL. Free, in your browser.";

export const metadata: Metadata = {
  title: "Markdown Chunker for RAG — Token Splitter",
  description: DESCRIPTION,
  alternates: { canonical: "/markdown-chunker" },
  openGraph: {
    title: "Markdown chunker for RAG and embeddings",
    description: "Token-sized chunks that respect headings and code blocks, exported as JSONL.",
    url: "/markdown-chunker",
  },
};

const faqItems = [
  {
    question: "How does it decide where to cut?",
    answer:
      "Structure first. Every heading starts a new chunk. Within a section, whole blocks — paragraphs, lists, tables, fenced code — are packed together until the next one would go over the token limit. Only a block that is larger than the limit on its own is split further, at sentence boundaries, and as a last resort between words. Code blocks and tables are never cut in the middle unless they are larger than a chunk.",
  },
  {
    question: "What chunk size should I use?",
    answer:
      "There is no universal answer, but 256–1,000 tokens is the usual range for retrieval: small enough that a retrieved chunk is about one thing, large enough to carry its context. Check your embedding model’s input limit — OpenAI’s text-embedding-3 models accept up to 8,191 tokens — and test retrieval quality on real questions.",
  },
  {
    question: "What does overlap do?",
    answer:
      "It repeats the last few dozen tokens of one chunk at the start of the next, so a sentence that straddles a boundary can still be found from either side. 10–15% of the chunk size is a common starting point; overlap never crosses a heading, since a new section starts fresh.",
  },
  {
    question: "Why repeat the headings in each chunk?",
    answer:
      "A chunk that says “Set the timeout to 30 seconds” is ambiguous on its own; prefixed with “# API guide > ## Retries”, it is not. Repeating the heading path makes every chunk self-describing, which usually improves both retrieval and the answer generated from it.",
  },
  {
    question: "What is in the JSONL file?",
    answer:
      "One JSON object per line: id, text, tokens, headings (the heading path as a list) and the tokenizer used. It loads directly into most vector-database import tools, LangChain and LlamaIndex, or a few lines of Python.",
  },
  {
    question: "Is my document uploaded?",
    answer: "No. Text extraction, tokenization and chunking all run in your browser, in a background thread.",
  },
];

export default function MarkdownChunkerPage() {
  const tool = getTool("markdown-chunker")!;
  return (
    <>
      <ToolJsonLd slug="markdown-chunker" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Markdown Chunker{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">for RAG</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Split a document into chunks of an exact token size — at headings and paragraphs, never inside a code
            block — and export them as JSONL for your vector database.
          </p>
          <div className="mt-10">
            <MarkdownChunkerTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Chunking decides what retrieval can find</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            In a retrieval-augmented generation (RAG) pipeline, documents are cut into chunks, each chunk is
            embedded, and the chunks closest to a question are handed to the model. A chunk that mixes two topics
            matches neither well; a chunk cut mid-table or mid-function is useless when retrieved. Splitting on the
            document&apos;s own structure avoids both.
          </p>
          <p>
            That structure has to exist first. PDFs, the most common source, carry none — so convert them to
            Markdown with <Link href="/">PDF to Markdown</Link> (or drop them here, which does the same), and read{" "}
            <Link href="/blog/pdf-to-markdown-for-rag-pipelines">PDF to Markdown for RAG pipelines</Link> for the
            rest of the pipeline. To check a single chunk or prompt, use the{" "}
            <Link href="/token-counter">token counter</Link>.
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
          <li>Token sizes are exact for OpenAI tokenizers; other models count differently.</li>
          <li>Headings are recognised in Markdown syntax (#); plain text is split by paragraphs and sentences.</li>
          <li>A single code block or table larger than the chunk size is split, as it cannot fit otherwise.</li>
          <li>The preview shows the first 200 chunks; downloads always contain all of them.</li>
        </ul>
      </section>

      <RelatedTools slug="markdown-chunker" />
      <ToolGuides slug="markdown-chunker" />
    </>
  );
}
