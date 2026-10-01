import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import PdfToImagesTool from "@/components/PdfToImagesTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Convert PDF pages to JPG or PNG images at 72, 150 or 300 dpi — all pages or a selection. Free, no upload: the PDF is rendered in your browser.";

export const metadata: Metadata = {
  title: "PDF to JPG (or PNG) — Free, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/pdf-to-jpg" },
  openGraph: {
    title: "PDF to JPG or PNG, without uploading the PDF",
    description: "Every page as an image, at the resolution you choose, rendered in your browser.",
    url: "/pdf-to-jpg",
  },
};

const faqItems = [
  {
    question: "JPG or PNG — which should I choose?",
    answer:
      "JPG for scanned documents and pages with photos: files are several times smaller and the difference is invisible. PNG for pages of text, charts, diagrams and screenshots: it is lossless, so edges stay crisp, at the cost of larger files.",
  },
  {
    question: "What resolution do I need?",
    answer:
      "150 dpi is sharp on any screen and right for slides, websites and messages. 300 dpi is print quality, and four times the pixels. 72 dpi gives small thumbnails. An A4 page at 150 dpi is about 1240 × 1754 pixels; at 300 dpi, about 2480 × 3508.",
  },
  {
    question: "Can I convert only some pages?",
    answer:
      "Yes. Untick “All pages” and type the pages you want, such as “1-3, 7”. Each page becomes its own image; several images download together as a ZIP.",
  },
  {
    question: "Is my PDF uploaded?",
    answer:
      "No. The pages are drawn by the same PDF engine Firefox uses, running in your browser, and the images are saved straight to your device.",
  },
  {
    question: "Why is the text in the image not selectable?",
    answer:
      "Because an image is pixels. If you need the words, use PDF to Text or PDF to Markdown instead; if you need to read text in an image you already have, Image to Text runs OCR on it.",
  },
];

export default function PdfToJpgPage() {
  const tool = getTool("pdf-to-jpg")!;
  return (
    <>
      <ToolJsonLd slug="pdf-to-jpg" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            PDF to{" "}
            JPG
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Turn every page of a PDF — or just the ones you pick — into JPG or PNG images, at screen or print
            resolution. Free, and the PDF never leaves your browser.
          </p>
          <div className="mt-10">
            <PdfToImagesTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">When a page works better as an image</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Slides and social posts accept images, not PDFs. A chat app shows an image inline while a PDF is an
            attachment nobody opens. A web page loads a picture of one chart faster than a whole document. And some
            forms only take JPG uploads. Converting the page is the quick way through all of these.
          </p>
          <p>
            The pages are rendered at the resolution you choose, on a white background, exactly as a PDF viewer
            would show them — fonts, vector graphics and embedded images included.
          </p>
          <h3>The other direction</h3>
          <p>
            To put images <em>into</em> a PDF — photos of receipts, scanned pages, screenshots — use{" "}
            <Link href="/jpg-to-pdf">JPG to PDF</Link>. To keep a scanned PDF as a PDF but make its text searchable,
            use <Link href="/ocr-pdf">OCR a PDF</Link>.
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
          <li>Password-protected PDFs must be unlocked first.</li>
          <li>Very large pages (posters, plans) are rendered at a reduced resolution to stay within browser limits; the tool tells you when that happens.</li>
          <li>All images are kept in memory until you download them, so hundreds of pages at 300 dpi need a capable device.</li>
          <li>Transparency is not kept: pages are rendered on white.</li>
        </ul>
      </section>

      <RelatedTools slug="pdf-to-jpg" />
      <ToolGuides slug="pdf-to-jpg" />
    </>
  );
}
