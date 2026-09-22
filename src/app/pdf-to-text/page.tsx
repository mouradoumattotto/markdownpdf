import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import PdfExtractTool from "@/components/PdfExtractTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { OCR_LANGUAGES } from "@/lib/ocr";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Extract the text from any PDF, free and in your browser, with automatic OCR for scanned pages in 7 languages. No upload, no sign-up, no page limit.";

export const metadata: Metadata = {
  title: "PDF to Text Converter (with OCR)",
  description: DESCRIPTION,
  alternates: { canonical: "/pdf-to-text" },
  openGraph: {
    title: "PDF to Text — free, with OCR, nothing uploaded",
    description: "Extract plain text from a PDF in your browser, including scanned pages, in seven languages.",
    url: "/pdf-to-text",
  },
};

const faqItems = [
  {
    question: "How do I extract text from a PDF?",
    answer:
      "Drop the PDF into the converter above. The text layer is read page by page, pages without one are recognised with OCR, and the result appears in an editable box you can copy or download as a .txt file. Nothing is uploaded.",
  },
  {
    question: "Does it work on scanned PDFs?",
    answer: `Yes. A page with no text layer is detected and run through OCR automatically. Pick the language of your scans under the drop zone: ${OCR_LANGUAGES.map((l) => l.label).join(", ")}.`,
  },
  {
    question: "Text or Markdown — which should I choose?",
    answer:
      "Plain text is right when you want the words and nothing else: pasting into a form, a script, a subtitle file. Markdown is better when the structure matters — headings, lists and emphasis are kept, which is what makes a document searchable, editable and readable by an AI tool.",
  },
  {
    question: "Is there a page or size limit?",
    answer:
      "No server limit, because there is no server: the work happens on your device. A 300-page document converts in seconds; scanned pages take a few seconds each. Long jobs show progress, an estimated time, and a Cancel button.",
  },
  {
    question: "Why is the layout of my columns mixed up?",
    answer:
      "Text is extracted in the order the PDF stores it, which for multi-column layouts is not always the reading order. Academic papers and newspapers are the usual offenders. The text is all there; the sequence may need a pass.",
  },
];

export default function PdfToTextPage() {
  const tool = getTool("pdf-to-text")!;
  return (
    <>
      <ToolJsonLd slug="pdf-to-text" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            PDF to Text{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Converter
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Get the plain text out of any PDF — including scanned ones, thanks to built-in OCR in seven languages.
            Free, no sign-up, and your file never leaves your browser.
          </p>
          <div className="mt-10">
            <PdfExtractTool mode="text" />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Plain text, or something better?</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Plain text is the lowest common denominator, and sometimes exactly right: you want the words to paste
            into a form, feed to a script, or search with <code>grep</code>. This tool keeps paragraphs together,
            joins lines that the layout had wrapped, de-hyphenates words split across lines, and leaves headings and
            list items on their own lines so the result stays scannable.
          </p>
          <p>
            What plain text cannot keep is <em>structure</em>. A heading becomes an ordinary line; a list loses its
            markers; emphasis disappears. If the document is going into notes, documentation, a wiki or an AI tool,
            that structure is what makes it usable — which is what the{" "}
            <Link href="/">PDF to Markdown converter</Link> preserves, using the same extraction and the same OCR.
          </p>
          <h3>Scanned pages</h3>
          <p>
            A scanned PDF has no text to extract: each page is an image. The converter detects those pages and runs
            OCR on them automatically, so a mixed document — a few typed pages, a few scanned — comes out whole. If
            the results disappoint, the scan is usually the cause rather than the engine; the{" "}
            <Link href="/blog/extract-text-from-scanned-pdf">scanned PDF guide</Link> explains what to fix and in
            what order.
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
          <li>Multi-column layouts can come out in the wrong reading order.</li>
          <li>Tables lose their grid: cells arrive as text in the order the PDF stores them.</li>
          <li>Images are not extracted, and text drawn inside a figure is only recovered by OCR on a scanned page.</li>
          <li>Encrypted PDFs must be unlocked and saved again before conversion.</li>
        </ul>
      </section>

      <RelatedTools slug="pdf-to-text" />
      <ToolGuides slug="pdf-to-text" />
    </>
  );
}
