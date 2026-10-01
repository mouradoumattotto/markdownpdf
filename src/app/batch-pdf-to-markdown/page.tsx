import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import BatchPdfTool from "@/components/BatchPdfTool";
import Faq from "@/components/Faq";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Convert many PDFs to Markdown at once, free and in your browser. OCR for scanned pages, optional images, one ZIP with a .md file per PDF. Nothing uploaded.";

export const metadata: Metadata = {
  title: "Batch PDF to Markdown — Convert Many PDFs at Once",
  description: DESCRIPTION,
  alternates: { canonical: "/batch-pdf-to-markdown" },
  openGraph: {
    title: "Batch PDF to Markdown — a folder of PDFs in one go",
    description: "Drop many PDFs, get one ZIP of Markdown files. Runs in your browser.",
    url: "/batch-pdf-to-markdown",
  },
};

const faqItems = [
  {
    question: "How many PDFs can I convert at once?",
    answer:
      "There is no fixed limit. Files are converted one after the other on your device, so the only constraint is your computer's memory and patience: text PDFs take about a second each, scanned pages a few seconds per page.",
  },
  {
    question: "What is in the ZIP?",
    answer:
      "One .md file per PDF, named after it. With “Extract images” ticked, each PDF gets its own folder holding the Markdown and an images/ folder, so the links in the Markdown keep working. Two PDFs with the same name are kept apart as “report” and “report (2)”.",
  },
  {
    question: "Why one file at a time and not in parallel?",
    answer:
      "Text extraction and OCR already use the processor fully. Running files side by side would not finish sooner — it would just make every file slower and the progress harder to read.",
  },
  {
    question: "Can I stop halfway?",
    answer:
      "Yes. Cancel stops after the current page; files already converted stay in the list and can be downloaded. Press Convert again to resume with the rest.",
  },
];

export default function BatchPdfToMarkdownPage() {
  const tool = getTool("batch-pdf-to-markdown")!;
  return (
    <>
      <ToolJsonLd slug="batch-pdf-to-markdown" description={DESCRIPTION} />
      <div className="mx-auto max-w-5xl px-4 pb-14 pt-8">
        <Breadcrumbs crumbs={toolCrumbs(tool)} />
        <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">
          Batch PDF to Markdown
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
          Drop a whole folder of PDFs and get one ZIP of clean Markdown back — with OCR for scanned pages. Free, and
          not a single file leaves your browser.
        </p>
        <div className="mt-10">
          <BatchPdfTool />
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">When one at a time is too slow</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-brand-700">
          <p>
            Building a knowledge base for a RAG pipeline, moving a reading list into a notes app, or archiving a year
            of reports as text: the job is rarely one PDF. This tool runs the same conversion as the{" "}
            <Link href="/">single-file converter</Link> — headings, lists, tables, multi-column reading order, OCR —
            over every file you drop, and hands you a single ZIP at the end.
          </p>
          <p>
            Because it runs in your browser, a folder of confidential files is as safe as one: nothing is sent
            anywhere. For a pipeline, read <Link href="/blog/pdf-to-markdown-for-rag-pipelines">PDF to Markdown for
            RAG</Link>, then cut the output into chunks with the <Link href="/markdown-chunker">Markdown chunker</Link>.
          </p>
        </div>
      </section>

      <AdSlot placement="tool" />

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-extrabold text-ink">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>Keep the tab open until the list is done: closing it stops the conversion.</li>
          <li>Password-protected PDFs are skipped with an error; unlock them first.</li>
          <li>Very large batches of scanned PDFs can take a long time on a phone — a computer is faster.</li>
        </ul>
      </section>

      <RelatedTools slug="batch-pdf-to-markdown" />
      <ToolGuides slug="batch-pdf-to-markdown" />
    </>
  );
}
