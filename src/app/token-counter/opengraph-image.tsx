import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Token counter for GPT and other models";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Token Counter",
    subtitle: "Exact OpenAI token counts for text, PDFs and Word files",
  });
}
