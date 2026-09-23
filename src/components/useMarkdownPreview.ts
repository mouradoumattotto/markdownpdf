"use client";

import { useEffect, useState, type RefObject } from "react";
import type { DocFeatures } from "@/lib/markdown-render";
import type { HydrateResult, ImageAssets } from "@/lib/markdown-rich";

/**
 * Live Markdown preview into `previewRef`: parse, sanitize, then hydrate math,
 * diagrams, highlighted code and local images. Debounced so typing stays
 * smooth; the heavy libraries load only when the document uses them.
 * Shared by Markdown to PDF and the Markdown editor, so both show the same thing.
 */
export function useMarkdownPreview(
  markdown: string,
  features: DocFeatures,
  assets: ImageAssets,
  previewRef: RefObject<HTMLElement | null>,
  delayMs = 250,
): HydrateResult | null {
  const [hydrate, setHydrate] = useState<HydrateResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const [{ createMarked }, { default: DOMPurify }] = await Promise.all([
        import("@/lib/markdown-render"),
        import("dompurify"),
      ]);
      const needsRich = features.code > 0 || features.math > 0 || features.mermaid > 0 || features.images > 0;
      const rich = needsRich ? await import("@/lib/markdown-rich") : null;
      const highlight = rich && features.code > 0 ? await rich.loadHighlighter(rich.codeLanguages(markdown)) : null;
      const html = DOMPurify.sanitize(await createMarked(highlight).parse(markdown));
      if (cancelled || !previewRef.current) return;
      previewRef.current.innerHTML = html;
      if (rich) {
        const result = await rich.hydrateRichContent(previewRef.current, assets);
        // Diagram and math SVGs come from libraries, not the user: still, run
        // them through the sanitizer's SVG profile before they stay in the page.
        previewRef.current?.querySelectorAll<HTMLElement>(".mermaid-block, .math-inline, .math-display").forEach((el) => {
          if (el.querySelector("svg")) el.innerHTML = DOMPurify.sanitize(el.innerHTML, { USE_PROFILES: { svg: true, svgFilters: true } });
        });
        if (!cancelled) setHydrate(result);
      } else if (!cancelled) setHydrate(null);
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [markdown, assets, features, previewRef, delayMs]);

  return hydrate;
}
