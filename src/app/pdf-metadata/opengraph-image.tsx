import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "PDF metadata viewer and remover";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "See and remove PDF metadata",
    subtitle: "Info dictionary and XMP packet — cleaned in your browser",
  });
}
