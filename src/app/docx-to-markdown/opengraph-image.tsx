import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Word to Markdown converter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Word to Markdown",
    subtitle: "Headings, lists, tables and images from a .docx — nothing uploaded",
  });
}
