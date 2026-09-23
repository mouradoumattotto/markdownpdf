import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Convert Markdown to Word without uploading";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Markdown to Word",
    subtitle: "A real .docx with heading styles, lists and tables — in your browser",
  });
}
