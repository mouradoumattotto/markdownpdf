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

const features = [
  {
    title: "100% private",
    description:
      "Conversion happens entirely in your browser. Your documents are never uploaded to any server.",
  },
  {
    title: "OCR for scanned PDFs",
    description:
      "Scanned pages without a text layer are automatically recognized with built-in OCR.",
  },
  {
    title: "Structure preserved",
    description:
      "Headings, lists, emphasis, and paragraphs are detected and rebuilt as clean Markdown.",
  },
  {
    title: "Real PDF output",
    description:
      "Markdown becomes a true vector PDF with selectable text, tables, and code blocks — not a screenshot.",
  },
  {
    title: "No sign-up, no limits",
    description: "No account, no watermarks, no file size caps imposed by a server. Just convert.",
  },
  {
    title: "Free forever",
    description: "Both converters are completely free to use, on desktop and mobile.",
  },
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

      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Convert between <span className="text-blue-600">PDF</span> and{" "}
            <span className="text-blue-600">Markdown</span> in seconds
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
            Free, instant, and completely private. Your files are converted right in your browser
            and never uploaded — with automatic OCR for scanned documents.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Link
              href="/pdf-to-markdown"
              className="group rounded-2xl border border-neutral-200 bg-white p-8 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <p className="text-2xl font-bold text-neutral-900">
                PDF <span className="text-blue-600">→</span> Markdown
              </p>
              <p className="mt-2 text-neutral-600">
                Extract clean Markdown from any PDF — headings, lists, and emphasis included. OCR
                kicks in for scanned pages.
              </p>
              <p className="mt-4 font-medium text-blue-600 group-hover:underline">
                Convert PDF to Markdown →
              </p>
            </Link>
            <Link
              href="/markdown-to-pdf"
              className="group rounded-2xl border border-neutral-200 bg-white p-8 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <p className="text-2xl font-bold text-neutral-900">
                Markdown <span className="text-blue-600">→</span> PDF
              </p>
              <p className="mt-2 text-neutral-600">
                Turn your Markdown notes, README files, and docs into a polished, shareable PDF
                with one click.
              </p>
              <p className="mt-4 font-medium text-blue-600 group-hover:underline">
                Convert Markdown to PDF →
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900">
          Why use MarkdownPDF?
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold text-neutral-900">{f.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Faq items={faqItems} />
        </div>
      </section>
    </>
  );
}
