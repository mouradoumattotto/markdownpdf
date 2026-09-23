import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import MarkdownEditorTool from "@/components/MarkdownEditorTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "A free online Markdown editor with live preview, formatting toolbar and autosave in your browser. Export to PDF, Word or HTML. No account, nothing uploaded.";

export const metadata: Metadata = {
  title: "Online Markdown Editor — Live Preview, Free",
  description: DESCRIPTION,
  alternates: { canonical: "/markdown-editor" },
  openGraph: {
    title: "A private online Markdown editor",
    description: "Live preview, autosave in your browser, export to PDF, Word and HTML.",
    url: "/markdown-editor",
  },
};

const faqItems = [
  {
    question: "Where is my document saved?",
    answer:
      "In your browser’s local storage, on this device only. It is there when you come back, but it is not synced anywhere and nobody else can see it. Clearing site data, or a private window, removes it — download a copy of anything you want to keep.",
  },
  {
    question: "What can the preview show?",
    answer:
      "Everything in GitHub-flavored Markdown — headings, lists, task lists, tables, links, images, blockquotes — plus syntax-highlighted code, Mermaid diagrams (```mermaid blocks) and LaTeX math between $ signs.",
  },
  {
    question: "Which export should I use?",
    answer:
      "Markdown to keep editing elsewhere or commit to Git; HTML for a web page or a CMS; PDF to share a document that looks the same everywhere; Word when someone needs to comment with tracked changes. Each export runs in your browser.",
  },
  {
    question: "What is the difference with Markdown to PDF?",
    answer:
      "This page is for writing: a larger editor, a toolbar, autosave and four export formats. Markdown to PDF is for producing the best PDF: page themes, local images and a print mode that supports every language, including right-to-left scripts.",
  },
  {
    question: "Are there keyboard shortcuts?",
    answer:
      "Ctrl+B for bold, Ctrl+I for italic and Ctrl+K for a link (Cmd on a Mac). Toolbar changes are ordinary edits, so Ctrl+Z undoes them.",
  },
];

export default function MarkdownEditorPage() {
  const tool = getTool("markdown-editor")!;
  return (
    <>
      <ToolJsonLd slug="markdown-editor" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Markdown{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Editor</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Write in Markdown with a live preview. Your document autosaves in this browser — not on a server — and
            exports to PDF, Word or HTML when it is ready.
          </p>
          <div className="mt-10">
            <MarkdownEditorTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">An editor that keeps your drafts to itself</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Online editors usually store your documents on their servers, behind an account. This one stores them
            in your own browser: there is no account to create, and nothing you type is sent anywhere. That makes
            it suitable for notes, drafts and documents you would rather not upload.
          </p>
          <p>
            New to the syntax? The <Link href="/blog/markdown-cheat-sheet">Markdown cheat sheet</Link> covers
            everything the preview understands, and the{" "}
            <Link href="/blog/markdown-to-pdf-mermaid-math">diagrams and math guide</Link> shows how to add
            flowcharts and equations. Tables are quicker with the{" "}
            <Link href="/markdown-table-generator">table generator</Link>.
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
          <li>One document at a time, saved in this browser only — not synced between devices.</li>
          <li>Private windows and cleared site data lose the autosaved copy; download to keep it.</li>
          <li>Images must be web addresses; for local images, use Markdown to PDF.</li>
          <li>The quick PDF export does not shape right-to-left and complex scripts; Markdown to PDF’s print mode does.</li>
        </ul>
      </section>

      <RelatedTools slug="markdown-editor" />
      <ToolGuides slug="markdown-editor" />
    </>
  );
}
