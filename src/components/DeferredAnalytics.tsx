"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

// `GoogleAnalytics` from @next/third-parties renders two <Script> tags with the
// default `afterInteractive` strategy and exposes no way to change it (verified
// in node_modules/@next/third-parties/dist/google/ga.js). Measured on 2026-09-17,
// that made gtag.js the single heaviest resource of the homepage — 158 KB, 39% of
// total page weight — blocking the main thread for 251 ms and contributing to a
// mobile TBT of 1450 ms.
//
// So we mount it ourselves, after the page has settled. `requestIdleCallback`
// with a 3s ceiling covers the common case; any real interaction (pointer, key,
// scroll, touch) mounts it immediately, so a visitor who actually engages is
// still measured. The trade-off is deliberate and worth naming: a visitor who
// leaves within ~3 seconds without touching anything is no longer counted.
//
// Ordering is preserved: ConsentMode runs at `beforeInteractive` and sets the
// Consent Mode v2 defaults, so consent is always established before gtag loads.
const IDLE_TIMEOUT_MS = 3000;
const EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

export default function DeferredAnalytics({ gaId }: { gaId: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;

    const start = () => setMounted(true);

    for (const event of EVENTS) {
      window.addEventListener(event, start, { once: true, passive: true });
    }

    // Safari only shipped requestIdleCallback recently; fall back to a timer.
    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    const handle = ric
      ? ric(start, { timeout: IDLE_TIMEOUT_MS })
      : window.setTimeout(start, IDLE_TIMEOUT_MS);

    return () => {
      for (const event of EVENTS) window.removeEventListener(event, start);
      if (ric) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [mounted]);

  if (!mounted) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
