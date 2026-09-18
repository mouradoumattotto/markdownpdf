import Script from "next/script";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function GoogleAdSense() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      // Ads load when the browser is idle: they must never compete with the
      // tool for the main thread (measured cost of an eager third-party script:
      // 251 ms of blocking for gtag.js alone).
      strategy="lazyOnload"
    />
  );
}
