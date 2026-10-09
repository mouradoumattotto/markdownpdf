import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Faq from "@/components/Faq";
import RedactPdfTool from "@/components/RedactPdfTool";
import { Breadcrumbs, RelatedTools, ToolGuides, ToolJsonLd, toolCrumbs } from "@/components/ToolSeo";
import { getTool } from "@/lib/tools";

const DESCRIPTION =
  "Redact a PDF for real: find names, emails or numbers, or draw boxes, and the text underneath is destroyed, not hidden. Free, and the PDF is never uploaded.";

export const metadata: Metadata = {
  title: "Redact PDF — Black Out Text Permanently, Free",
  description: DESCRIPTION,
  alternates: { canonical: "/redact-pdf" },
  openGraph: {
    title: "Redact PDF, with nothing left underneath",
    description: "Search or draw, then flatten: redacted text cannot be copied back. In your browser.",
    url: "/redact-pdf",
  },
};

const faqItems = [
  {
    question: "Why not just draw black rectangles in a PDF editor?",
    answer:
      "Because in most editors the rectangle is a shape laid on top of the page, and the text is still underneath. Select the area, copy, paste into a text editor, and the “redacted” name reappears — this is how several court filings and government reports have leaked. Here every page with a box is re-rendered as an image with the boxes painted in, and that image replaces the page. The text, fonts and drawings of that page are not in the output at all.",
  },
  {
    question: "What does the search find?",
    answer:
      "Any text you type (optionally matching case or whole words only), every email address, every phone number with 7 to 15 digits, or anything a regular expression describes. Each match is marked with a box you can check before saving; click a box to remove it if it was a false match. The search reads the PDF’s text layer, so it finds words even when they are split across lines of the internal file structure.",
  },
  {
    question: "My PDF is a scan and the search finds nothing.",
    answer:
      "A scan is a picture of text, not text, so there is nothing to search. Draw boxes by hand over what must go, or first run the file through OCR a PDF to add a text layer, then search it here. Either way the redacted pages are flattened, so the OCR text under a box disappears with it.",
  },
  {
    question: "Does it remove anything besides the boxed areas?",
    answer:
      "Yes, on purpose. The document is rebuilt from scratch, so its title, author and other metadata, its XMP packet, bookmarks, attachments and form structure are not carried over. Pages without boxes are copied unchanged and keep their selectable text, links and annotations.",
  },
  {
    question: "Why can I no longer select text on the redacted pages?",
    answer:
      "Because those pages are now images — that is what makes the redaction permanent. If you need them searchable again, use the “Continue with OCR a PDF” button after saving: OCR reads the visible text back, and the blacked-out parts stay black because there is nothing left to read.",
  },
  {
    question: "Is my PDF uploaded?",
    answer:
      "No. The search, the rendering and the rebuilt PDF all happen in your browser, and the result is saved straight to your device. For contracts, medical records, HR files and court documents, that matters as much as the redaction itself.",
  },
];

export default function RedactPdfPage() {
  const tool = getTool("redact-pdf")!;
  return (
    <>
      <ToolJsonLd slug="redact-pdf" description={DESCRIPTION} />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8">
          <Breadcrumbs crumbs={toolCrumbs(tool)} />
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-5xl">
            Redact PDF
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-600">
            Find names, emails and numbers, or draw over anything else, and black it out for good: the text underneath is
            destroyed, not covered. Free, and the PDF never leaves your browser.
          </p>
          <div className="mt-10">
            <RedactPdfTool />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-900">Covered is not removed</h2>
        <div className="prose prose-neutral mt-4 max-w-none prose-a:text-indigo-600">
          <p>
            The classic redaction failure is a black box that only looks like one. The PDF still holds the words, and
            anyone can copy them out, search for them, or delete the box. This tool works the other way round: each page
            you mark is turned into pixels, the boxes are painted onto those pixels, and the page is rebuilt from that
            image alone. What was under a box no longer exists in the file.
          </p>
          <h3>How to redact a PDF</h3>
          <ol>
            <li>Drop the PDF. Every page is shown at a readable size.</li>
            <li>
              Use <strong>Mark all matches</strong> for a name, an account number, every email address or every phone
              number. Draw boxes by hand over signatures, photos, stamps or anything the search cannot see.
            </li>
            <li>Check the boxes, click any you do not want, then <strong>Redact and save</strong>.</li>
          </ol>
          <h3>Before you send it</h3>
          <p>
            Redaction handles what is on the page. Metadata can give a document away too — the author’s name, the
            software, the original title — and the rebuilt file leaves all of it behind; check it with the{" "}
            <Link href="/pdf-metadata">PDF metadata viewer</Link> if you want to be sure. If the file is locked,{" "}
            <Link href="/unlock-pdf">Unlock PDF</Link> first. To make the redacted pages searchable again, run the result
            through <Link href="/ocr-pdf">OCR a PDF</Link>.
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
          <li>Redacted pages become images: their text can no longer be selected or searched until you run OCR.</li>
          <li>The file grows, since each redacted page is stored as an image — about 0.2–1 MB per page at 200 dpi.</li>
          <li>Search needs a text layer. On scanned pages, draw the boxes or run OCR first.</li>
          <li>Box positions for search matches are estimated from the text layout and padded slightly; check them before saving.</li>
          <li>Password-protected PDFs must be unlocked first.</li>
        </ul>
      </section>

      <RelatedTools slug="redact-pdf" />
      <ToolGuides slug="redact-pdf" />
    </>
  );
}
