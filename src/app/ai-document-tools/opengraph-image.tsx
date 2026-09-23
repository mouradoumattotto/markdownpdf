import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "AI document tools";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "AI document tools",
    subtitle: "Get documents ready for ChatGPT, Claude, NotebookLM and RAG",
  });
}
