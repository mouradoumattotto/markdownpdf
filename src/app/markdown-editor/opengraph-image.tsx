import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Online Markdown editor with live preview";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Markdown Editor",
    subtitle: "Live preview, autosave in your browser, export to PDF, Word, HTML",
  });
}
