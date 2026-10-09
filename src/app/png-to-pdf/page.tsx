import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import ImagesToPdfTool from "@/components/ImagesToPdfTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Combine PNG images and screenshots into one PDF, losslessly, in the order you choose. Paste from the clipboard. Free, and nothing is uploaded.";

export const metadata: Metadata = {
  title: "PNG to PDF — Lossless, Free, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/png-to-pdf" },
  openGraph: {
    title: "PNG to PDF, without uploading your screenshots",
    description: "Screenshots and PNG images into one PDF, pixel for pixel, in your browser.",
    url: "/png-to-pdf",
  },
};

const faqItems = [
  {
    question: "Will my screenshots stay sharp?",
    answer:
      "Yes. PNG is a lossless format, and the images are placed in the PDF without being turned into JPG, so small text and thin lines in a screenshot look exactly as they did. That is the main difference with converters that re-compress everything to save space.",
  },
  {
    question: "What happens to transparent areas?",
    answer:
      "The transparency is kept inside the PDF, and PDF pages are white, so a logo or an icon with a transparent background shows on white — as it would when printed.",
  },
  {
    question: "Which page size should I pick for screenshots?",
    answer:
      "“Same as each image”, the default here: every page takes the exact size of its screenshot, with no margins and no scaling, which is the best result for reading on screen. Choose A4 or US Letter when the PDF will be printed; each image is then centred and scaled down to fit.",
  },
  {
    question: "Can I paste a screenshot instead of saving it first?",
    answer:
      "Yes. Take the screenshot, come back to this page and press Ctrl+V (⌘V on a Mac). Each pasted image is added to the list with a numbered name, so you can paste several in a row and keep them in order.",
  },
  {
    question: "Can I mix PNG and JPG files?",
    answer:
      "Yes. JPG, WebP, GIF and BMP files can go in the same PDF. JPG photos are kept as they are too; WebP, GIF and BMP are converted first.",
  },
  {
    question: "Are my images uploaded?",
    answer:
      "No. The PDF is put together in your browser and saved straight to your device. Screenshots often show private messages, dashboards or account details, which is exactly why they should not travel to a server.",
  },
];

export default function PngToPdfPage() {
  const tool = getTool("png-to-pdf")!;
  return (
    <>
      <ToolJsonLd slug="png-to-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            PNG to{" "}
            PDF
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Turn screenshots, diagrams and PNG images into one PDF, one image per page, without losing a pixel. Paste
            them straight from the clipboard. Free, and nothing leaves your browser.
          </p>
          <div className="mt-10">
            <ImagesToPdfTool tool="png-to-pdf" defaultPageSize="fit" />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">Screenshots, as a document</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            A bug report with ten steps, a conversation someone asked you to keep, the screens of an app for a client
            review, a set of charts exported from a dashboard: as separate PNG files they get lost or shuffled. As one
            PDF they stay in order, open on any device and attach to a single email.
          </p>
          <p>
            Screenshots are mostly text and flat colour, which JPG compression smears. This tool keeps each PNG
            lossless, and by default sizes every page to its image, so the PDF looks like the screens you captured
            rather than pictures pasted onto paper.
          </p>
          <h3>Next steps</h3>
          <p>
            The text in a screenshot is pixels until it goes through OCR: run the PDF through{" "}
            <Link href="/ocr-pdf">OCR a PDF</Link> to make it searchable, or read a single image with{" "}
            <Link href="/image-to-text">Image to Text</Link>. Something in a screenshot that should not be shared?{" "}
            <Link href="/redact-pdf">Redact PDF</Link> blacks it out for good. Going the other way,{" "}
            <Link href="/pdf-to-png">PDF to PNG</Link> turns PDF pages into PNG images.
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
          <li>Up to 100 images per PDF.</li>
          <li>Lossless means larger: a PDF of PNG screenshots weighs about as much as the PNG files together.</li>
          <li>HEIC and TIFF files are not supported by most browsers; export them as PNG or JPG first.</li>
          <li>The PDF is not searchable until it has been through OCR.</li>
        </ul>
      </section>

      <RelatedTools slug="png-to-pdf" />
      <ToolGuides slug="png-to-pdf" />
    </>
  );
}
