"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface MenuGroup {
  title: string;
  href: string | null;
  items: { href: string; name: string; tagline: string; glyph: string; tile: string }[];
}

function Tile({ glyph, tile, size = "h-[34px] w-[34px]" }: { glyph: string; tile: string; size?: string }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-[9px] font-mono text-[10px] font-semibold text-white ${size}`}
      style={{ background: tile }}
    >
      {glyph}
    </span>
  );
}

/**
 * "Convert a PDF" does the action instead of describing it: on the converter
 * page it opens the file picker straight away (the click is the user gesture
 * the browser needs); anywhere else it takes you to the converter.
 */
function ConvertButton({ className }: { className: string }) {
  const pathname = usePathname();
  return (
    <Link
      href="/#converter"
      onClick={(e) => {
        if (pathname !== "/") return;
        e.preventDefault();
        window.dispatchEvent(new Event("mdpdf:pick"));
      }}
      className={className}
    >
      Convert a PDF
    </Link>
  );
}

export default function SiteNav({ groups, links }: { groups: MenuGroup[]; links: { href: string; label: string }[] }) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toolsOpen && !mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setToolsOpen(false);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (toolsOpen && !toolsRef.current?.contains(e.target as Node)) setToolsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [toolsOpen, mobileOpen]);

  // A phone menu taller than the screen must scroll on its own, not the page under it.
  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobileOpen]);

  const close = () => {
    setToolsOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="hidden flex-1 items-center gap-6 text-sm font-medium lg:flex" aria-label="Main navigation">
        <div ref={toolsRef} className="relative">
          <button
            type="button"
            aria-expanded={toolsOpen}
            aria-controls="tools-menu"
            onClick={() => setToolsOpen((o) => !o)}
            className={`flex items-center gap-1 py-2 transition-colors ${toolsOpen ? "text-brand-700" : "text-neutral-700 hover:text-ink"}`}
          >
            Tools
            <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 transition-transform ${toolsOpen ? "rotate-180" : ""}`} aria-hidden>
              <path d="M5.5 7.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {toolsOpen && (
            <div
              id="tools-menu"
              className="fixed inset-x-4 top-[4.5rem] z-50 mx-auto max-h-[calc(100vh-6rem)] max-w-6xl overflow-auto rounded-[14px] border border-line bg-white p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.3)] lg:inset-x-10"
            >
              <div className="grid gap-x-6 gap-y-6 lg:grid-cols-3 xl:grid-cols-5">
                {groups.map((g) => (
                  <div key={g.title}>
                    <p className="mb-2 px-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                      {g.href ? (
                        <Link href={g.href} onClick={close} className="hover:text-brand-700">
                          {g.title} →
                        </Link>
                      ) : (
                        g.title
                      )}
                    </p>
                    <ul>
                      {g.items.map((i) => (
                        <li key={i.href}>
                          <Link
                            href={i.href}
                            onClick={close}
                            className="flex items-center gap-3 rounded-[10px] p-2.5 transition-colors hover:bg-paper"
                          >
                            <Tile glyph={i.glyph} tile={i.tile} />
                            <span className="min-w-0">
                              <span className="block text-[15px] font-semibold text-ink">{i.name}</span>
                              <span className="block truncate text-[13px] font-normal text-neutral-600">{i.tagline}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-neutral-700 transition-colors hover:text-ink">
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:ml-0">
        <ConvertButton className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:px-4" />
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
            {mobileOpen ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto bg-paper px-4 pb-8 pt-4 lg:hidden"
        >
          {groups.map((g) => (
            <div key={g.title} className="mb-5">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">{g.title}</p>
              <ul className="overflow-hidden rounded-[14px] border border-line bg-white">
                {g.items.map((i) => (
                  <li key={i.href} className="border-b border-[#f1f1ee] last:border-0">
                    <Link href={i.href} onClick={close} className="flex min-h-14 items-center gap-3 px-3.5 py-2.5">
                      <Tile glyph={i.glyph} tile={i.tile} />
                      <span className="text-[15px] font-semibold text-ink">{i.name}</span>
                      <span className="ml-auto text-neutral-400" aria-hidden>
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <ul className="overflow-hidden rounded-[14px] border border-line bg-white">
            {links.map((l) => (
              <li key={l.href} className="border-b border-[#f1f1ee] last:border-0">
                <Link href={l.href} onClick={close} className="flex min-h-12 items-center px-4 text-[15px] font-semibold text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
