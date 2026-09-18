import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "How MarkdownPDF works — local processing, no uploads";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "How it works: nothing is uploaded",
    subtitle: "Local processing you can verify yourself",
  });
}
