import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import HtmlToPdfTool from "@/components/HtmlToPdfTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Turn an HTML file or content pasted from a web page into a clean PDF with real, selectable text. Menus and sidebars stripped. Free, nothing uploaded.";

export const metadata: Metadata = {
  title: "HTML to PDF Converter — Free, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/html-to-pdf" },
  openGraph: {
    title: "HTML to PDF, in your browser",
    description: "An HTML file or pasted web page as a clean, readable PDF.",
    url: "/html-to-pdf",
  },
};

const faqItems = [
  {
    question: "Will the PDF look exactly like the web page?",
    answer:
      "No, and that is deliberate. The converter keeps the content — headings, paragraphs, lists, tables, code, links and images — and lays it out as a clean A4 document, without the site's colours, columns or menus. For an exact copy of how a page looks on screen, open it in your browser and use Print, then Save as PDF.",
  },
  {
    question: "Can I just enter a URL?",
    answer:
      "No. Browsers do not let one website read another site's pages, and fetching them through our server would mean your browsing goes through us. Instead, save the page (Ctrl+S or Cmd+S) and drop the .html file here, or select the text on the page, copy it and paste it into the box — the formatting comes with it.",
  },
  {
    question: "What does “Main content only” remove?",
    answer:
      "Navigation menus, site headers and footers, sidebars, forms, scripts and styles. When the page marks its main area with <main> or <article>, only that part is kept. Untick the option if something you need disappears.",
  },
  {
    question: "Why are some images missing?",
    answer:
      "Images with a relative path, like img/chart.png, point to files next to the HTML on the original site; attach them with “add images” and they are matched by file name. Images on other websites load only when that server allows it. Images that cannot be loaded are replaced by their description and listed.",
  },
  {
    question: "Is the text in the PDF selectable?",
    answer:
      "Yes. The PDF is built from real text and vector shapes, not a screenshot, so it can be searched, copied and read by screen readers, and stays sharp at any zoom.",
  },
  {
    question: "Is my HTML uploaded?",
    answer:
      "No. The HTML is parsed and the PDF is written in your browser. Scripts in the HTML are never run.",
  },
];

export default function HtmlToPdfPage() {
  const tool = getTool("html-to-pdf")!;
  return (
    <>
      <ToolJsonLd slug="html-to-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            HTML to PDF
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Drop an HTML file or paste a web page, and get a clean, readable PDF with real text — without the menus,
            sidebars and clutter. Free, and nothing is uploaded.
          </p>
          <div className="mt-10">
            <HtmlToPdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">A document, not a screenshot</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Printing a web page usually gives you the cookie banner, the menu, three sidebars and an article squeezed
            in the middle. This converter keeps what you came for: the article, documentation page, email template or
            report is turned into a plain, well-spaced document, with tables and code blocks that do not get cut off at
            the edge of the page.
          </p>
          <p>
            Under the hood it uses the same steps as two other tools on this site:{" "}
            <Link href="/html-to-markdown">HTML to Markdown</Link> pulls out the structure, and{" "}
            <Link href="/md-to-pdf">Markdown to PDF</Link> lays it out. Want to edit the text before it becomes a PDF?
            Convert to Markdown first, adjust it, then export.
          </p>
          <h3>Which approach to use</h3>
          <ul>
            <li>
              <strong>Readable copy of the content</strong> — to read later, archive, annotate or send: this tool.
            </li>
            <li>
              <strong>Exact look of the page</strong> — for a design review or a legal record of how it appeared: your
              browser&apos;s Print → Save as PDF.
            </li>
            <li>
              <strong>A whole e-book</strong> — use <Link href="/epub-to-pdf">EPUB to PDF</Link>, which follows the
              book&apos;s chapter order.
            </li>
          </ul>
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
          <li>The page&apos;s CSS layout, colours and fonts are not reproduced; the PDF uses a clean document style.</li>
          <li>A URL cannot be fetched — save the page or paste its content.</li>
          <li>Content drawn by JavaScript after the page loads is only included if it was in the saved or copied HTML.</li>
          <li>
            Arabic, Hebrew, Hindi, Thai, Chinese, Japanese and Korean text need <Link href="/md-to-pdf">Markdown to PDF</Link>&apos;s
            Save as PDF option; the tool tells you when that is the case.
          </li>
          <li>Emoji are left out of the PDF.</li>
        </ul>
      </section>

      <RelatedTools slug="html-to-pdf" />
      <ToolGuides slug="html-to-pdf" />
    </>
  );
}
