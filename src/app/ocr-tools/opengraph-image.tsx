import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Free OCR tools in seven languages";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "OCR tools, on your device",
    subtitle: "Scans, photos and screenshots in seven languages",
  });
}
