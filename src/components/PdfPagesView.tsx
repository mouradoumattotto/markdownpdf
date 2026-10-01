"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { PdfDocument } from "@/lib/pdfjs";

/** What the result view can ask the original pane to do. */
export interface PdfPagesApi {
  /** Scrolls to a page and, when the page has a text layer, outlines the line that matches `text`. */
  locate: (page: number, text: string) => Promise<boolean>;
  /** Scrolls so that `fraction` (0–1) of page `page` sits at the top of the pane. */
  scrollTo: (page: number, fraction: number) => void;
}

interface Highlight {
  page: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

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
  apiRef,
  onScrollAt,
}: {
  file: File;
  flagged?: number[];
  className?: string;
  apiRef?: React.Ref<PdfPagesApi>;
  /** Fired as the reader scrolls: the page at the top of the pane and how far into it. */
  onScrollAt?: (page: number, fraction: number) => void;
}) {
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [ratios, setRatios] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ page: number; text: string } | null>(null);

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

  const pageEl = (n: number) => paneRef.current?.querySelector<HTMLElement>(`[data-page="${n}"]`) ?? null;

  const scrollPaneTo = (top: number, smooth: boolean) => {
    paneRef.current?.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
  };

  const api = useMemo<PdfPagesApi>(
    () => ({
      scrollTo(page, fraction) {
        const el = pageEl(page);
        const pane = paneRef.current;
        if (!el || !pane) return;
        // The pane is `relative`, so a page's offsetTop is measured from the pane itself.
        scrollPaneTo(el.offsetTop + el.offsetHeight * fraction - 12, false);
      },
      async locate(page, text) {
        const el = pageEl(page);
        const pane = paneRef.current;
        if (!el || !pane || !doc) {
          // Clicked before the original finished loading: do it once it has.
          pending.current = { page, text };
          return false;
        }
        let found: Highlight | null = null;
        const needle = normalize(text).split(" ").slice(0, 8).join(" ");
        if (needle.length >= 3) {
          const p = await doc.getPage(page);
          const vp = p.getViewport({ scale: 1 });
          const items = (await p.getTextContent()).items.filter(
            (i): i is Extract<typeof i, { str: string }> => "str" in i && Boolean(i.str.trim()),
          );
          // Match the start of the clicked line against the page's text runs: either a
          // run contains the line's first words, or the line starts with a long run.
          const head = needle.split(" ").slice(0, 4).join(" ");
          const hit =
            items.find((i) => normalize(i.str).includes(head)) ??
            items.find((i) => {
              const s = normalize(i.str);
              return s.length >= 6 && needle.startsWith(s.slice(0, Math.min(s.length, 24)));
            });
          if (hit) {
            const y = hit.transform[5];
            const h = Math.hypot(hit.transform[2], hit.transform[3]) || 10;
            const line = items.filter((i) => Math.abs(i.transform[5] - y) < h * 0.5);
            const left = Math.min(...line.map((i) => i.transform[4]));
            const right = Math.max(...line.map((i) => i.transform[4] + i.width));
            found = {
              page,
              left: (left - 3) / vp.width,
              top: (vp.height - y - h * 1.05) / vp.height,
              width: (right - left + 6) / vp.width,
              height: (h * 1.45) / vp.height,
            };
          }
        }
        setHighlight(found);
        const offset = found ? el.offsetHeight * found.top - pane.clientHeight / 3 : -12;
        scrollPaneTo(el.offsetTop + offset, true);
        return Boolean(found);
      },
    }),
    [doc],
  );
  useImperativeHandle(apiRef, () => api, [api]);

  // Replay a locate request that arrived while the document was loading.
  useEffect(() => {
    if (!doc || !pending.current) return;
    const { page, text } = pending.current;
    pending.current = null;
    // Wait for the page placeholders to be in the DOM.
    requestAnimationFrame(() => void api.locate(page, text));
  }, [doc, api]);

  const onScroll = () => {
    const pane = paneRef.current;
    if (!pane || !onScrollAt) return;
    const top = pane.scrollTop;
    const pages = pane.querySelectorAll<HTMLElement>("[data-page]");
    for (const el of pages) {
      if (el.offsetTop + el.offsetHeight > top) {
        onScrollAt(Number(el.dataset.page), Math.min(1, Math.max(0, (top - el.offsetTop) / el.offsetHeight)));
        return;
      }
    }
  };

  return (
    <div ref={paneRef} onScroll={onScroll} className={`relative overflow-auto bg-[#f1f1ee] p-3 sm:p-4 ${className}`}>
      {failed ? (
        <p className="p-4 text-sm text-neutral-500">The original could not be displayed.</p>
      ) : !doc ? (
        <p className="p-4 text-sm text-neutral-500">Loading pages…</p>
      ) : (
        <ol className="space-y-3">
          {ratios.map((ratio, i) => (
            <PageCanvas
              key={i}
              doc={doc}
              n={i + 1}
              ratio={ratio}
              flagged={flagged.includes(i + 1)}
              highlight={highlight?.page === i + 1 ? highlight : null}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function PageCanvas({
  doc,
  n,
  ratio,
  flagged,
  highlight,
}: {
  doc: PdfDocument;
  n: number;
  ratio: number;
  flagged: boolean;
  highlight: Highlight | null;
}) {
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
    <li ref={holder} id={`orig-page-${n}`} data-page={n} className="relative">
      <div
        className={`relative overflow-hidden rounded-md bg-white shadow-sm ring-1 ${flagged ? "ring-2 ring-amber-400" : "ring-line"}`}
        style={{ aspectRatio: `1 / ${ratio}` }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" aria-label={`Page ${n} of the original PDF`} />
        {highlight && (
          <div
            data-testid="pdf-highlight"
            className="pointer-events-none absolute rounded-[3px] border-2 border-brand-600 bg-brand-600/10"
            style={{
              left: `${highlight.left * 100}%`,
              top: `${highlight.top * 100}%`,
              width: `${highlight.width * 100}%`,
              height: `${highlight.height * 100}%`,
            }}
          />
        )}
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
