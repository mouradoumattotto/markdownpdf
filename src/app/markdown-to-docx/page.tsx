import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import MarkdownToDocxTool from "@/components/MarkdownToDocxTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Convert Markdown to a Word .docx with real heading styles, numbered lists, tables and links. Free, and your text never leaves the browser.";

export const metadata: Metadata = {
  // DataForSEO 2026-09-26 (US): "markdown to word" 1,900/mo (KD 13), "markdown to
  // word converter" 880 (KD 7), "markdown to docx" 590 (KD 5).
  title: "Markdown to Word Converter — MD to DOCX, Free",
  description: DESCRIPTION,
  alternates: { canonical: "/markdown-to-docx" },
  openGraph: {
    title: "Markdown to Word, without uploading",
    description: "A real .docx with heading styles, lists and tables, created in your browser.",
    url: "/markdown-to-docx",
  },
};

const faqItems = [
  {
    question: "Is the result a “real” Word document?",
    answer:
      "Yes. # headings become Word’s Heading 1–6 styles, so the navigation pane and an automatic table of contents work; lists use Word’s own numbering; tables are Word tables whose header row repeats on each page. Change the styles in Word and the whole document follows.",
  },
  {
    question: "What does not carry over?",
    answer:
      "Mermaid diagrams and LaTeX math are kept as their source text, because Word cannot draw them from Markdown — use Markdown to PDF when you need them rendered. Images given as a web address or a file path are not embedded (the browser cannot fetch them into the document); their description is kept and the tool tells you. Raw HTML is reduced to its text.",
  },
  {
    question: "Can I include images?",
    answer:
      "Images written into the Markdown as data URIs (data:image/png;base64,…) are embedded. For images from the web or your disk, the simplest route is to insert them in Word after converting.",
  },
  {
    question: "Does it work with Google Docs?",
    answer:
      "Yes: upload the .docx to Google Drive and open it with Google Docs. It also opens in LibreOffice Writer and Apple Pages.",
  },
  {
    question: "How do I paste a ChatGPT or Claude answer into Word with its formatting?",
    answer:
      "Copy the answer with the copy button under the reply, which gives the Markdown source rather than the rendered text, paste it into the editor above and download the .docx. Headings, bold text, lists, tables and code blocks arrive as Word formatting instead of pound signs and asterisks.",
  },
  {
    question: "How do I convert Markdown to Word with pandoc?",
    answer:
      "Install pandoc and run pandoc input.md -o output.docx. Pandoc is the right choice for batches, citations or a custom reference template (--reference-doc=template.docx). For a single document, this page gives a comparable result without installing anything.",
  },
  {
    question: "Is my text uploaded?",
    answer: "No. The .docx is assembled in your browser and saved directly to your device.",
  },
];

export default function MarkdownToDocxPage() {
  const tool = getTool("markdown-to-docx")!;
  return (
    <>
      <ToolJsonLd slug="markdown-to-docx" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Markdown to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Word Converter
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Paste Markdown or drop a .md file and download a Word document with real heading styles, numbered lists
            and tables. Free, and nothing is uploaded.
          </p>
          <div className="mt-10">
            <MarkdownToDocxTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Write in Markdown, deliver in Word</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Markdown is faster to write and easier to keep in version control; many colleagues, clients and
            reviewers still expect a .docx they can comment on with tracked changes. Converting at the end gives
            both: you keep writing in plain text, they receive a normal Word file.
          </p>
          <p>
            It is also the quickest way to turn an AI answer into a document. ChatGPT, Claude and Gemini answer in
            Markdown; paste the answer here and the headings, lists and tables arrive in Word as headings, lists and
            tables, rather than as asterisks and pound signs.
          </p>
          <h3>How to convert Markdown to Word</h3>
          <ol>
            <li>
              Paste your Markdown into the editor at the top of this page, or drop a <code>.md</code> or{" "}
              <code>.txt</code> file on it.
            </li>
            <li>
              Click <strong>Download .docx</strong>. The Word document is built in your browser and saved straight
              to your device.
            </li>
            <li>
              Open it in Microsoft Word, Google Docs, LibreOffice Writer or Pages, and restyle it if you like:
              because headings use Word&apos;s own Heading styles, changing a style updates every heading at once.
            </li>
          </ol>
          <h3>What each Markdown element becomes in Word</h3>
          <ul>
            <li>
              <code>#</code> to <code>######</code> headings → Heading 1 to Heading 6, so the navigation pane and an
              automatic table of contents work.
            </li>
            <li>Bulleted and numbered lists, including nested ones → Word lists with real numbering.</li>
            <li>Task list items → ☐ and ☑ checkboxes at the start of the line.</li>
            <li>Pipe tables → Word tables, with the header row repeated on every page.</li>
            <li>Links → clickable hyperlinks; inline code and code blocks → a monospaced font on a grey background.</li>
            <li>Bold, italic, strikethrough and blockquotes keep their meaning.</li>
          </ul>
          <h3>Other ways to convert Markdown to a Word document</h3>
          <p>
            <strong>Pandoc</strong> is the classic command-line converter: <code>pandoc input.md -o output.docx</code>.
            It handles citations and custom templates, and is the better choice for converting hundreds of files in
            a script — at the cost of an install and a terminal. Pasting Markdown straight into{" "}
            <strong>Word</strong> usually keeps it as plain text, asterisks and pound signs included. <strong>Online
            converters</strong> usually upload your file to their server; this one does not, which matters for
            drafts, contracts and anything confidential.
          </p>
          <h3>Other directions</h3>
          <p>
            Need to go back? <Link href="/docx-to-markdown">Word to Markdown</Link> converts a .docx into Markdown.
            For a document that must look the same everywhere, <Link href="/md-to-pdf">Markdown to PDF</Link>{" "}
            renders diagrams and math as well. The trade-offs between the formats are in{" "}
            <Link href="/blog/pdf-vs-word-vs-markdown">PDF vs Word vs Markdown</Link>.
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
          <li>Mermaid diagrams and LaTeX math stay as source text.</li>
          <li>Only images embedded as data URIs are included; linked images keep their description.</li>
          <li>Raw HTML is reduced to its text; footnotes are not converted.</li>
          <li>Styling is Word’s defaults (Calibri); restyle in Word as you would any document.</li>
        </ul>
      </section>

      <RelatedTools slug="markdown-to-docx" />
      <ToolGuides slug="markdown-to-docx" />
    </>
  );
}
