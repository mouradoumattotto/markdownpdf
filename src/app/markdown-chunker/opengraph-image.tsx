import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Markdown chunker for RAG";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Markdown Chunker for RAG",
    subtitle: "Token-sized chunks that respect headings and code blocks",
  });
}
