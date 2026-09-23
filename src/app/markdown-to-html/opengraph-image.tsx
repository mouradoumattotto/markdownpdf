import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Markdown to HTML converter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Markdown to HTML",
    subtitle: "Sanitised HTML with a live preview, in your browser",
  });
}
