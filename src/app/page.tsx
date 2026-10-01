import type { Metadata } from "next";
import Link from "next/link";
import PdfToMarkdownTool from "@/components/PdfToMarkdownTool";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import BlogCluster from "@/components/BlogCluster";
import { ToolGrid, hubLinks } from "@/components/ToolSeo";
import { OCR_LANGUAGES } from "@/lib/ocr";
import { TOOLS } from "@/lib/tools";
import { getPostsByTopic } from "@/lib/blog";
import { SITE } from "@/lib/site";

// `/` IS the PDF to Markdown page. Measured 2026-09-01: after 3 months and two
// audits, /pdf-to-markdown was still "URL is unknown to Google" while `/` was one
// of only 8 indexed URLs — and Google was routing "pdf to markdown" queries to a
// blog post instead. Keeping two converter pages when only one gets crawled split
// the signal for nothing, so /pdf-to-markdown now 308s here and its content lives
// on this page. /md-to-pdf stays separate: it is a different search intent.
//
// The brand is spelled out in the title on purpose: the layout's title.template
// does not apply to app/page.tsx (same segment), and dropping "MarkdownPDF" from
// this title on 2026-08-21 coincided with `/` falling from pos 5.6 to 29.7 on the
// brand query.
export const metadata: Metadata = {
  // Kept under ~58 characters so Google does not truncate it: the brand sits at
  // the end and is the part that must survive. (Measured 2026-09-17: the previous
  // title was 65 characters and the description 196 — both cut short in the SERP.)
  title: { absolute: "PDF to Markdown Converter — Free, with OCR | MarkdownPDF" },
  description:
    "Convert PDF to Markdown free, in your browser. Structure preserved, automatic OCR for scanned PDFs, no upload, no sign-up, no page limit.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "PDF to Markdown Converter — Free, Private, with OCR",
    description:
      "Convert PDF to Markdown online for free, with automatic OCR for scanned documents. Your files never leave your browser.",
    url: "/",
  },
};

const steps = [
  {
    name: "Drop your PDF",
    text: "Drag and drop your PDF into the converter above, or click to browse your device. Nothing is uploaded — the file is read locally.",
  },
  {
    name: "Automatic conversion",
    text: "The tool extracts the text layer and rebuilds headings, lists, and emphasis as Markdown. Scanned pages with no text layer are recognized with OCR automatically.",
  },
  {
    name: "Copy or download",
    text: "Review the Markdown output, edit it if needed, then copy it to your clipboard or download it as a .md file.",
  },
];

const pillars = [
  {
    title: "Clean output",
    text: "Headings, lists, emphasis and tables come back as real Markdown. Tick “Extract images” and every figure is saved as a file, linked where it appeared.",
  },
  {
    title: "Verify at a glance",
    text: "The original PDF sits beside the Markdown. Scanned pages read with OCR are flagged, so you know exactly which ones to check.",
  },
  {
    title: "Never uploaded",
    text: "Everything runs in your browser — text extraction and OCR included. No account, no watermark, no page limit.",
  },
];

const comparison = [
  { feature: "Files stay on your device", us: true, them: false },
  { feature: "Free with no page limit", us: true, them: false },
  { feature: "OCR for scanned PDFs", us: true, them: "Paid plans only" },
  { feature: "No sign-up required", us: true, them: "Often required" },
  { feature: "No watermark on output", us: true, them: "Free tiers add one" },
];

