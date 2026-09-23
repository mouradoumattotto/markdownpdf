import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Markdown table generator";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Markdown Table Generator",
    subtitle: "Edit in a grid, or convert CSV and spreadsheet cells",
  });
}
