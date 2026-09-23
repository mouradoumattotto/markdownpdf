import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import MarkdownTableTool from "@/components/MarkdownTableTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Create Markdown tables in a spreadsheet-like grid, or convert CSV and cells pasted from Excel or Google Sheets. Column alignment, escaping, free.";

export const metadata: Metadata = {
  title: "Markdown Table Generator — CSV & Excel",
  description: DESCRIPTION,
  alternates: { canonical: "/markdown-table-generator" },
  openGraph: {
    title: "Markdown table generator",
    description: "Edit in a grid, or paste CSV and spreadsheet cells — get a clean GitHub-flavored table.",
    url: "/markdown-table-generator",
  },
};

const faqItems = [
  {
    question: "How do I convert an Excel or Google Sheets range?",
    answer:
      "Select the cells in the spreadsheet, copy, then either paste into the import box and press Import, or click a cell in the grid and paste: the block fills the grid from that cell, adding rows and columns as needed. The first row becomes the header.",
  },
  {
    question: "Which CSV formats are supported?",
    answer:
      "Comma, semicolon (what Excel writes in many European locales) and tab separators, detected automatically. Quoted fields may contain separators, quotes (doubled, as the CSV standard says) and line breaks.",
  },
  {
    question: "How is column alignment written?",
    answer:
      "With colons in the separator row: :--- for left, :---: for centre, ---: for right. Choose it per column from the menu above each column. Without colons, renderers use their default, usually left.",
  },
  {
    question: "What happens to | characters and line breaks inside cells?",
    answer:
      "A pipe would end the cell, so it is written as \\|. A Markdown table row must stay on one line, so line breaks become <br>, which GitHub, GitLab and most renderers display as a line break.",
  },
  {
    question: "Can I edit an existing Markdown table?",
    answer:
      "Yes: paste it into the import box. The alignment of each column is read from its separator row, and escaped pipes and <br> are turned back into what they stand for.",
  },
  {
    question: "Why align the columns in the source?",
    answer:
      "It changes nothing in the rendered table; it makes the raw Markdown readable in an editor and in code review. Turn it off for the most compact output.",
  },
];

export default function MarkdownTableGeneratorPage() {
  const tool = getTool("markdown-table-generator")!;
  return (
    <>
      <ToolJsonLd slug="markdown-table-generator" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Markdown{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Table Generator
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Type into the grid, or paste cells from Excel, Google Sheets or a CSV file, and copy a clean
            GitHub-flavored Markdown table.
          </p>
          <div className="mt-10">
            <MarkdownTableTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Markdown tables without counting pipes</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Markdown tables are simple once written and tedious to write: every row needs the same number of pipes,
            the separator row needs a dash per column, and one stray <code>|</code> in a cell breaks the row. The
            grid takes care of all of it, and escapes what needs escaping.
          </p>
          <pre>
            <code>{`| Item   | Qty |
| :----- | --: |
| Apples |   3 |`}</code>
          </pre>
          <p>
            Tables made here work on GitHub, GitLab, Obsidian, Notion, Docusaurus and anything else that follows
            GitHub-flavored Markdown. To see one rendered, paste it into{" "}
            <Link href="/markdown-to-html">Markdown to HTML</Link>; to put it in a document, use{" "}
            <Link href="/markdown-to-pdf">Markdown to PDF</Link> or <Link href="/markdown-to-docx">Markdown to Word</Link>.
            Tables trapped in a PDF? <Link href="/">PDF to Markdown</Link> extracts them — see{" "}
            <Link href="/blog/extract-tables-from-pdf-to-markdown">extracting tables from PDFs</Link>.
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
          <li>Markdown tables cannot merge cells or hold lists and paragraphs inside a cell.</li>
          <li>Formatting in pasted spreadsheet cells (bold, colours) is not imported — only the values.</li>
          <li>Up to 20,000 cells; larger data belongs in a CSV file rather than a Markdown table.</li>
        </ul>
      </section>

      <RelatedTools slug="markdown-table-generator" />
      <ToolGuides slug="markdown-table-generator" />
    </>
  );
}
