import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import DocxToMarkdownTool from "@/components/DocxToMarkdownTool";
import Faq from "@/components/Faq";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Convert Word .docx files to clean Markdown: headings, lists, tables, links and images. Free, instant, and the document never leaves your browser.";

export const metadata: Metadata = {
  title: "Word to Markdown Converter — DOCX to MD, Free",
  description: DESCRIPTION,
  alternates: { canonical: "/docx-to-markdown" },
  openGraph: {
    title: "Word to Markdown, without uploading the document",
    description: "Headings, lists, tables and images from a .docx, converted in your browser.",
    url: "/docx-to-markdown",
  },
};

const faqItems = [
  {
    question: "What survives the conversion?",
    answer:
      "Headings (when the document uses Word's Heading styles), bold, italic, strikethrough, links, bulleted and numbered lists, tables, footnotes and images. Fonts, colours, page layout, headers and footers are dropped — Markdown has no way to express them, and that is usually the point of converting.",
  },
  {
    question: "My headings came out as bold text. Why?",
    answer:
      "Because in the Word file they are bold text: someone made them bigger and bolder by hand instead of applying the Heading 1 / Heading 2 styles. The converter reads structure, not appearance. Apply the heading styles in Word (or Google Docs), save, and convert again.",
  },
  {
    question: "Does it work with old .doc files?",
    answer:
      "No — only .docx, the format Word has used since 2007. Open a .doc in Word, LibreOffice or Google Docs and save it as .docx first. The tool recognises a .doc and tells you so rather than failing silently.",
  },
  {
    question: "What happens to images?",
    answer:
      "You choose. Leave them out for text-only uses such as ChatGPT or a wiki; save them to a folder, which downloads a ZIP with the .md file and an images/ folder referenced by relative links; or embed them in the Markdown itself as data URIs — one self-contained file, but a much larger one.",
  },
  {
    question: "Is the document uploaded?",
    answer:
      "No. The .docx is unzipped and converted by code running in your browser. Nothing is sent to a server, which matters for contracts, HR documents and anything under NDA.",
  },
  {
    question: "What about Google Docs?",
    answer:
      "Either download it as .docx (File → Download → Microsoft Word) and drop it here, or select the content in Google Docs, copy it, and paste it into the HTML to Markdown converter, which reads the formatting from the clipboard.",
  },
];

export default function DocxToMarkdownPage() {
  const tool = getTool("docx-to-markdown")!;
  return (
    <>
      <ToolJsonLd slug="docx-to-markdown" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            Word to{" "}
            Markdown Converter
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Drop a .docx and get clean Markdown — headings, lists, tables, links and, if you want them, images.
            Free, and the document is converted in your browser, never uploaded.
          </p>
          <div className="mt-10">
            <DocxToMarkdownTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">Why convert Word documents to Markdown?</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            A .docx is a ZIP of XML files full of styling that only Word understands. Markdown is plain text with
            just enough structure: it goes into Git and shows a readable diff, publishes to static-site generators
            and wikis, and it is the format language models read best — see{" "}
            <Link href="/blog/why-llms-prefer-markdown">why LLMs prefer Markdown</Link>. Converting a handbook, a
            spec or a set of meeting notes once gives you a version you can edit anywhere.
          </p>
          <h3>How to convert a Word document to Markdown</h3>
          <ol>
            <li>
              Drop a <code>.docx</code> file on the converter above, or click to choose one. Google Docs users can
              download their document with File → Download → Microsoft Word first.
            </li>
            <li>
              Choose what happens to images: leave them out, save them to an <code>images/</code> folder next to
              the Markdown (downloaded together as a ZIP), or embed them in the file itself.
            </li>
            <li>
              Read the Markdown in the preview, then copy it or download the <code>.md</code> file — ready for
              GitHub, Obsidian, a static-site generator or a prompt.
            </li>
          </ol>
          <h3>What converts, and how</h3>
          <ul>
            <li>Heading 1 to Heading 6 styles → <code>#</code> to <code>######</code> headings.</li>
            <li>Bulleted and numbered lists → Markdown lists, nesting included.</li>
            <li>Tables → GitHub-flavored pipe tables, with the first row as the header.</li>
            <li>Bold, italic and strikethrough → <code>**bold**</code>, <code>*italic*</code> and{" "}
              <code>~~strikethrough~~</code>.</li>
            <li>Hyperlinks → <code>[text](url)</code>; footnotes → a numbered list at the end, linked from the text.</li>
          </ul>
          <h3>Getting a clean result</h3>
          <p>
            The converter follows the document&apos;s structure, so the better the Word file uses styles, the
            better the Markdown. Real Heading styles become <code>#</code> headings; real lists become Markdown
            lists; a Word table becomes a Markdown table whose first row is used as the header. Merged cells and
            tables nested inside tables have no Markdown equivalent, so those tables need a look after conversion.
          </p>
          <h3>Word to Markdown with pandoc</h3>
          <p>
            On the command line, <code>pandoc input.docx -t gfm -o output.md</code> does the same job and is the
            better choice for converting a whole folder in a script; add{" "}
            <code>--extract-media=images</code> to save the pictures. For one document at a time, the converter on
            this page needs no install, and like pandoc it keeps the file on your machine — unlike most online Word
            to Markdown converters, which upload it to a server.
          </p>
          <h3>From Markdown back out</h3>
          <p>
            Once the content is in Markdown, you can turn it into a <Link href="/md-to-pdf">PDF</Link> or a{" "}
            <Link href="/markdown-to-html">web page</Link>. For PDFs you received rather than wrote, go the other
            way with <Link href="/">PDF to Markdown</Link>. The trade-offs between the three formats are in{" "}
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
        <h2 className="text-xl font-extrabold text-neutral-900">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>.docx only; legacy .doc, .odt, .rtf and .pages files must be saved as .docx first.</li>
          <li>Headings are detected from Word&apos;s heading styles, not from font size.</li>
          <li>Merged table cells, text boxes, comments, tracked changes and equations are not converted.</li>
          <li>Password-protected documents cannot be opened.</li>
        </ul>
      </section>

      <RelatedTools slug="docx-to-markdown" />
      <ToolGuides slug="docx-to-markdown" />
    </>
  );
}
