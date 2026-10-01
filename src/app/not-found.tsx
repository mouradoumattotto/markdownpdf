import type { Metadata } from "next";
import Link from "next/link";
import { ToolGrid, hubLinks } from "@/components/ToolSeo";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

// A 404 that gets people to a tool instead of a dead end. No ads here: an
// error screen is not publisher content.
export default function NotFound() {
  const hubs = hubLinks();
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-neutral-900 sm:text-4xl">
        This page does not exist
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-neutral-600">
        The link may be old, or the page may have moved. Every tool on MarkdownPDF is listed below
        — they all run in your browser, and your files never leave your device.
      </p>
      <div className="mt-10">
        <ToolGrid tools={TOOLS} />
      </div>
      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {hubs.map((h) => (
          <Link key={h.href} href={h.href} className="font-medium text-indigo-600 hover:underline">
            All {h.label.toLowerCase()} →
          </Link>
        ))}
        <Link href="/blog" className="font-medium text-indigo-600 hover:underline">
          Guides →
        </Link>
        <Link href="/" className="font-medium text-indigo-600 hover:underline">
          Home →
        </Link>
      </div>
    </div>
  );
}
