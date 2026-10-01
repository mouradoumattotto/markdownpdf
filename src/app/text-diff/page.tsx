import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import TextDiffTool from "@/components/TextDiffTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Compare two texts, PDFs or Word documents and see exactly what changed, word by word. Side-by-side or unified view. Free, and nothing is uploaded.";

export const metadata: Metadata = {
  // DataForSEO 2026-09-26 (US): "compare pdf files" / "compare pdf documents"
  // 2,400/mo each at KD 15, and the SERP is forums and Reddit threads — far easier
  // than generic "diff checker". The PDF angle leads.
  title: "Compare PDF Files & Text — Free Diff Checker",
  description: DESCRIPTION,
  alternates: { canonical: "/text-diff" },
  openGraph: {
    title: "Compare two texts or documents, privately",
    description: "A diff checker for text, PDF and Word files that runs in your browser.",
    url: "/text-diff",
  },
};

const faqItems = [
  {
    question: "Can I compare two PDFs?",
    answer:
      "Yes — by their text. Open a PDF on each side and its text is extracted (with OCR for scanned pages) and compared. This finds changed wording, numbers and dates; it does not compare layout, images or formatting. Word documents and Markdown files work the same way.",
  },
  {
    question: "Can I compare a PDF with a Word document?",
    answer:
      "Yes. Each side reads its own file, so you can open a PDF as the original and a .docx as the changed version (or the other way round). Both are turned into text first, which is what makes the comparison possible; differences in layout between the two formats are not reported.",
  },
  {
    question: "Why are some lines shown as changed rather than removed and added?",
    answer:
      "When a line is edited, it is shown once on each side with only the changed words highlighted, so “30 days” → “45 days” is obvious instead of hidden in two full lines. Lines that are genuinely new or deleted are shown as added or removed.",
  },
  {
    question: "What do “Ignore case” and “Ignore spacing” do?",
    answer:
      "They decide what counts as a difference. Ignore case treats “Total” and “total” as the same; ignore spacing treats runs of spaces and tabs, and spaces at the ends of lines, as equal. The text itself is shown unchanged.",
  },
  {
    question: "Is anything uploaded?",
    answer:
      "No. Both versions stay in your browser — useful when you are comparing drafts of a contract, a policy or anything confidential.",
  },
  {
    question: "What is the .diff download?",
    answer:
      "A unified diff, the standard format used by Git and the diff command. It can be attached to a review, applied as a patch, or opened in any code editor with diff highlighting.",
  },
  {
    question: "Is there a size limit?",
    answer:
      "There is a time limit: if two texts are so long and so different that comparing them would take more than a few seconds, the tool stops and says so rather than freezing the page. Documents of hundreds of pages with ordinary edits compare quickly.",
  },
];

export default function TextDiffPage() {
  const tool = getTool("text-diff")!;
  return (
    <>
      <ToolJsonLd slug="text-diff" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            Compare{" "}
            PDF Files & Text
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Paste two versions — or open two PDFs or Word files — and see exactly what changed, down to the word.
            Nothing is uploaded.
          </p>
          <div className="mt-10">
            <TextDiffTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">Find the change they did not mention</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            A contract comes back “with a few small fixes”. A policy is updated. A colleague sends the “final” version
            of a report. Reading both versions side by side is slow and unreliable; a diff shows every changed word
            in seconds, including the ones nobody pointed out.
          </p>
          <p>
            Comparing PDFs works on their text, so the result is only as good as the extraction: for scanned
            documents, the OCR reading is what gets compared — see{" "}
            <Link href="/blog/ocr-vs-text-extraction">OCR vs text extraction</Link>. To keep a document&apos;s text
            for later comparison, save it with <Link href="/pdf-to-text">PDF to Text</Link> or{" "}
            <Link href="/docx-to-markdown">Word to Markdown</Link>.
          </p>

          <h3>How to compare two PDF files</h3>
          <ol>
            <li>
              In the <strong>Original</strong> box, click &ldquo;Open a file&rdquo; (or drop the file on the box) and
              choose the earlier version. Its text is extracted in your browser; scanned pages go through OCR.
            </li>
            <li>Do the same with the newer version in the <strong>Changed</strong> box.</li>
            <li>
              The comparison runs by itself. The summary counts added, removed and changed lines; inside a changed
              line, only the words that differ are highlighted.
            </li>
            <li>
              Switch between <strong>Side by side</strong> and <strong>Unified</strong>, tick &ldquo;Ignore
              case&rdquo; or &ldquo;Ignore spacing&rdquo; if those differences do not matter to you, and download the
              result as a <code>.diff</code> file to keep a record.
            </li>
          </ol>
          <p>
            The two sides do not have to be the same kind of file: a PDF can be compared with a Word document, or
            with text pasted from an email.
          </p>

          <h3>What the comparison finds — and what it does not</h3>
          <p>
            It finds every difference in the <em>words</em>: a changed number, a new clause, a deleted sentence, a date
            moved by a week. It does not compare how the pages look — fonts, colours, images, margins and page
            breaks are ignored, so a PDF that was only re-laid-out compares as identical. PDFs and Word files are
            read as Markdown-style text, so a heading shows up with its <code>#</code> marker. A paragraph moved to
            another page appears as removed in one place and added in the other.
          </p>

          <h3>When it is worth checking</h3>
          <ul>
            <li>
              <strong>Contracts and agreements.</strong> Compare the version you approved with the one sent for
              signature, before you sign it.
            </li>
            <li>
              <strong>Successive versions of a document.</strong> Policies, specifications, terms of service,
              manuscripts: see what changed between v3 and v4 without relying on a change log someone else wrote.
            </li>
            <li>
              <strong>Word vs the exported PDF.</strong> Check that the PDF you are about to publish says the same
              thing as the Word draft that was last reviewed.
            </li>
            <li>
              <strong>AI rewrites.</strong> Paste your text and the version an assistant returned to see every word
              it changed, not just the ones it mentioned.
            </li>
          </ul>
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
          <li>PDFs and Word files are compared by their text only — not layout, images or formatting.</li>
          <li>Text that moved to another place shows as removed in one place and added in the other.</li>
          <li>Very long, very different texts may exceed the few-second comparison limit.</li>
        </ul>
      </section>

      <RelatedTools slug="text-diff" />
      <ToolGuides slug="text-diff" />
    </>
  );
}
