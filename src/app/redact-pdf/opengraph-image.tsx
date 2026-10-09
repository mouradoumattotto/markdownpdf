import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Redact a PDF for good, without uploading it";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Redact PDF",
    subtitle: "Black out text for good — nothing left underneath, nothing uploaded",
  });
}
