import { ImageResponse } from "next/og";

export const alt = "MarkdownPDF — Free PDF to Markdown & Markdown to PDF Converter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #18181b 0%, #3f1512 55%, #c4281c 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.3)",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            MD
          </div>
          MarkdownPDF
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 36,
            color: "#e0e7ff",
            display: "flex",
          }}
        >
          Free PDF to Markdown converter — private, instant, with OCR
        </div>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            gap: 16,
            fontSize: 24,
            color: "#fecaca",
          }}
        >
          <div style={{ display: "flex", padding: "10px 24px", borderRadius: 999, background: "rgba(255,255,255,0.12)" }}>
            No uploads
          </div>
          <div style={{ display: "flex", padding: "10px 24px", borderRadius: 999, background: "rgba(255,255,255,0.12)" }}>
            No sign-up
          </div>
          <div style={{ display: "flex", padding: "10px 24px", borderRadius: 999, background: "rgba(255,255,255,0.12)" }}>
            No watermark
          </div>
        </div>
      </div>
    ),
    size,
  );
}
