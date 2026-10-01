"use client";

import { useEffect, useRef, useState } from "react";
import type { PdfDocument } from "@/lib/pdfjs";

/**
 * The original PDF, page by page, beside the converted output — so a reader
 * can check the Markdown against the source. Pages are painted to a canvas
 * only when they scroll near the viewport: a 300-page file costs nothing until
 * someone looks at it. Flagged pages (scanned → OCR) carry a badge.
 */
export default function PdfPagesView({
  file,
  flagged = [],
  className = "",
  scrollRef,
}: {
  file: File;
  flagged?: number[];
  className?: string;
  /** The scrolling element, so the parent can jump to a page (#orig-page-N). */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [ratios, setRatios] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // pdf.js releases a document through its loading task.
    let task: { destroy: () => Promise<void> } | null = null;
    void (async () => {
      try {
        const { openPdf } = await import("@/lib/pdfjs");
        const loading = await openPdf(await file.arrayBuffer());
        task = loading;
        const opened = await loading.promise;
        // Page shapes up front so the column does not jump as pages paint.
        const first = await opened.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        if (cancelled) return;
        setRatios(Array.from({ length: opened.numPages }, () => vp.height / vp.width));
        setDoc(opened);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [file]);

  return (
    <div ref={scrollRef} className={`overflow-auto bg-[#f1f1ee] p-3 sm:p-4 ${className}`}>
      {failed ? (
        <p className="p-4 text-sm text-neutral-500">The original could not be displayed.</p>
      ) : !doc ? (
        <p className="p-4 text-sm text-neutral-500">Loading pages…</p>
      ) : (
        <ol className="space-y-3">
          {ratios.map((ratio, i) => (
            <PageCanvas key={i} doc={doc} n={i + 1} ratio={ratio} flagged={flagged.includes(i + 1)} />
          ))}
        </ol>
      )}
    </div>
  );
}

function PageCanvas({ doc, n, ratio, flagged }: { doc: PdfDocument; n: number; ratio: number; flagged: boolean }) {
  const holder = useRef<HTMLLIElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    void (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const page = await doc.getPage(n);
      if (cancelled) return;
      const width = canvas.parentElement?.clientWidth || 600;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: (width / base.width) * Math.min(window.devicePixelRatio || 1, 2) });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      task = page.render({ canvasContext: ctx, canvas, viewport });
      await task.promise.catch(() => {});
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [visible, doc, n]);

  return (
    <li ref={holder} id={`orig-page-${n}`} className="relative">
      <div
        className={`overflow-hidden rounded-md bg-white shadow-sm ring-1 ${flagged ? "ring-2 ring-amber-400" : "ring-line"}`}
        style={{ aspectRatio: `1 / ${ratio}` }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" aria-label={`Page ${n} of the original PDF`} />
      </div>
      <span className="absolute bottom-2 right-2 rounded bg-ink/75 px-1.5 py-0.5 font-mono text-[10px] text-white">{n}</span>
      {flagged && (
        <span className="absolute left-2 top-2 rounded bg-amber-400 px-1.5 py-0.5 text-[11px] font-semibold text-amber-950">
          Scanned · check
        </span>
      )}
    </li>
  );
}
