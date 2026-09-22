import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "PDF to Text converter with OCR";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PDF to Text, with OCR",
    subtitle: "Plain text from any PDF — scanned pages included, nothing uploaded",
  });
}
