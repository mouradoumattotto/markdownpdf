"use client";

import { useEffect, useRef } from "react";

/**
 * One AdSense unit, placed by hand at the positions agreed in the roadmap:
 * never above or inside a tool, never next to Download/Copy buttons, never on
 * error or loading screens, at most two per tool page. Renders nothing until
 * NEXT_PUBLIC_ADSENSE_CLIENT and the slot's ID are configured, so pages carry
 * no empty boxes before ads are approved.
 *
 * The reserved min-height keeps CLS at zero when the ad fills in.
 */
const SLOTS = {
  tool: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL,
  article: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE,
  hub: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HUB,
} as const;

export default function AdSlot({ placement, minHeight = 280 }: { placement: keyof typeof SLOTS; minHeight?: number }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = SLOTS[placement];
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    pushed.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // An ad failing must never affect the page.
    }
  }, [client, slot]);

  if (!client || !slot) return null;
  return (
    <aside aria-label="Advertisement" className="mx-auto my-10 max-w-3xl px-4">
      <p className="mb-1 text-center text-[11px] uppercase tracking-wide text-neutral-500">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
