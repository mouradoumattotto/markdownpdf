import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "PDF tables to CSV";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PDF tables to CSV",
    subtitle: "Every table in a PDF as a CSV file — detected in your browser",
  });
}
