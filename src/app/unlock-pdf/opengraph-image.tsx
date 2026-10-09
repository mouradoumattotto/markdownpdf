import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Remove the password from a PDF without uploading it";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Unlock PDF",
    subtitle: "Remove the password and restrictions — in your browser",
  });
}
