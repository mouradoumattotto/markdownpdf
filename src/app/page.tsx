import type { Metadata } from "next";
import Link from "next/link";
import PdfToMarkdownTool from "@/components/PdfToMarkdownTool";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import BlogCluster from "@/components/BlogCluster";
import { getPostsByTopic } from "@/lib/blog";
import { SITE } from "@/lib/site";

// `/` IS the PDF to Markdown page. Measured 2026-09-01: after 3 months and two
// audits, /pdf-to-markdown was still "URL is unknown to Google" while `/` was one
// of only 8 indexed URLs — and Google was routing "pdf to markdown" queries to a
// blog post instead. Keeping two converter pages when only one gets crawled split
// the signal for nothing, so /pdf-to-markdown now 308s here and its content lives
// on this page. /markdown-to-pdf stays separate: it is a different search intent.
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
    "Convert PDF to Markdown free, in your browser. Structure preserved, automatic OCR for scanned PDFs, no upload, no sign-up. Works offline.",
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

const features = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    ),
    title: "100% private by design",
    description:
      "Conversion happens entirely in your browser. Your contracts, reports, and notes are never uploaded to any server — we couldn't read them if we wanted to.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V4.5a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v15a1.5 1.5 0 001.5 1.5z" />
    ),
    title: "OCR for scanned PDFs",
    description:
      "Scanned pages without a text layer are detected and recognized automatically with built-in OCR — most free converters simply fail on them.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h10.5" />
    ),
    title: "Structure preserved",
    description:
      "Headings, lists, emphasis, and paragraphs are detected from font metrics and rebuilt as clean, ready-to-use Markdown.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    ),
    title: "Ready for LLMs and notes",
    description:
      "Clean Markdown is what ChatGPT, Claude, NotebookLM, Obsidian, and Notion actually want. Structure survives, tokens drop, answers improve.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    ),
    title: "Instant, no limits",
    description:
      "No server round-trip means no waiting and no file size caps. A 300-page PDF converts as easily as a one-pager.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: "Free forever",
    description:
      "No account, no watermark, no premium tier holding features hostage. Both converters are completely free.",
  },
];

const comparison = [
  { feature: "Files stay on your device", us: true, them: false },
  { feature: "Free with no page limit", us: true, them: false },
  { feature: "OCR for scanned PDFs", us: true, them: "Paid plans only" },
  { feature: "No sign-up required", us: true, them: "Often required" },
  { feature: "No watermark on output", us: true, them: "Free tiers add one" },
  { feature: "Works offline after loading", us: true, them: false },
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
    question: "Does the PDF to Markdown converter work offline?",
    answer:
      "Yes. Everything runs in your browser, so once this page has loaded you can disconnect and keep converting. Nothing is sent to a server at any point, during or after the conversion.",
  },
  {
    question: "Is there a file size limit?",
    answer:
      "There is no server-imposed limit because the conversion runs on your own device. Very large PDFs (hundreds of pages) will simply take longer, depending on your computer.",
  },
  {
    question: "Will tables and images be converted?",
    answer:
      "Text content, headings, lists, and emphasis are converted. Complex multi-column tables and embedded images are not reliably recoverable from PDF text data, so you may need to adjust those manually.",
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
            "Automatic OCR for scanned PDFs",
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-[32rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/60 via-violet-200/40 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:pt-24">
          <p className="animate-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.96 11.96 0 013.6 6c-.27.797-.413 1.65-.413 2.54 0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-.89-.143-1.743-.413-2.54a11.96 11.96 0 01-8.4-3.286z" />
            </svg>
            Your files never leave your browser
          </p>
          <h1 className="animate-fade-up mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
            Convert{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              PDF to Markdown
            </span>{" "}
            in seconds
          </h1>
          <p className="animate-fade-up-delay-1 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600">
            Free online PDF to Markdown converter — PDF to MD in one step, with automatic OCR for
            scanned documents. No sign-up, no upload, no limits: drop a PDF below and get clean
            Markdown instantly.
          </p>

          <div id="converter" className="animate-fade-up-delay-2 mx-auto mt-10 max-w-4xl scroll-mt-24 text-left">
            <PdfToMarkdownTool />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-neutral-500">
            {["No sign-up", "No watermark", "No file limits", "OCR included", "Works on mobile"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-indigo-500" />
                {t}
              </span>
            ))}
          </div>

          {/* Plain-language entity statement. Written to be quotable as-is by search
              and answer engines: what the tool is, how it works, what it does not do. */}
          <p className="mx-auto mt-12 max-w-3xl rounded-2xl border border-neutral-200 bg-white/80 px-6 py-5 text-left leading-relaxed text-neutral-700 backdrop-blur">
            <strong className="text-neutral-900">MarkdownPDF</strong> is a free PDF to Markdown
            converter that runs entirely in your browser. It reads the PDF locally with pdf.js,
            rebuilds headings, lists, and emphasis from the font metrics, and falls back to
            Tesseract OCR for scanned pages that have no text layer — so converting a scanned PDF
            to Markdown works the same as a text one. The file is never uploaded, there is no
            account and no page limit, and once the page has loaded it keeps working offline. The
            output is plain Markdown you can paste into ChatGPT, Claude, NotebookLM, Obsidian, or a
            Git repository.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            How to convert PDF to Markdown
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Three steps. About five seconds for a text PDF, a little longer for scans.
          </p>
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

      {/* Why */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
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

      {/* Features */}
      <section className="border-t border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Built different from other converters
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Most online converters upload your files to a server. We rebuilt conversion to run
            entirely on your device instead.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-neutral-200 bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden>
                    {f.icon}
                  </svg>
                </span>
                <h3 className="mt-4 font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
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

      {/* Other direction */}
      <section className="border-t border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <Link
            href="/markdown-to-pdf"
            className="group flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 sm:flex-row sm:items-center"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </span>
            <span className="flex-1">
              <span className="block text-2xl font-bold text-neutral-900">
                Need the other direction? Markdown <span className="text-indigo-600">→</span> PDF
              </span>
              <span className="mt-2 block leading-relaxed text-neutral-600">
                Turn notes, READMEs, resumes, and docs into a polished A4 PDF with real selectable
                text — no watermark, still 100% in your browser.
              </span>
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-indigo-600">
              Convert Markdown to PDF
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Faq items={faqItems} />
      </section>

      {/* From the blog */}
      <section className="border-t border-neutral-100 bg-neutral-50/60">
        <BlogCluster posts={clusterPosts} heading="Guides: PDF to Markdown for every workflow" />
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700">
        <div className="bg-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to convert your first PDF?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Free, instant, and private. Your document never leaves your device.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#converter"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Convert PDF → Markdown
            </a>
            <Link
              href="/markdown-to-pdf"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              Markdown → PDF
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
