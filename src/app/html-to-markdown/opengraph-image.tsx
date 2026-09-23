import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "HTML to Markdown converter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "HTML to Markdown",
    subtitle: "Paste a web page, a Google Doc or raw HTML — get clean Markdown",
  });
}