const faqItems = [
  {
    question: "How do I convert a PDF to Markdown?",
    answer:
      "Drop your PDF into the converter at the top of this page (or click to browse). The tool extracts the text, rebuilds headings, lists, and emphasis as Markdown, and lets you copy the result or download it as a .md file. It takes a few seconds for a typical document.",
  },
  {
    question: "Is MarkdownPDF really free?",
    answer:
      "Yes. Both the PDF to Markdown and Markdown to PDF converters are completely free, with no account, watermark, or hidden limits.",
  },
  {
    question: "Are my files uploaded to a server?",
    answer:
      "No. All conversion runs locally in your browser using JavaScript (pdf.js for text extraction, Tesseract for OCR). Your PDF is never uploaded, stored, or seen by any server, which makes MarkdownPDF safe for confidential documents.",
  },
  {
    question: "Can I convert a scanned PDF to Markdown?",
    answer:
      "Yes. If a page has no embedded text layer, the converter automatically runs OCR (optical character recognition) on the page image to recognize the text. OCR PDF to Markdown conversion is slower than normal extraction, so scanned documents take a bit longer.",
  },
  {
    question: "Does the converter need an internet connection?",
    answer:
      "Only to load the tool itself. Your PDF is never sent anywhere — it is read and converted on your device. The first time a scanned page needs OCR, your browser downloads the recognition engine and the language you picked from markdownpdf.app; the document itself stays local throughout.",
  },
  {
    question: "Which languages can the OCR read?",
    answer: `${OCR_LANGUAGES.map((l) => l.label).join(", ")}. Pick the language of your scanned pages under the drop zone before converting; the choice is remembered on your device. Pages that already contain real text are extracted directly, whatever their language.`,
  },
  {
    question: "Is there a file size limit?",
    answer:
      "There is no server-imposed limit because the conversion runs on your own device. Very large PDFs (hundreds of pages) will simply take longer, depending on your computer.",
  },
  {
    question: "Will tables and images be converted?",
    answer:
      "Text content, headings, lists, and emphasis are converted. Tick “Extract images” to also save the pictures embedded in the PDF: they are linked in the Markdown where they appear and downloaded as a ZIP with an images/ folder (small decorative images and logos repeated on every page are kept once or skipped). Complex multi-column tables are not reliably recoverable from PDF text data, so you may need to adjust those manually.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Yes. The site works in any modern browser, including Safari on iOS and Chrome on Android. Large scanned PDFs may convert more slowly on older phones.",
  },
];

