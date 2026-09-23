import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Convert JPG images to PDF without uploading";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "JPG to PDF",
    subtitle: "Photos, scans and screenshots into one PDF — in your browser",
  });
}
