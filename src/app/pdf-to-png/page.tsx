import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import PdfToImagesTool from "@/components/PdfToImagesTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Convert PDF pages to lossless PNG images at 72, 150 or 300 dpi, all pages or a selection, as a ZIP. Free, and the PDF never leaves your browser.";

export const metadata: Metadata = {
  title: "PDF to PNG — Lossless, High-Res, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/pdf-to-png" },
  openGraph: {
    title: "PDF to PNG, without uploading the PDF",
    description: "Every page as a lossless PNG, at the resolution you choose, rendered in your browser.",
    url: "/pdf-to-png",
  },
};

const faqItems = [
  {
    question: "Why PNG rather than JPG?",
    answer:
      "PNG is lossless: the edges of letters, the lines of a chart and flat areas of colour come out exactly as rendered, with none of the blur and halos JPG adds around sharp edges. That makes it the right format for slides, diagrams, documentation and anything you will zoom into. The price is size — a page of text can be several times larger as PNG.",
  },
  {
    question: "What resolution should I choose?",
    answer:
      "150 dpi for screens, slides and documentation: an A4 page comes out about 1240 × 1754 pixels. 300 dpi for print or for cropping a detail out of a page later, at four times the pixels. 72 dpi for thumbnails.",
  },
  {
    question: "Are the PNGs transparent?",
    answer:
      "No. Pages are rendered on white, as a PDF viewer shows them, so a page looks the same in any app. If you need a logo with a transparent background, export it from the original design file instead.",
  },
  {
    question: "Can I convert only some pages?",
    answer:
      "Yes. Untick “All pages” and type the pages you want, such as “2, 5-7”. Each page becomes its own PNG; when there are several, “Download all” saves them in one ZIP, numbered in page order.",
  },
  {
    question: "Is my PDF uploaded?",
    answer:
      "No. The pages are drawn by pdf.js, the PDF engine of Firefox, running in your browser tab, and the images are saved straight to your device.",
  },
  {
    question: "I need the text, not a picture of it",
    answer:
      "Then an image is the wrong output: use PDF to Markdown or PDF to Text, which keep the words editable and searchable.",
  },
];

export default function PdfToPngPage() {
  const tool = getTool("pdf-to-png")!;
  return (
    <>
      <ToolJsonLd slug="pdf-to-png" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            PDF to{" "}
            PNG
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Turn PDF pages into lossless PNG images with crisp text and sharp lines, at screen or print resolution.
            Free, and the PDF never leaves your browser.
          </p>
          <div className="mt-10">
            <PdfToImagesTool tool="pdf-to-png" defaultFormat="png" />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">For pages that are mostly text and lines</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            A diagram for a wiki page, a chart for a slide, a page of a paper quoted in a presentation, a form shown in
            a tutorial: these are text and thin lines on flat backgrounds, which is what JPG handles worst. Rendered as
            PNG they stay as sharp as in the PDF viewer, at any zoom the resolution allows.
          </p>
          <p>
            Each page is rendered with its fonts, vector graphics and embedded images, on white, at the resolution you
            pick. Choose the pages, convert, and download them one by one or all together.
          </p>
          <h3>Photos and scans</h3>
          <p>
            For scanned documents and pages full of photographs, <Link href="/pdf-to-jpg">PDF to JPG</Link> gives
            files several times smaller with no visible difference. To go the other way and put images into a PDF,
            use <Link href="/png-to-pdf">PNG to PDF</Link>.
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
        <h2 className="text-xl font-extrabold text-neutral-900">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>
            Password-protected PDFs must be unlocked first, with <Link href="/unlock-pdf" className="text-indigo-600 underline">Unlock PDF</Link>.
          </li>
          <li>Very large pages (posters, plans) are rendered at a reduced resolution to stay within browser limits; the tool tells you when that happens.</li>
          <li>PNG files of whole pages are large: hundreds of pages at 300 dpi need a capable device and some disk space.</li>
          <li>No transparency: pages are rendered on white.</li>
        </ul>
      </section>

      <RelatedTools slug="pdf-to-png" />
      <ToolGuides slug="pdf-to-png" />
    </>
  );
}