function CheckIcon({ className = "h-5 w-5 text-emerald-500" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 text-neutral-300" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function HomePage() {
  const clusterPosts = getPostsByTopic("pdf to markdown convert ocr scanned tables chatgpt claude notebooklm obsidian");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "@id": `${SITE.url}/#app`,
          name: "MarkdownPDF — PDF to Markdown Converter",
          url: SITE.url,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires a modern browser with JavaScript enabled",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description:
            "Free, browser-based PDF to Markdown converter. Extracts text, rebuilds headings, lists, and emphasis as Markdown, and runs OCR on scanned pages. Files are processed locally and never uploaded.",
          featureList: [
            "PDF text extraction with structure detection (headings, lists, emphasis)",
            "Automatic OCR for scanned PDFs in 7 languages",
            "100% client-side processing — no upload",
            "No file size limit, no sign-up, no watermark",
            "Markdown to PDF conversion with real selectable text",
          ],
          publisher: { "@id": `${SITE.url}/#organization` },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to convert a PDF to Markdown",
          totalTime: "PT1M",
          tool: { "@type": "HowToTool", name: "MarkdownPDF (free browser converter)" },
          step: steps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.name,
            text: s.text,
          })),
        }}
      />

      {/* Hero — the converter itself, as on every tool page */}
      <section>
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 text-center sm:px-6 sm:pb-14 sm:pt-16">
          <h1 className="animate-fade-up mx-auto max-w-3xl text-[2.125rem] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink [text-wrap:balance] sm:text-[3.25rem]">
            Convert PDF to Markdown in seconds
          </h1>
          <p className="animate-fade-up-delay-1 mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Free online PDF to Markdown converter — PDF to MD in one step, with automatic OCR for
            scanned documents. No sign-up, no upload, no limits.
          </p>

          <div id="converter" className="animate-fade-up-delay-2 mx-auto mt-8 max-w-5xl scroll-mt-24 text-left sm:mt-10">
            <PdfToMarkdownTool />
          </div>

        </div>
      </section>

      {/* The rest of the suite — generated from src/lib/tools.ts */}
      <section id="all-tools" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <h2 className="mx-auto max-w-3xl text-center text-[1.75rem] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink [text-wrap:balance] sm:text-5xl">
            Every tool to turn PDFs into clean Markdown
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-neutral-600 sm:text-lg">
            Free, in your browser. Your files never leave your device.
          </p>
          <div className="mt-10">
            <ToolGrid tools={TOOLS.filter((t) => t.path !== "/")} />
          </div>
          {hubLinks().length > 0 && (
            <p className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {hubLinks().map((h) => (
                <Link key={h.href} href={h.href} className="py-1 font-semibold text-brand-600 hover:underline">
                  All {h.label} →
                </Link>
              ))}
            </p>
          )}

          {/* Plain-language entity statement. Written to be quotable as-is by search
              and answer engines: what the tool is, how it works, what it does not do. */}
          <p className="mx-auto mt-14 max-w-3xl rounded-[14px] border border-line bg-white px-5 py-5 text-left leading-relaxed text-neutral-700 sm:px-6">
            <strong className="text-ink">MarkdownPDF</strong> is a free PDF to Markdown
            converter that runs entirely in your browser. It reads the PDF locally with pdf.js,
            rebuilds headings, lists, and emphasis from the font metrics, and falls back to
            Tesseract OCR for scanned pages that have no text layer — so converting a scanned PDF
            to Markdown works the same as a text one. The file is never uploaded, there is no
            account and no page limit. The output is plain Markdown you can paste into ChatGPT, Claude, NotebookLM, Obsidian, or a
            Git repository.
          </p>
        </div>
      </section>

      {/* Three pillars — each promise said once */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-10">
        <div className="grid gap-px overflow-hidden rounded-[14px] border border-line bg-line md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="bg-white p-6 sm:p-7">
              <h3 className="text-[19px] font-bold text-ink">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h2 className="text-center text-[1.75rem] font-extrabold tracking-[-0.03em] text-neutral-900 sm:text-4xl">
            How to convert PDF to Markdown
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Three steps. About five seconds for a text PDF, a little longer for scans.
          </p>
          <ol className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.name} className="relative rounded-[14px] border border-line bg-paper p-6 sm:p-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-mono font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{s.name}</h3>
                <p className="mt-2 leading-relaxed text-neutral-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        <h2 className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-neutral-900 sm:text-4xl">
          Why convert PDF to Markdown?
        </h2>
        <div className="prose prose-neutral mt-6 max-w-none prose-a:text-indigo-600">
          <p>
            PDF is great for sharing a fixed layout, but it is painful to edit, version, or reuse.
            Markdown is the opposite: a lightweight plain-text format that works everywhere — in
            GitHub READMEs, note-taking apps like Obsidian, static site generators, documentation
            platforms, and the context window of a language model. Converting a PDF to Markdown
            lets you:
          </p>
          <ul>
            <li>
              <strong>Feed documents to AI tools cleanly.</strong> ChatGPT, Claude, and NotebookLM
              read Markdown structure far better than raw PDF text — see{" "}
              <Link href="/blog/why-llms-prefer-markdown">why LLMs prefer Markdown</Link>.
            </li>
            <li>
              <strong>Edit the content freely</strong> in any text editor, without PDF software.
            </li>
            <li>
              <strong>Track changes with Git</strong>, since Markdown is plain text that diffs
              cleanly.
            </li>
            <li>
              <strong>Reuse content</strong> in wikis, blogs, knowledge bases, and RAG pipelines
              that expect text input.
            </li>
            <li>
              <strong>Future-proof your documents</strong> — plain text will still open in 30
              years.
            </li>
          </ul>
          <p>
            Unlike most online converters, this tool runs entirely in your browser. That means no
            upload wait, no privacy risk, and no server-side file size limits. To learn more, read
            our guide on <Link href="/blog/pdf-vs-word-vs-markdown">Markdown vs PDF</Link>, or see{" "}
            <Link href="/blog/how-to-convert-pdf-to-markdown">
              every way to convert PDF to Markdown
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
        <h2 className="text-center text-[1.75rem] font-extrabold tracking-[-0.03em] text-neutral-900 sm:text-4xl">
          MarkdownPDF vs. typical online converters
        </h2>
        <div className="mt-12 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th scope="col" className="px-5 py-4 font-semibold text-neutral-900"></th>
                <th scope="col" className="px-5 py-4 font-semibold text-indigo-600">MarkdownPDF</th>
                <th scope="col" className="px-5 py-4 font-semibold text-neutral-500">Typical converters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {comparison.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="px-5 py-4 font-medium text-neutral-700">{row.feature}</th>
                  <td className="px-5 py-4">
                    <CheckIcon />
                  </td>
                  <td className="px-5 py-4 text-neutral-500">
                    {row.them === false ? <CrossIcon /> : row.them}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <Faq items={faqItems} />
      </section>

      {/* From the blog */}
      <section className="border-y border-line bg-white">
        <BlogCluster posts={clusterPosts} heading="Guides: PDF to Markdown for every workflow" />
      </section>

    </>
  );
}
