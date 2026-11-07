const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

// A plain async <script> (not next/script lazyOnload): React hoists it into the
// server-rendered <head>, which is where the AdSense crawler looks for the code
// snippet when validating the site. `async` keeps it from blocking parsing.
export default function GoogleAdSense() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}
