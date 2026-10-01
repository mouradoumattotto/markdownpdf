import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import PdfTablesTool from "@/components/PdfTablesTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Extract every table from a PDF to CSV, free and in your browser. Preview each table, download one CSV per table or all of them as a ZIP. Nothing is uploaded.";

export const metadata: Metadata = {
  title: "PDF Table to CSV Converter — Free, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/pdf-tables-to-csv" },
  openGraph: {
    title: "PDF tables to CSV — every table, spreadsheet-ready",
    description: "Find the tables in a PDF and download them as CSV files. Runs in your browser.",
    url: "/pdf-tables-to-csv",
  },
};

const faqItems = [
  {
    question: "How do I extract a table from a PDF to CSV?",
    answer:
      "Drop the PDF above. Every page with a text layer is scanned for rows and columns; each table found is shown with its page number, and you can download it as a CSV — or all of them at once as a ZIP. The CSV opens in Excel, Google Sheets, Numbers or any script.",
  },
  {
    question: "How are tables detected without ruling lines?",
    answer:
      "From the position of the text itself. A table shows up as consecutive lines that break into several short cells separated by wide gaps, with the cells of every row lining up under the same columns. Borders are not needed, so tables drawn with whitespace alone are found too.",
  },
  {
    question: "Why was my table not found?",
    answer:
      "Three usual reasons: the table is a picture (a scanned page, or a chart pasted as an image), its cells contain full sentences so it reads as prose, or it has only one data row. For a scan, make the PDF searchable with “OCR a PDF” first, then try again.",
  },
  {
    question: "Will Excel open the accents correctly?",
    answer:
      "Yes. The CSV is UTF-8 with a byte-order mark, which is what Excel needs to show accented and non-Latin characters properly. Fields that contain commas, quotes or line breaks are quoted per RFC 4180.",
  },
  {
    question: "Are my files uploaded?",
    answer: "No. The PDF is read by your browser, on your device. There is no server-side step, which is also why there is no size limit.",
  },
];

export default function PdfTablesToCsvPage() {
  const tool = getTool("pdf-tables-to-csv")!;
  return (
    <>
      <ToolJsonLd slug="pdf-tables-to-csv" description={DESCRIPTION} />
      <div className="mx-auto max-w-5xl px-4 pb-14 pt-8">
        <Breadcrumbs crumbs={toolCrumbs(tool)} />
        <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">
          PDF Tables to CSV
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
          Every table in your PDF, spreadsheet-ready. Preview what was found, then download one CSV per table — free,
          and the file never leaves your browser.
        </p>
        <div className="mt-10">
          <PdfTablesTool />
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">Copy-pasting a PDF table never works</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-brand-700">
          <p>
            Select a table in a PDF viewer and paste it into a spreadsheet, and you get one long column — or every
            row glued into a single cell. A PDF does not store a table: it stores pieces of text drawn at
            coordinates. The grid only exists in your eyes.
          </p>
          <p>
            This tool rebuilds the grid from those coordinates. It groups text into lines, splits each line wherever
            the gap between two pieces of text is wider than a couple of spaces, and keeps the run of lines whose
            cells line up under the same columns. Right-aligned numbers, empty cells and rows with a missing value are
            handled. Two-column page layouts are not mistaken for tables: their “cells” are sentences.
          </p>
          <p>
            Want the table inside a document instead? The <Link href="/">PDF to Markdown converter</Link> uses the
            same detection and writes each table as a Markdown table, in place. You can try it on a real report in
            the <Link href="/examples">examples</Link> — the U.S. Census income table is a good test.
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
          <li>Scanned pages are skipped: tables are read from the text layer only.</li>
          <li>Column headers written on two lines come out as two rows; merge them in the spreadsheet.</li>
          <li>Merged cells spanning several columns land in the first of them.</li>
          <li>A table that continues on the next page is exported as two tables, one per page.</li>
        </ul>
      </section>

      <RelatedTools slug="pdf-tables-to-csv" />
      <ToolGuides slug="pdf-tables-to-csv" />
    </>
  );
}
