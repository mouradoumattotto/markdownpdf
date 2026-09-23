import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import SplitPdfTool from "@/components/SplitPdfTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Split a PDF by page ranges, every N pages or into single pages, or extract the pages you need into a new PDF. Free, no upload — it runs in your browser.";

export const metadata: Metadata = {
  title: "Split PDF — Free, No Upload, No Sign-Up",
  description: DESCRIPTION,
  alternates: { canonical: "/split-pdf" },
  openGraph: {
    title: "Split a PDF without uploading it",
    description: "Page ranges, every N pages, or extract pages — processed in your browser.",
    url: "/split-pdf",
  },
};

const faqItems = [
  {
    question: "How do I write page ranges?",
    answer:
      "Page numbers and ranges separated by commas: “1-3, 5, 8-12”. A range with no end runs to the last page, so “13-” means page 13 to the end. In “Split by ranges” each range becomes its own PDF; in “Extract pages” they all go into one PDF, in the order you typed them — so “5, 1-4” also moves page 5 to the front.",
  },
  {
    question: "Does splitting reduce quality?",
    answer:
      "No. Pages are copied as they are — the same text, fonts and images, byte for byte. Nothing is re-rendered or re-compressed, so text stays selectable and searchable in every part.",
  },
  {
    question: "Is there a size or page limit?",
    answer:
      "No fixed limit. Everything happens in your browser’s memory, so the practical ceiling is your device: documents of several hundred pages and a few hundred MB split fine on a typical laptop; a phone manages less.",
  },
  {
    question: "Is my PDF uploaded?",
    answer:
      "No. The file is read and split by code running on your device, and the parts are saved straight from your browser. That makes it safe for contracts, bank statements and medical records.",
  },
  {
    question: "What about password-protected PDFs?",
    answer:
      "A PDF that needs a password to open cannot be split here. Open it with its password in your PDF reader, save or print an unprotected copy, then drop that copy.",
  },
  {
    question: "I need to split for ChatGPT, Claude or NotebookLM.",
    answer:
      "Use Split PDF for AI instead: it knows each tool’s upload limits and splits at chapter boundaries so each part stays coherent.",
  },
];

export default function SplitPdfPage() {
  const tool = getTool("split-pdf")!;
  return (
    <>
      <ToolJsonLd slug="split-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Split{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">PDF</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Split by page ranges, every N pages or into single pages — or pull out just the pages you need. Free, and
            the PDF is split in your browser, never uploaded.
          </p>
          <div className="mt-10">
            <SplitPdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Four ways to split</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <ul>
            <li>
              <strong>By ranges</strong> — “1-10, 11-25, 26-” gives three PDFs. Good for separating the chapters of a
              report or the documents in a scanned batch.
            </li>
            <li>
              <strong>Extract pages</strong> — the pages you list, in one new PDF. Good for sending only the signed
              page, or the three pages of a contract that matter.
            </li>
            <li>
              <strong>Every N pages</strong> — equal parts, for printing in batches or staying under an email
              attachment limit.
            </li>
            <li>
              <strong>Every page</strong> — one PDF per page, for example to file invoices that were scanned together.
            </li>
          </ul>
          <p>
            Several parts download together as a ZIP. To go the other way, <Link href="/merge-pdf">Merge PDF</Link>{" "}
            combines files in the order you choose. Before sharing a part, check what it says about you with the{" "}
            <Link href="/pdf-metadata">PDF metadata viewer</Link> — split parts keep the original document&apos;s
            title.
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
          <li>Password-protected PDFs must be unlocked first.</li>
          <li>Bookmarks (the outline) are not carried into the parts; web links keep working, links to pages left out of a part do not.</li>
          <li>Interactive form fields may lose their behaviour in a part; their printed appearance is kept.</li>
          <li>Very large files are limited by your device&apos;s memory.</li>
        </ul>
      </section>

      <RelatedTools slug="split-pdf" />
      <ToolGuides slug="split-pdf" />
    </>
  );
}
