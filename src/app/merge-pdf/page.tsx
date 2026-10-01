import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import MergePdfTool from "@/components/MergePdfTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Merge PDF files into one, in the order you choose. Drag to reorder, no quality loss, no sign-up — and the files never leave your browser.";

export const metadata: Metadata = {
  title: "Merge PDF — Combine PDFs Free, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/merge-pdf" },
  openGraph: {
    title: "Merge PDFs without uploading them",
    description: "Combine PDF files in the order you choose, in your browser.",
    url: "/merge-pdf",
  },
};

const faqItems = [
  {
    question: "How do I change the order?",
    answer:
      "Drag a file up or down the list, or use the arrow buttons next to it — they also work from the keyboard. “Sort by name” orders the list by file name, understanding numbers, so “scan-2” comes before “scan-10”.",
  },
  {
    question: "How many files can I merge?",
    answer:
      "Up to 50 at a time. There is no size limit as such; everything happens in your browser’s memory, so very large sets are limited by your device. To merge more, merge in batches and then merge the results.",
  },
  {
    question: "Will the merged PDF lose quality?",
    answer:
      "No. Pages are copied as they are, without re-rendering or re-compressing, so text stays selectable and images keep their resolution. The merged file is about the size of the originals combined.",
  },
  {
    question: "Are my files uploaded?",
    answer:
      "No. The PDFs are read and combined by code running on your device, and the result is saved directly from your browser. Nothing is sent to a server.",
  },
  {
    question: "Can I merge only some pages of a file?",
    answer:
      "Extract the pages first with Split PDF (“Extract pages”), then merge the result with the other files.",
  },
  {
    question: "One of my files was not added. Why?",
    answer:
      "The tool checks each file’s content rather than its extension. A file that is not really a PDF, is damaged, or needs a password to open is left out, and the list above the files says which one and why.",
  },
];

export default function MergePdfPage() {
  const tool = getTool("merge-pdf")!;
  return (
    <>
      <ToolJsonLd slug="merge-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            Merge{" "}
            PDF
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Combine PDF files into one, in the order you choose. No quality loss, no sign-up, and the files are
            merged in your browser — never uploaded.
          </p>
          <div className="mt-10">
            <MergePdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">Merging without handing over your files</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            The files people merge are rarely public: a signed contract and its annexes, the scans for a visa
            application, a year of payslips for a mortgage broker. Most online mergers upload them to a server to
            do something your browser can do on its own. Here the merge runs on your device — see{" "}
            <Link href="/how-it-works">how it works</Link> for the checks that prove nothing is sent.
          </p>
          <h3>Before you send the result</h3>
          <p>
            A merged PDF carries no title of its own, but the pages you merged still contain everything that was on
            them. If the files came from different sources, it is worth a look with the{" "}
            <Link href="/pdf-metadata">PDF metadata viewer</Link>. Scanned pages are just pictures of text:{" "}
            <Link href="/ocr-pdf">OCR the merged PDF</Link> to make it searchable. And if the result is too large for
            an AI tool, <Link href="/split-pdf-for-ai">Split PDF for AI</Link> cuts it back into parts that fit.
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
        <h2 className="text-xl font-extrabold text-neutral-900">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>Up to 50 files at a time; password-protected PDFs must be unlocked first.</li>
          <li>Bookmarks (outlines) of the source files are not combined into the merged PDF.</li>
          <li>Interactive form fields from different files may not keep working after merging.</li>
          <li>Very large sets are limited by your device&apos;s memory.</li>
        </ul>
      </section>

      <RelatedTools slug="merge-pdf" />
      <ToolGuides slug="merge-pdf" />
    </>
  );
}
