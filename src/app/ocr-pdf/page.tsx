import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import OcrPdfTool from "@/components/OcrPdfTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { OCR_LANGUAGES } from "@/lib/ocr";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Make a scanned PDF searchable: OCR adds an invisible text layer so you can select, search and copy it. Free, in 7 languages, and your file is never uploaded.";

export const metadata: Metadata = {
  title: "OCR a PDF — Make Scans Searchable",
  description: DESCRIPTION,
  alternates: { canonical: "/ocr-pdf" },
  openGraph: {
    title: "OCR a PDF in your browser — scans become searchable",
    description: "Adds an invisible text layer to scanned pages. Seven languages, nothing uploaded.",
    url: "/ocr-pdf",
  },
};

const faqItems = [
  {
    question: "What does OCR do to my PDF?",
    answer:
      "It looks at each scanned page as an image, recognises the characters, and writes them into the PDF as an invisible text layer sitting exactly over the printed words. The page looks identical, but you can now select, search and copy the text — and so can any other software.",
  },
  {
    question: "Does it change how the document looks?",
    answer:
      "No. Pages that already contain text are copied from your original untouched, at full quality. Scanned pages keep the same image with the text layer added on top.",
  },
  {
    question: "Which languages are supported?",
    answer: `${OCR_LANGUAGES.map((l) => l.label).join(", ")}. Pick the language of the document before converting — recognition uses a language model, so the wrong choice measurably lowers accuracy, especially on accented text.`,
  },
  {
    question: "Searchable PDF or plain text — which do I want?",
    answer:
      "A searchable PDF when the document must stay a document: contracts, invoices, archives you need to keep as they are but be able to search. Plain text or Markdown when you want the content out of it, to edit, quote or feed to another tool.",
  },
  {
    question: "Why is the file bigger afterwards?",
    answer:
      "Recognised pages are rebuilt from the image the engine read, and the text layer adds its own data. The increase is usually modest. Pages that already had text add nothing, because they are copied as they were.",
  },
  {
    question: "Is anything uploaded?",
    answer:
      "No. The OCR engine, its language data and the PDF writer all run in your browser, and the engine is served from this site rather than a third-party CDN. Scanned documents are exactly the kind of file that should not be handed to a server.",
  },
];

export default function OcrPdfPage() {
  const tool = getTool("ocr-pdf")!;
  return (
    <>
      <ToolJsonLd slug="ocr-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute left-1/2 top-0 -z-10 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-violet-200/30 to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            OCR a PDF —{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              make scans searchable
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Turn a scanned PDF into one you can select, search and copy from. The pages look exactly the same — the
            recognised text sits invisibly on top. Seven languages, free, and nothing leaves your browser.
          </p>
          <div className="mt-10">
            <OcrPdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">A scan is a picture, not a document</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            When a page comes off a scanner, the PDF holds an image of it. To your eyes it is a document; to every
            piece of software it is a photograph. <code>Ctrl+F</code> finds nothing, no sentence can be selected, and
            an archive of a thousand such files is unsearchable.
          </p>
          <p>
            OCR closes that gap. It reads the picture, recognises the characters, and writes them back into the same
            PDF as an invisible layer aligned with the printed words. Nothing on the page moves; the document simply
            starts answering searches.
          </p>
          <h3>Mixed documents keep their quality</h3>
          <p>
            Most real files are mixed: a typed cover page, a scanned contract, a typed appendix. Pages that already
            contain text are copied from your original untouched — same vectors, same fonts, same file weight — and
            only the scanned ones are rebuilt. You never lose quality on a page that did not need OCR.
          </p>
          <h3>If you want the text out instead</h3>
          <p>
            This tool keeps the document and adds text to it. When you want the content itself — to quote, edit or
            hand to an AI tool — use <Link href="/pdf-to-text">PDF to Text</Link> for the words alone or{" "}
            <Link href="/">PDF to Markdown</Link> to keep headings and lists as well. Both run the same OCR on the
            same pages. To get the best out of any of them, the{" "}
            <Link href="/blog/extract-text-from-scanned-pdf">scanned PDF guide</Link> explains what actually improves
            accuracy, in order.
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
          <li>Handwriting is not recognised reliably — this engine is built for printed text.</li>
          <li>One language per document. A page mixing scripts will lose whichever is not selected.</li>
          <li>
            Recognised pages are rebuilt from the rendered image, so a scanned page comes back at the resolution the
            engine read (about 144 dpi), not the scanner&apos;s original.
          </li>
          <li>Large scanned documents take a few seconds per page; progress is shown and the job can be cancelled.</li>
          <li>Encrypted PDFs must be unlocked first.</li>
        </ul>
      </section>

      <RelatedTools slug="ocr-pdf" />
      <ToolGuides slug="ocr-pdf" />
    </>
  );
}
