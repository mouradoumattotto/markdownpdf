import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Convert a PDF to a reflowable EPUB e-book without uploading it";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PDF to EPUB",
    subtitle: "A reflowable e-book with chapters, made in your browser",
  });
}
