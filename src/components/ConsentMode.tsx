import Script from "next/script";

// EEA + UK + Switzerland: regions where consent defaults to denied (GDPR).
// Google Analytics falls back to cookieless pings there until consent is
// granted; Google's certified CMP (enabled with AdSense) will collect consent
// and update these signals automatically via Consent Mode v2.
const GDPR_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "IS", "LI", "NO", "GB", "CH",
];

export default function ConsentMode() {
  return (
    // Rendered from the root layout, where the App Router supports
    // beforeInteractive; the lint rule predates it and only knows _document.js.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="google-consent-mode" strategy="beforeInteractive">
      {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500,
  region: ${JSON.stringify(GDPR_REGIONS)}
});
gtag('consent', 'default', {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted'
});`}
    </Script>
  );
}
