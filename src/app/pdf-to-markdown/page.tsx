import type { Metadata } from "next";
import Link from "next/link";
import PdfToMarkdownTool from "@/components/PdfToMarkdownTool";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import BlogCluster from "@/components/BlogCluster";
import { getPostsByTopic } from "@/lib/blog";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "PDF to Markdown Converter — Free, Private, with OCR",
  description:
    "Convert PDF to Markdown online for free. Preserves headings, lists, and formatting, with automatic OCR for scanned PDFs. 100% private — files never leave your browser.",
  alternates: { canonical: "/pdf-to-markdown" },
  openGraph: {
    title: "PDF to Markdown Converter — Free, Private, with OCR",
    description:
      "Convert PDF to Markdown online for free, with automatic OCR for scanned documents. Your files never leave your browser.",
    url: "/pdf-to-markdown",
  },
};

const faqItems = [
  {
    question: "How do I convert a PDF to Markdown?",
    answer:
      "Drop your PDF into the converter above (or click to browse). The tool extracts the text, rebuilds headings, lists, and emphasis as Markdown, and lets you copy the result or download it as a .md file.",
  },
  {
    question: "Does it work with scanned PDFs?",
    answer:
      "Yes. If a page has no embedded text layer, the converter automatically runs OCR on the page image to recognize the text. OCR is slower than normal extraction, so scanned documents take a bit longer.",
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
    question: "Is it safe to convert confidential PDFs?",
    answer:
      "Yes. The entire conversion runs locally in your browser — your PDF is never uploaded, stored, or seen by any server.",
  },
];

const steps = [
  {
    name: "Upload your PDF",
    text: "Drag and drop your PDF file into the converter, or click to browse your device.",
  },
  {
    name: "Automatic conversion",
    text: "The tool extracts the text layer and rebuilds the document structure as Markdown. Scanned pages are recognized with OCR automatically.",
  },
  {
    name: "Copy or download",
    text: "Review the Markdown output, edit it if needed, then copy it to your clipboard or download it as a .md file.",
  },
];

export default function PdfToMarkdownPage() {
  const clusterPosts = getPostsByTopic("pdf to markdown convert ocr scanned tables");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "PDF to Markdown Converter",
          url: `${SITE.url}/pdf-to-markdown`,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: "PDF text extraction, OCR for scanned PDFs, Markdown structure detection",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
            {
              "@type": "ListItem",
              position: 2,
              name: "PDF to Markdown",
              item: `${SITE.url}/pdf-to-markdown`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to convert a PDF to Markdown",
          step: steps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.name,
            text: s.text,
          })),
        }}
      />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-12">
          <h1 className="text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            PDF to Markdown{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Converter
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Free online tool to convert PDF documents into clean Markdown. Automatic OCR for
            scanned files. 100% private — your PDF never leaves your browser.
          </p>
          <div className="mt-10">
            <PdfToMarkdownTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          How to convert PDF to Markdown
        </h2>
        <ol className="mt-6 space-y-6">
          {steps.map((s, i) => (
            <li key={s.name} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-neutral-900">{s.name}</h3>
                <p className="mt-1 text-neutral-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-14 text-2xl font-bold tracking-tight text-neutral-900">
          Why convert PDF to Markdown?
        </h2>
        <div className="prose prose-neutral mt-4 max-w-none">
          <p>
            PDF is great for sharing a fixed layout, but it is painful to edit, version, or reuse.
            Markdown is the opposite: a lightweight plain-text format that works everywhere — in
            GitHub READMEs, note-taking apps like Obsidian, static site generators, and
            documentation platforms. Converting a PDF to Markdown lets you:
          </p>
          <ul>
            <li>
              <strong>Edit the content freely</strong> in any text editor, without PDF software.
            </li>
            <li>
              <strong>Track changes with Git</strong>, since Markdown is plain text that diffs
              cleanly.
            </li>
            <li>
              <strong>Reuse content</strong> in wikis, blogs, knowledge bases, and LLM pipelines
              that expect text input.
            </li>
            <li>
              <strong>Future-proof your documents</strong> — plain text will still open in 30
              years.
            </li>
          </ul>
          <p>
            Unlike most online converters, this tool runs entirely in your browser. That means no
            upload wait, no privacy risk, and no server-side file size limits. If you want to learn
            more about the differences between the two formats, read our guide on{" "}
            <Link href="/blog/markdown-vs-pdf">Markdown vs PDF</Link>, or see{" "}
            <Link href="/blog/how-to-convert-pdf-to-markdown">
              all the ways to convert PDF to Markdown
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-neutral-900">Need the other direction?</h2>
        <p className="mt-2 text-neutral-600">
          Turn your Markdown files into polished PDF documents with our{" "}
          <Link href="/markdown-to-pdf" className="font-medium text-indigo-600 hover:underline">
            Markdown to PDF converter
          </Link>
          .
        </p>
      </section>

      <BlogCluster posts={clusterPosts} heading="Learn more about PDF & Markdown" />
    </>
  );
}
