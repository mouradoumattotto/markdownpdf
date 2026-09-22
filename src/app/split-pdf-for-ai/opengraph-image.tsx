import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Split a PDF for NotebookLM, ChatGPT and Claude";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Split a PDF for AI tools",
    subtitle: "Parts that fit NotebookLM, ChatGPT, Claude and Gemini — nothing uploaded",
  });
}
