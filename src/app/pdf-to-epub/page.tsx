import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import PdfToEpubTool from "@/components/PdfToEpubTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Turn a PDF into a reflowable EPUB with chapters and a table of contents, for Kobo, Apple Books or Kindle. OCR for scans. Free, in your browser.";

export const metadata: Metadata = {
  title: "PDF to EPUB — Free E-book Converter, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/pdf-to-epub" },
  openGraph: {
    title: "PDF to EPUB, without uploading your file",
    description: "A reflowable e-book with chapters, made from a PDF in your browser.",
    url: "/pdf-to-epub",
  },
};

const faqItems = [
  {
    question: "What does the EPUB contain?",
    answer:
      "The text of the PDF, rebuilt as headings, paragraphs, lists and tables that reflow to any screen size, plus a table of contents. It is an EPUB 3 file that also carries an EPUB 2 table of contents, so older readers can navigate it too.",
  },
  {
    question: "How are chapters made?",
    answer:
      "From the headings the converter recognises in the PDF. If there are two or more top-level headings, each one starts a chapter; otherwise the second level is used; a document without headings becomes a single chapter. The chapter names appear in your reader's table of contents.",
  },
  {
    question: "Does it work on scanned PDFs?",
    answer:
      "Yes. Pages without a text layer are read with OCR in the language you pick — English, French, Spanish, German, Portuguese, Italian or Arabic. That language is also written into the e-book, so your reader uses the right hyphenation and voice.",
  },
  {
    question: "Are images included?",
    answer:
      "No — the EPUB is text only. Charts, photos and figures from the PDF are left out, which keeps the file small and readable on e-ink screens. If the pictures matter, keep the PDF alongside, or convert it with PDF to Markdown and its image option.",
  },
  {
    question: "Can I read it on a Kindle?",
    answer:
      "Yes. Amazon's Send to Kindle accepts EPUB files and converts them for your device. Kobo, Apple Books, Google Play Books, PocketBook and Calibre open the EPUB directly.",
  },
  {
    question: "Is my PDF uploaded?",
    answer:
      "No. The text is extracted, recognised and packed into the EPUB in this browser tab, and the e-book is saved straight to your device.",
  },
];

export default function PdfToEpubPage() {
  const tool = getTool("pdf-to-epub")!;
  return (
    <>
      <ToolJsonLd slug="pdf-to-epub" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            PDF to EPUB
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Make an e-book from a PDF: text that reflows to your reader&apos;s screen, chapters from the document&apos;s
            headings, and a table of contents. Scanned pages are read with OCR, and nothing is uploaded.
          </p>
          <div className="mt-10">
            <PdfToEpubTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">A PDF you can actually read on an e-reader</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            A PDF page has a fixed size. On a six-inch e-ink screen that means zooming and panning across every line, or
            text too small to read. An EPUB has no pages: the reader lays the text out for its own screen, in the font
            size you choose.
          </p>
          <p>
            To get there, the converter does what <Link href="/">PDF to Markdown</Link> does — rebuild headings,
            paragraphs, lists and tables from the PDF, columns in the right order, hyphenated words joined — then splits
            the result into chapters and packs it as an e-book.
          </p>
          <h3>Works best with</h3>
          <p>
            Reports, papers, manuals, long articles and books that are mostly text. Documents built around their layout —
            slide decks, forms, magazines, comics — are better kept as PDF, or turned into images with{" "}
            <Link href="/pdf-to-jpg">PDF to JPG</Link>. Going the other way? <Link href="/epub-to-pdf">EPUB to PDF</Link>{" "}
            makes a printable PDF from an e-book.
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
          <li>The EPUB contains text only: images and figures from the PDF are not included.</li>
          <li>Chapters depend on headings the converter can recognise; a PDF without visible headings becomes one chapter.</li>
          <li>Footnotes, page numbers and running headers may appear inside the text where the PDF had them.</li>
          <li>Password-protected PDFs need to be unlocked first.</li>
          <li>OCR is slower than reading a text layer: allow a few seconds per scanned page.</li>
        </ul>
      </section>

      <RelatedTools slug="pdf-to-epub" />
      <ToolGuides slug="pdf-to-epub" />
    </>
  );
}
