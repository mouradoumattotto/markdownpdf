import type { Metadata } from "next";
import Link from "next/link";
import MarkdownToPdfTool from "@/components/MarkdownToPdfTool";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Markdown to PDF Converter — Free Online Tool",
  description:
    "Convert Markdown to PDF online for free. Supports headings, tables, code blocks, and links. Real selectable text, no watermark, 100% private — runs in your browser.",
  alternates: { canonical: "/markdown-to-pdf" },
  openGraph: {
    title: "Markdown to PDF Converter — Free Online Tool",
    description:
      "Convert Markdown to PDF online for free. Real selectable text, no watermark, 100% private.",
    url: "/markdown-to-pdf",
  },
};

const faqItems = [
  {
    question: "How do I convert Markdown to PDF?",
    answer:
      "Paste or type your Markdown in the editor above, or open an existing .md file. Check the live preview, then click Download PDF — the document is generated instantly in your browser.",
  },
  {
    question: "What Markdown features are supported?",
    answer:
      "Headings (H1–H6), paragraphs, bold and italic text, ordered and unordered lists (including nesting), links, inline code, fenced code blocks, blockquotes, tables, and horizontal rules.",
  },
  {
    question: "Is the PDF real text or an image?",
    answer:
      "Real text. The PDF is generated as vector text, so it is selectable, searchable, accessible to screen readers, and small in file size — unlike converters that screenshot the page.",
  },
  {
    question: "Does the converter add a watermark?",
    answer: "No. The generated PDF is completely clean, with no watermark or branding.",
  },
  {
    question: "Can I use it for GitHub README files?",
    answer:
      "Yes. Open your README.md in the editor and download it as a PDF — useful for sharing documentation with people outside your repository.",
  },
];

export default function MarkdownToPdfPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
            {
              "@type": "ListItem",
              position: 2,
              name: "Markdown to PDF",
              item: `${SITE.url}/markdown-to-pdf`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Markdown to PDF Converter",
          url: `${SITE.url}/markdown-to-pdf`,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList:
            "Markdown editor with live preview, vector PDF output, tables, code blocks, A4 layout",
        }}
      />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-12">
          <h1 className="text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Markdown to PDF{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Converter
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Write or paste Markdown, preview it live, and download a clean A4 PDF with real
            selectable text. Free, no watermark, and fully private.
          </p>
          <div className="mt-10">
            <MarkdownToPdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Why convert Markdown to PDF?
        </h2>
        <div className="prose prose-neutral mt-4 max-w-none">
          <p>
            Markdown is the writing format of choice for developers, technical writers, and
            note-takers — but it is not what you hand to a client, attach to an email, or print.
            PDF is the universal exchange format: it looks identical everywhere and nobody needs
            special software to open it. Converting Markdown to PDF is the natural last step for:
          </p>
          <ul>
            <li>
              <strong>Reports and proposals</strong> written in Markdown that need a professional,
              fixed-layout deliverable.
            </li>
            <li>
              <strong>Documentation and READMEs</strong> shared with people who do not use GitHub.
            </li>
            <li>
              <strong>Notes and study material</strong> from apps like Obsidian or Logseq that you
              want to print or archive.
            </li>
            <li>
              <strong>Resumes and letters</strong> kept in version control as plain text.
            </li>
          </ul>
          <p>
            This converter parses your Markdown and lays it out as a genuine vector PDF — headings,
            tables, code blocks and links included — so the text stays selectable and searchable.
            Curious about other approaches like Pandoc or VS Code extensions? See our guide on{" "}
            <Link href="/blog/convert-markdown-to-pdf">
              every way to convert Markdown to PDF
            </Link>
            , or learn the syntax first with our{" "}
            <Link href="/blog/what-is-markdown-complete-guide">complete Markdown guide</Link>.
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
          Extract clean Markdown from any PDF with our{" "}
          <Link href="/pdf-to-markdown" className="font-medium text-indigo-600 hover:underline">
            PDF to Markdown converter
          </Link>
          .
        </p>
      </section>
    </>
  );
}
