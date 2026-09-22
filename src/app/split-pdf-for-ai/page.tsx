import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import SplitForAiTool from "@/components/SplitForAiTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { AI_TARGETS, CHECKED_ON } from "@/lib/ai-limits";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Split a PDF into parts that fit NotebookLM, ChatGPT, Claude or Gemini upload limits — by chapter or by size, in your browser, without uploading the file.";

export const metadata: Metadata = {
  title: "Split PDF for NotebookLM, ChatGPT & Claude",
  description: DESCRIPTION,
  alternates: { canonical: "/split-pdf-for-ai" },
  openGraph: {
    title: "Split a PDF to fit NotebookLM, ChatGPT and Claude",
    description:
      "Counts the words, reads the chapters, and cuts the PDF into parts each AI tool will accept. Nothing is uploaded.",
    url: "/split-pdf-for-ai",
  },
};

const steps = [
  {
    name: "Drop the PDF",
    text: "The tool reads it locally: page count, words per page, file size, and the chapters in its bookmarks. Nothing is sent anywhere.",
  },
  {
    name: "Pick the AI tool",
    text: "Each one has its own limits. The plan updates as you choose, and tells you straight away when no split is needed at all.",
  },
  {
    name: "Create the parts",
    text: "Each part is a real PDF you can download one by one or as a ZIP. A part that still comes out too large is split again automatically.",
  },
];

const faqItems = [
  {
    question: "Why split a PDF before uploading it to an AI tool?",
    answer:
      "Because every tool has a per-file ceiling — words, tokens, megabytes or pages. Past it, the upload is refused or the file is silently truncated, and you get confident answers based on half a document. Splitting keeps every page inside the window, and makes it obvious which part an answer came from.",
  },
  {
    question: "Is my PDF uploaded anywhere?",
    answer:
      "No. The analysis (pdf.js) and the splitting (pdf-lib) both run in your browser. The file never leaves your device, which matters for the contracts, medical files and unpublished research people usually need to split.",
  },
  {
    question: "What does “split at chapter boundaries” do?",
    answer:
      "If the PDF has bookmarks, each top-level bookmark starts a new part, so a part is a chapter rather than an arbitrary page range. Chapters that are still over the limit are subdivided, and anything before the first chapter becomes a “front matter” part. Without bookmarks, the tool packs as many consecutive pages as each limit allows.",
  },
  {
    question: "Why does Claude split at 100 pages when it accepts 1,000?",
    answer:
      "Because of what it reads, not what it accepts. Claude analyses charts, diagrams and images in PDFs of 100 pages or fewer; from 101 to 1,000 pages it processes the text only. Parts of 100 pages keep the figures visible to it. Use custom limits if you only care about text.",
  },
  {
    question: "My PDF is scanned — will this help?",
    answer:
      "Splitting does not create text. A scanned page stays an image, and the AI tool has to run its own OCR, with results you cannot inspect. Converting to Markdown with OCR first gives you text you can check, and usually better answers.",
  },
  {
    question: "Are these limits up to date?",
    answer: `They were checked against the vendors' own documentation on ${CHECKED_ON}, and each row links to its source. These limits change: if you hit one that does not match, use the custom limits and tell us so the page can be corrected.`,
  },
];

export default function SplitPdfForAiPage() {
  const tool = getTool("split-pdf-for-ai")!;
  return (
    <>
      <ToolJsonLd slug="split-pdf-for-ai" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Split a PDF for{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              NotebookLM, ChatGPT and Claude
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            A textbook, a thesis or a year of board minutes rarely fits in one upload. This tool counts the words,
            reads the chapters, and cuts the PDF into parts each tool will actually accept — in your browser, with
            nothing uploaded.
          </p>
          <div className="mt-10">
            <SplitForAiTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          The upload limits, and where they come from
        </h2>
        <p className="mt-3 text-neutral-600">
          Checked against each vendor&apos;s own documentation on {CHECKED_ON}. Limits change without notice — every
          row links to the page it came from, so you can confirm it yourself.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th scope="col" className="px-5 py-4 font-semibold text-neutral-900">Tool</th>
                <th scope="col" className="px-5 py-4 font-semibold text-neutral-900">Per-file limit</th>
                <th scope="col" className="px-5 py-4 font-semibold text-neutral-900">Worth knowing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {AI_TARGETS.map((t) => (
                <tr key={t.id}>
                  <th scope="row" className="px-5 py-4 font-medium text-neutral-800">
                    {t.name}
                  </th>
                  <td className="px-5 py-4 text-neutral-700">
                    {t.summary}
                    {t.estimated && <span className="block text-xs text-neutral-500">(token cap converted to words — an estimate)</span>}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {t.note}{" "}
                    <a href={t.source.url} target="_blank" rel="noopener nofollow" className="whitespace-nowrap text-indigo-600 hover:underline">
                      {t.source.label}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdSlot placement="tool" />

      <section className="border-t border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900">How it works</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.name} className="relative rounded-2xl bg-white p-7 shadow-sm ring-1 ring-neutral-100">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 font-bold text-white shadow-md shadow-indigo-500/25">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{s.name}</h3>
                <p className="mt-2 leading-relaxed text-neutral-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Split by chapter, not by page count</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Cutting a book every 80 pages puts the end of chapter 3 and the start of chapter 4 in the same file, and
            splits an argument across two sources. A model answering from part 2 has the conclusion without the
            premise. When a PDF carries bookmarks — most textbooks, reports and theses do — this tool uses them, so
            each part is a self-contained section with a name you recognise in the answer&apos;s citation.
          </p>
          <p>
            It also tells you when to do nothing. Plenty of documents already fit: a 300-page report is usually well
            under NotebookLM&apos;s 500,000 words. Splitting it anyway would only spend source slots you may need for
            other documents.
          </p>
          <h3>Markdown often beats splitting</h3>
          <p>
            Limits are counted in words, tokens or megabytes — and a PDF is a heavy way to carry text. The same
            document as Markdown is a fraction of the size, keeps its headings, and drops the layout noise that
            confuses extraction. If your goal is answers rather than page fidelity, convert first with the{" "}
            <Link href="/">PDF to Markdown converter</Link> (with OCR for scans) and split only if it is still too
            large. The{" "}
            <Link href="/blog/why-llms-prefer-markdown">comparison of what models actually receive</Link> shows why.
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
          <li>
            Word counts come from the PDF&apos;s text layer. Scanned pages count as zero words — the summary says how
            many, and OCR is the answer, not splitting.
          </li>
          <li>
            Languages written without spaces (Chinese, Japanese, Thai) cannot be counted in words reliably. Use the
            page or megabyte limits instead.
          </li>
          <li>
            Encrypted or password-protected PDFs cannot be split. Open the file with its password and save an
            unprotected copy first.
          </li>
          <li>
            A single page larger than a size limit cannot be split further; it is flagged in the results rather than
            silently shipped over the limit.
          </li>
          <li>Bookmarks are used as chapters. PDFs without bookmarks are packed by size only.</li>
        </ul>
      </section>

      <RelatedTools slug="split-pdf-for-ai" />
      <ToolGuides slug="split-pdf-for-ai" heading="Guides for AI document workflows" />
    </>
  );
}
