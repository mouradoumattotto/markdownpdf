import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "MarkdownPDF blog — guides on PDF, Markdown, OCR and document conversion";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PDF & Markdown guides",
    subtitle: "Conversion, OCR, and document workflows that actually work",
  });
}
