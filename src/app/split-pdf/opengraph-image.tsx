import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Split a PDF online, without uploading it";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Split PDF",
    subtitle: "By ranges, every N pages, or extract pages — in your browser",
  });
}
