# Activating AdSense (after approval)

1. Set `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX` in the Vercel production environment and redeploy. This automatically:
   - injects the AdSense script with **Consent Mode v2** (consent denied by default in EEA/UK/CH, granted elsewhere) via `src/components/GoogleAdSense.tsx`;
   - serves `/ads.txt` with the publisher ID.
2. In the AdSense dashboard, enable Google's **certified CMP** (Privacy & messaging → create a GDPR consent message). Google's script displays it automatically in the EEA — no custom banner needed.
3. Add ad units where desired (Auto ads work without code changes).

