import { ImageResponse } from "next/og";
import { getAllPosts, getPost } from "@/lib/blog";

export const alt = "MarkdownPDF blog article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  const title = post?.title ?? "MarkdownPDF";

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
        <div style={{ display: "flex", fontSize: 60, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#fecaca" }}>
          Free, private PDF and Markdown conversion in your browser
        </div>
      </div>
    ),
    size,
  );
}
