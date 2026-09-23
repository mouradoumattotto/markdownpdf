import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Free Markdown tools";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Markdown tools",
    subtitle: "Word, HTML and PDF to and from Markdown — in your browser",
  });
}
