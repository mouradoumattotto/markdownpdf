import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "PDF to Obsidian";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PDF to Obsidian",
    subtitle: "A PDF as an Obsidian note, with properties and embedded images",
  });
}
