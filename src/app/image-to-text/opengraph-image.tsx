import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Image to text with OCR";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Image to text, with OCR",
    subtitle: "Photos and screenshots in seven languages — nothing uploaded",
  });
}
