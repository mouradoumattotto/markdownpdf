import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import ImagesToPdfTool from "@/components/ImagesToPdfTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Combine JPG, PNG and other images into one PDF, in the order you choose. A4, Letter or image-sized pages. Free, and the images never leave your browser.";

export const metadata: Metadata = {
  title: "JPG to PDF — Combine Images, Free, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/jpg-to-pdf" },
  openGraph: {
    title: "JPG to PDF, without uploading your images",
    description: "Photos, scans and screenshots into one PDF, in your browser.",
    url: "/jpg-to-pdf",
  },
};

const faqItems = [
  {
    question: "Which image formats can I use?",
    answer:
      "JPG, PNG, WebP, GIF and BMP — you can mix them in one PDF. JPG and PNG files are placed in the PDF as they are; other formats are converted first. Only the first frame of an animated GIF is used.",
  },
  {
    question: "Will my photos lose quality?",
    answer:
      "JPGs are embedded in the PDF without being re-compressed, so they keep their exact quality and the PDF is about the size of the photos combined. The exception is a photo stored sideways with a rotation tag, as phones do: it is redrawn upright first, at high quality, so it does not appear rotated in the PDF.",
  },
  {
    question: "Which page size should I pick?",
    answer:
      "A4 or US Letter when the PDF will be printed or sent as a document: each image is centred and scaled down to fit, and the page turns to landscape for wide images when orientation is automatic. “Same as each image” makes every page exactly the size of its picture — best for screenshots and for viewing on screen.",
  },
  {
    question: "How do I change the order of pages?",
    answer:
      "Drag an image up or down the list, use its arrow buttons, or sort by file name — numbers are understood, so photo-2 comes before photo-10.",
  },
  {
    question: "Are my images uploaded?",
    answer:
      "No. The PDF is assembled in your browser and saved directly to your device — which matters for photos of IDs, receipts and signed documents.",
  },
  {
    question: "Can the PDF be searched?",
    answer:
      "Not straight away: its pages are pictures. Run the result through OCR a PDF to add an invisible text layer, so you can search and copy the text.",
  },
];

export default function JpgToPdfPage() {
  const tool = getTool("jpg-to-pdf")!;
  return (
    <>
      <ToolJsonLd slug="jpg-to-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            JPG to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">PDF</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Put photos, scans and screenshots into one PDF, one image per page, in the order you choose. Free, no
            quality loss, and the images never leave your browser.
          </p>
          <div className="mt-10">
            <ImagesToPdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">From a pile of photos to one document</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Expense receipts for an accountant, pages of a contract photographed on a phone, screenshots for a bug
            report, the scans an administration asks for as “a single PDF”: the job is always the same. Drop the
            images, put them in order, pick a page size, download.
          </p>
          <h3>Make it searchable</h3>
          <p>
            Photos of documents are just pictures, so the PDF cannot be searched yet. Run it through{" "}
            <Link href="/ocr-pdf">OCR a PDF</Link> to add an invisible text layer, or pull the text straight out with{" "}
            <Link href="/image-to-text">Image to Text</Link>. Already have PDFs to add to the result?{" "}
            <Link href="/merge-pdf">Merge PDF</Link> combines them.
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
        <h2 className="text-xl font-bold text-neutral-900">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-600">
          <li>Up to 100 images per PDF.</li>
          <li>HEIC photos from iPhones and TIFF files are not supported by most browsers; export them as JPG first.</li>
          <li>Images are scaled down to fit the page, never enlarged, so small images stay small.</li>
          <li>The PDF is not searchable until it has been through OCR.</li>
        </ul>
      </section>

      <RelatedTools slug="jpg-to-pdf" />
      <ToolGuides slug="jpg-to-pdf" />
    </>
  );
}
