import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Convert PDF pages to PNG images without uploading";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PDF to PNG",
    subtitle: "Lossless page images with crisp text — rendered in your browser",
  });
}
