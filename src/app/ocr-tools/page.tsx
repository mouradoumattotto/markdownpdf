import type { Metadata } from "next";
import Link from "next/link";
import HubPage from "@/components/HubPage";
import { OCR_LANGUAGES } from "@/lib/ocr";

export const metadata: Metadata = {
  title: "Free OCR Tools — 7 Languages, No Upload",
  description:
    "Free OCR that runs on your own device: read scanned PDFs, photos and screenshots in English, French, Spanish, German, Portuguese, Italian and Arabic.",
  alternates: { canonical: "/ocr-tools" },
  openGraph: {
    title: "OCR tools that never upload your documents",
    description: "Scanned PDFs, photos and screenshots turned into text, in seven languages, in your browser.",
    url: "/ocr-tools",
  },
};

export default function OcrToolsPage() {
  return (
    <HubPage
      category="ocr"
      heading="OCR that runs on your device, in seven languages"
      lead={
        <>
          Optical character recognition turns a picture of text into text you can select, search and edit. Here it
          runs inside your browser: the engine and its language data are downloaded from this site, and your scan is
          read on your own machine. Available in {OCR_LANGUAGES.map((l) => l.label).join(", ")}.
        </>
      }
      guides={["extract-text-from-scanned-pdf", "how-to-convert-pdf-to-markdown", "convert-research-paper-pdf-to-markdown"]}
    >
      <h2>Which one do you need?</h2>
      <ul>
        <li>
          <strong>Keep the document, make it searchable.</strong> <Link href="/ocr-pdf">OCR a PDF</Link> adds an
          invisible text layer to scanned pages, leaving the pages themselves untouched — the right choice for
          contracts, invoices and archives.
        </li>
        <li>
          <strong>Get the text out.</strong> <Link href="/pdf-to-text">PDF to Text</Link> for the words alone,{" "}
          <Link href="/">PDF to Markdown</Link> when headings and lists matter too. Both OCR scanned pages
          automatically.
        </li>
        <li>
          <strong>A photo or a screenshot.</strong> <Link href="/image-to-text">Image to Text</Link> reads single
          images, or a batch of them, and accepts a paste from the clipboard.
        </li>
      </ul>
      <h2>Accuracy comes from the scan, not the engine</h2>
      <p>
        The same tool can produce a perfect transcript or a mess, depending on the input: resolution, contrast,
        skew and the language you select. Around 300 dpi, upright, high-contrast pages are the easy case. The{" "}
        <Link href="/blog/extract-text-from-scanned-pdf">guide to scanned PDFs</Link> covers what to fix first, and
        the error patterns worth proofreading for — numbers especially, since a wrong digit is invisible to a
        spellchecker.
      </p>
    </HubPage>
  );
}
