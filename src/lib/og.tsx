import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Shared Open Graph card for the non-article routes. `/` and `/blog/[slug]` keep
 * their own bespoke layouts; this covers the segments that had no og:image at
 * all (measured on the served HTML, 2026-09-17: `/blog` and `/markdown-to-pdf`
 * shipped og:title and og:description but no image, so every share of those two
 * URLs rendered as a bare text link).
 */
export function renderOgCard({ title, subtitle }: { title: string; subtitle: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #18181b 0%, #3f1512 55%, #c4281c 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 700 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.3)",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            MD
          </div>
          MarkdownPDF
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#fecaca" }}>{subtitle}</div>
      </div>
    ),
    OG_SIZE,
  );
}
