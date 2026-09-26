import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Markdown to PDF Converter — free, no watermark, real selectable text";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Markdown to PDF Converter",
    subtitle: "Free, no watermark, real selectable text — entirely in your browser",
  });
}
