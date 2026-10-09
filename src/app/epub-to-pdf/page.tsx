import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import EpubToPdfTool from "@/components/EpubToPdfTool";
import Faq from "@/components/Faq";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Convert a DRM-free EPUB e-book to a PDF with selectable text, headings, tables and images kept. Free, and the book never leaves your browser.";

export const metadata: Metadata = {
  title: "EPUB to PDF — Free Converter, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/epub-to-pdf" },
  openGraph: {
    title: "EPUB to PDF, without uploading your book",
    description: "A DRM-free e-book as a clean, printable PDF, made in your browser.",
    url: "/epub-to-pdf",
  },
};

const faqItems = [
  {
    question: "Which EPUB files can be converted?",
    answer:
      "Any EPUB 2 or EPUB 3 file without DRM: books from Project Gutenberg, Standard Ebooks, Humble Bundle, most technical publishers, and e-books you exported yourself. Books bought from stores that lock them to their app (Kindle, Kobo, Apple Books, Adobe-protected library loans) are encrypted, and the converter tells you so instead of producing a blank PDF.",
  },
  {
    question: "What is kept from the book?",
    answer:
      "The text in reading order, headings, bold and italic, lists, tables, block quotes, code and the images inside the book. Links to websites stay clickable. Links between chapters and footnote jumps are kept as plain text, because the files they point to do not exist in a PDF.",
  },
  {
    question: "Will the PDF look like the e-book?",
    answer:
      "It looks like a clean document rather than a copy of the publisher's design: A4 pages, one readable typeface, consistent heading sizes. The book's own fonts and CSS are not used. Chapters follow each other separated by a rule, so a short chapter does not waste half a page.",
  },
  {
    question: "Is the text in the PDF selectable?",
    answer:
      "Yes. The PDF is built from real text, not from pictures of pages, so you can search it, copy from it and have it read aloud — and it stays small.",
  },
  {
    question: "Is my book uploaded anywhere?",
    answer:
      "No. The EPUB is unzipped and laid out by JavaScript in this browser tab, and the PDF is saved directly to your device.",
  },
  {
    question: "What about Arabic, Hebrew, Chinese or Japanese books?",
    answer:
      "The PDF engine used here cannot lay out scripts that need shaping or right-to-left text, nor CJK. For those books the converter offers the book as Markdown instead, which Markdown to PDF can print with your browser's own engine — that supports every script, though the images are not carried over.",
  },
];

export default function EpubToPdfPage() {
  const tool = getTool("epub-to-pdf")!;
  return (
    <>
      <ToolJsonLd slug="epub-to-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            EPUB to PDF
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Turn a DRM-free e-book into a PDF you can print, annotate or send to anyone. Headings, tables and images are
            kept, the text stays selectable, and the book never leaves your browser.
          </p>
          <div className="mt-10">
            <EpubToPdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">Why turn an e-book into a PDF</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            EPUB is made for e-readers: the text reflows to fit the screen, and there are no pages to speak of. That is
            exactly what gets in the way when you want to print a chapter, cite a page number in a paper, mark up a
            free textbook on a tablet, or read on a device that only opens PDFs.
          </p>
          <p>
            An EPUB is a ZIP of web pages listed in reading order. This converter follows that order, turns each chapter
            into structured text, pulls the images out of the archive, and lays everything out on A4 pages with real,
            searchable text.
          </p>
          <h3>Then what?</h3>
          <p>
            To ask an AI about the book, <Link href="/split-pdf-for-ai">Split PDF for AI</Link> cuts the PDF into parts
            NotebookLM, ChatGPT or Claude will accept. To go the other way, <Link href="/pdf-to-epub">PDF to EPUB</Link>{" "}
            turns a PDF into a reflowable e-book.
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
          <li>DRM-protected books cannot be opened — by this tool or any honest one.</li>
          <li>The publisher&apos;s fonts, colours and page design are replaced by a clean, uniform layout on A4 pages.</li>
          <li>Links between chapters and footnote jumps become plain text.</li>
          <li>Right-to-left scripts, Indic scripts and CJK need the browser print route described above.</li>
          <li>Fixed-layout EPUBs (comics, picture books) are converted as their text and images, not page by page.</li>
        </ul>
      </section>

      <RelatedTools slug="epub-to-pdf" />
      <ToolGuides slug="epub-to-pdf" />
    </>
  );
}
