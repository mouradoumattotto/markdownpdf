import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Convert PDF to JPG or PNG without uploading";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PDF to JPG",
    subtitle: "Every page as an image, at the resolution you choose — in your browser",
  });
}
