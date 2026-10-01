"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * "Run it live": opens the converter with the sample loaded. On the converter
 * page itself it starts the run in place instead of reloading the page.
 */
export default function SampleRunLink({ slug, className, children }: { slug: string; className?: string; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <Link
      href={`/?sample=${slug}#converter`}
      className={className}
      onClick={(e) => {
        if (pathname !== "/") return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("mdpdf:sample", { detail: slug }));
        document.getElementById("converter")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {children}
    </Link>
  );
}
