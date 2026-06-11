import type { Metadata } from "next";
import Link from "next/link";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "MarkdownPDF — Free PDF to Markdown & Markdown to PDF Converter",
  description:
    "Convert PDF to Markdown (with OCR for scanned files) or Markdown to PDF — free, instant, and 100% private. Files are processed in your browser, never uploaded.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    title: "Drop your file",
    text: "Drag a PDF or Markdown file into the converter — or just paste your text.",
  },
  {
    title: "Converted instantly",
    text: "Everything runs in your browser. No upload bar, no queue, no waiting for a server.",
  },
  {
    title: "Download the result",
    text: "Grab clean Markdown or a polished, selectable-text PDF. No watermark, no sign-up.",
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
    title: "Real, selectable PDF text",
    description:
      "Markdown becomes a true vector PDF — searchable, selectable, screen-reader friendly, and small. Not a blurry screenshot.",
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
    question: "Is MarkdownPDF really free?",
    answer:
      "Yes. Both the PDF to Markdown and Markdown to PDF converters are completely free, with no account, watermark, or hidden limits.",
  },
  {
    question: "Are my files uploaded to a server?",
    answer:
      "No. All conversion runs locally in your browser using JavaScript. Your documents never leave your device, which makes MarkdownPDF safe for confidential files.",
  },
  {
    question: "Can it convert scanned PDFs?",
    answer:
      "Yes. When a page has no embedded text layer, the converter automatically runs OCR (optical character recognition) to extract the text from the page image.",
  },
  {
    question: "What Markdown syntax is supported for PDF export?",
    answer:
      "Headings, paragraphs, bold and italic text, ordered and unordered lists, links, inline code, fenced code blocks, blockquotes, tables, and horizontal rules.",
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
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: SITE.name,
          url: SITE.url,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description: SITE.description,
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
            Convert between{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              PDF
            </span>{" "}
            and{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Markdown
            </span>{" "}
            in seconds
          </h1>
          <p className="animate-fade-up-delay-1 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600">
            Free, instant, and completely private — with automatic OCR for scanned documents. No
            sign-up, no watermark, no file size limits.
          </p>

          <div className="animate-fade-up-delay-2 mt-12 grid gap-5 text-left sm:grid-cols-2">
            <Link
              href="/pdf-to-markdown"
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 p-8 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m6.75 3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </span>
              <p className="mt-5 text-2xl font-bold text-neutral-900">
                PDF <span className="text-indigo-600">→</span> Markdown
              </p>
              <p className="mt-2 leading-relaxed text-neutral-600">
                Extract clean Markdown from any PDF — headings, lists, and emphasis included. OCR
                kicks in for scanned pages.
              </p>
              <p className="mt-5 inline-flex items-center gap-1 font-semibold text-indigo-600">
                Convert PDF to Markdown
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </p>
            </Link>
            <Link
              href="/markdown-to-pdf"
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 p-8 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </span>
              <p className="mt-5 text-2xl font-bold text-neutral-900">
                Markdown <span className="text-indigo-600">→</span> PDF
              </p>
              <p className="mt-2 leading-relaxed text-neutral-600">
                Turn notes, READMEs, and docs into a polished, shareable PDF with real selectable
                text — in one click.
              </p>
              <p className="mt-5 inline-flex items-center gap-1 font-semibold text-indigo-600">
                Convert Markdown to PDF
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </p>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-neutral-500">
            {["No sign-up", "No watermark", "No file limits", "Works on mobile"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-indigo-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Three steps. About five seconds.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl bg-white p-7 shadow-sm ring-1 ring-neutral-100">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 font-bold text-white shadow-md shadow-indigo-500/25">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-neutral-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
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
      </section>

      {/* Comparison */}
      <section className="border-t border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto max-w-4xl px-4 py-20">
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
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Faq items={faqItems} />
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700">
        <div className="bg-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to convert your first file?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Free, instant, and private. Your document never leaves your device.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/pdf-to-markdown"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              PDF → Markdown
            </Link>
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
