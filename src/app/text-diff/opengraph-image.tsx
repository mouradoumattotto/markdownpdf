import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Compare two texts or documents";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Compare Text & Documents",
    subtitle: "What changed between two versions — text, PDF or Word",
  });
}
