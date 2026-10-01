import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Batch PDF to Markdown";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Batch PDF to Markdown",
    subtitle: "A whole folder of PDFs to Markdown in one ZIP, nothing uploaded",
  });
}
