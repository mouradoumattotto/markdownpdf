import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Convert an EPUB e-book to PDF without uploading it";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "EPUB to PDF",
    subtitle: "A DRM-free e-book as a clean, printable PDF — in your browser",
  });
}
