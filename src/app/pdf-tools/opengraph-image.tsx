import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Free PDF tools that run in your browser";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PDF tools, in your browser",
    subtitle: "Convert, split and build PDFs — nothing is ever uploaded",
  });
}
