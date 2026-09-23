import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Merge PDF files without uploading them";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Merge PDF",
    subtitle: "Combine PDFs in the order you choose — in your browser",
  });
}
