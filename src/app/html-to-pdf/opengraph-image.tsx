import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Convert an HTML file or web page content to PDF";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "HTML to PDF",
    subtitle: "An HTML file or pasted page as a clean PDF — in your browser",
  });
}
