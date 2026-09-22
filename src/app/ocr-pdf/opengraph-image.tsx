import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "OCR a PDF — make scans searchable";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Make a scanned PDF searchable",
    subtitle: "OCR in seven languages, entirely in your browser",
  });
}
