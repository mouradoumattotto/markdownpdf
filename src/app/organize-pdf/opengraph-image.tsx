import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Organize PDF pages without uploading";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Organize PDF",
    subtitle: "Reorder, rotate and delete pages — in your browser",
  });
}
