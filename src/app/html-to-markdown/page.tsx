import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import HtmlToMarkdownTool from "@/components/HtmlToMarkdownTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Convert HTML to clean Markdown — paste code, a web page, or formatted text from Word or Google Docs. Tables, code blocks and links kept. Free, in your browser.";

export const metadata: Metadata = {
  title: "HTML to Markdown Converter — Paste Any Page",
  description: DESCRIPTION,
  alternates: { canonical: "/html-to-markdown" },
  openGraph: {
    title: "HTML to Markdown, live, in your browser",
    description: "Paste HTML, a web page or a Google Doc and get GitHub-flavored Markdown.",
    url: "/html-to-markdown",
  },
};

const faqItems = [
  {
    question: "Can I paste formatted text instead of HTML code?",
    answer:
      "Yes, and it is often the quickest route. Select content in a browser, Google Docs, Word or Notion, copy it, and paste it into the box: the formatted version travels through the clipboard as HTML, so headings, links, lists and tables are converted. Pasting HTML source code works too.",
  },
  {
    question: "What does “Main content only” do?",
    answer:
      "It removes scripts, navigation menus, sidebars, forms and the page’s own header and footer, and keeps the <main> or <article> element when there is one. For a full saved web page this is the difference between an article and a wall of menu links. Turn it off to convert everything.",
  },
  {
    question: "Which Markdown flavour does it produce?",
    answer:
      "GitHub-flavored Markdown: # headings, - bullets, **bold**, *italic*, ~~strikethrough~~, pipe tables, task lists, and fenced code blocks that keep their language when the HTML marks it (class=\"language-js\"). That output works on GitHub, GitLab, Obsidian, Notion imports and static-site generators.",
  },
  {
    question: "Why did my table come out as plain lines?",
    answer:
      "Markdown tables are simple grids. A table whose cells contain lists, several paragraphs or other tables, or that uses merged cells, cannot be written as a pipe table. Simple data tables convert cleanly, and a table without a header row gets its first row promoted.",
  },
  {
    question: "How do I convert HTML to Markdown in Python?",
    answer:
      "The markdownify package is the common choice: pip install markdownify, then markdownify.markdownify(html, heading_style=\"ATX\") for # headings. html2text is an older alternative, and pandoc -f html -t gfm works from the command line. Strip navigation and scripts first, or they end up in the Markdown too.",
  },
  {
    question: "Is the HTML sent anywhere?",
    answer:
      "No. It is parsed as an inert document in your browser — scripts in it do not run and images in it are not loaded — and converted on the spot. Nothing is uploaded, and the page never fetches the URLs in the HTML.",
  },
  {
    question: "Can I convert a URL directly?",
    answer:
      "Not from here: fetching a page would mean sending your request through a server, which this site does not do. Open the page, press Ctrl+S (or Cmd+S) to save it as HTML and drop the file, or select the article text and paste it.",
  },
];

export default function HtmlToMarkdownPage() {
  const tool = getTool("html-to-markdown")!;
  return (
    <>
      <ToolJsonLd slug="html-to-markdown" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            HTML to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Markdown Converter
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Paste HTML code — or copy straight from a web page, Word or Google Docs — and get clean Markdown as you
            type. Tables, links and code blocks included; nothing uploaded.
          </p>
          <div className="mt-10">
            <HtmlToMarkdownTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">When HTML to Markdown is useful</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Moving a blog or a help centre to a static-site generator. Saving an article into Obsidian or Logseq.
            Giving an AI model the text of a web page without thousands of tokens of markup — Markdown carries the
            same structure for a fraction of the tokens, which is why{" "}
            <Link href="/blog/pdf-to-markdown-for-rag-pipelines">RAG pipelines</Link> normalise to it. Or simply
            getting a table out of a web page into a README.
          </p>
          <h3>How to convert HTML to Markdown</h3>
          <ol>
            <li>
              Paste HTML source into the box, drop a saved .html file, or copy a section of a web page, a Google Doc
              or a Word document and paste it directly.
            </li>
            <li>
              Leave <strong>Main content only</strong> on for a full web page, so menus, sidebars and footers are
              left out; turn it off to convert everything.
            </li>
            <li>Tick <strong>Keep images</strong> if you want image links kept in the Markdown.</li>
            <li>Copy the Markdown, or download it as a .md file.</li>
          </ol>
          <h3>Doing it in code</h3>
          <p>
            To convert many pages, use a library instead: <code>turndown</code> (with the GFM plugin for tables) in
            JavaScript — the same approach this tool is built on — <code>markdownify</code> or{" "}
            <code>html2text</code> in Python, or <code>pandoc -f html -t gfm page.html -o page.md</code> on the
            command line. Whatever you pick, the step that makes the difference is removing navigation, scripts
            and boilerplate before converting; a converter reproduces faithfully whatever it is given.
          </p>
          <h3>What is dropped on purpose</h3>
          <p>
            Styling, classes, inline CSS, scripts and layout wrappers. Markdown describes what text <em>is</em> — a
            heading, a list, a link — not how it looks, so anything purely visual has nowhere to go. Elements with
            no Markdown equivalent, such as <code>&lt;video&gt;</code>, are reduced to their text.
          </p>
          <h3>Going the other way</h3>
          <p>
            <Link href="/markdown-to-html">Markdown to HTML</Link> turns Markdown back into sanitised HTML with a
            live preview, and <Link href="/docx-to-markdown">Word to Markdown</Link> converts a whole .docx file,
            images included. The <Link href="/blog/markdown-cheat-sheet">Markdown cheat sheet</Link> covers the
            syntax you will see in the output.
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
          <li>No URL fetching — save the page or copy its content instead.</li>
          <li>Tables with merged cells or block content inside cells cannot become pipe tables.</li>
          <li>Pages that build their content with JavaScript must be copied from the browser, not from “view source”.</li>
          <li>Images are kept as links to their original address; they are not downloaded.</li>
        </ul>
      </section>

      <RelatedTools slug="html-to-markdown" />
      <ToolGuides slug="html-to-markdown" />
    </>
  );
}
