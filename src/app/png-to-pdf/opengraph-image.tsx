import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Convert PNG images and screenshots to PDF without uploading";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PNG to PDF",
    subtitle: "Screenshots into one PDF, pixel for pixel — in your browser",
  });
}
