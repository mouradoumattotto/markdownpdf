import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import ImageToTextTool from "@/components/ImageToTextTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { OCR_LANGUAGES } from "@/lib/ocr";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Extract text from an image or a screenshot with OCR in 7 languages, including Arabic. Free, instant, and the picture never leaves your browser.";

export const metadata: Metadata = {
  title: "Image to Text (OCR) — Free, No Upload",
  description: DESCRIPTION,
  alternates: { canonical: "/image-to-text" },
  openGraph: {
    title: "Image to text with OCR — nothing uploaded",
    description: "Drop a photo or paste a screenshot and get the text, in seven languages.",
    url: "/image-to-text",
  },
};

const faqItems = [
  {
    question: "Which image formats can I use?",
    answer:
      "PNG, JPEG, WebP, GIF, BMP and TIFF. You can also paste a screenshot straight from the clipboard with Ctrl+V — usually faster than saving it first.",
  },
  {
    question: "Which languages does it read?",
    answer: `${OCR_LANGUAGES.map((l) => l.label).join(", ")}. Choose the language before dropping the image: recognition leans on a language model, so the right choice matters, particularly for accented or Arabic text.`,
  },
  {
    question: "Is my image uploaded?",
    answer:
      "No. The OCR engine runs in your browser and is served from this site, not a third-party CDN. The picture stays on your device — which matters for screenshots of private conversations, ID documents or medical results.",
  },
  {
    question: "Can it read handwriting?",
    answer:
      "Not reliably. This engine is trained on printed text. Neat block capitals sometimes come through; ordinary handwriting does not. Recognising handwriting is a different technology altogether.",
  },
  {
    question: "The text came out wrong — what should I change?",
    answer:
      "Almost always the picture rather than the settings: get the text upright and filling the frame, avoid shadows and glare, and prefer a sharp photo over a zoomed-in crop. Then check the language selector. Tiny text in a low-resolution screenshot is the hardest case.",
  },
  {
    question: "Can I read several images at once?",
    answer:
      "Yes — drop up to 20. They are processed one after another and the results are concatenated with each file name as a separator, so you can tell which text came from which image.",
  },
];

export default function ImageToTextPage() {
  const tool = getTool("image-to-text")!;
  return (
    <>
      <ToolJsonLd slug="image-to-text" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Image to Text{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              (OCR)
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Get the text out of a photo, a screenshot or a scan. Seven languages including Arabic, free, and the
            image never leaves your browser — paste it with Ctrl+V if it is already in your clipboard.
          </p>
          <div className="mt-10">
            <ImageToTextTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Why do this locally?</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            Think about what people actually run through an image-to-text tool: a screenshot of a conversation, a
            photograph of a prescription, an ID card, a bank statement, a page of a book they do not own the rights
            to. Every online OCR service receives a copy of that picture. Here the recognition engine is downloaded
            into your browser and the image is read on your own machine — see{" "}
            <Link href="/how-it-works">how it works</Link> for the two checks that prove it.
          </p>
          <h3>Getting good results</h3>
          <p>
            OCR quality depends far more on the picture than on the engine. Hold the text upright and parallel, fill
            the frame, use even light, and avoid the shadow of your own phone. A flat scan at 300 dpi beats a photo
            every time. The full checklist, including the error patterns worth proofreading for, is in the{" "}
            <Link href="/blog/extract-text-from-scanned-pdf">guide to extracting text from scans</Link>.
          </p>
          <h3>Whole documents</h3>
          <p>
            For a multi-page PDF, use <Link href="/ocr-pdf">OCR a PDF</Link> to keep the document and make it
            searchable, or <Link href="/">PDF to Markdown</Link> to pull the content out with its headings and lists
            intact.
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
          <li>Printed text only — handwriting is not reliably recognised.</li>
          <li>One language at a time; a bilingual image will lose whichever language is not selected.</li>
          <li>Layout is not preserved: columns and tables come back as lines of text.</li>
          <li>Very low-resolution or heavily compressed screenshots give poor results whatever the settings.</li>
        </ul>
      </section>

      <RelatedTools slug="image-to-text" />
      <ToolGuides slug="image-to-text" />
    </>
  );
}
