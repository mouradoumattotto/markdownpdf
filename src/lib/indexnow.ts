import sitemap from "@/app/sitemap";
import { SITE } from "@/lib/site";

/**
 * IndexNow key. Deliberately committed: it is *not* a secret. The protocol
 * proves domain control by having us serve the same value publicly at
 * `keyLocation`, so anyone can read it. It must stay byte-identical to the
 * contents (and the filename) of `public/<key>.txt`.
 */
export const INDEXNOW_KEY = "9c665a441063f524433614f1db1a9a57";

/**
 * The shared IndexNow endpoint. Submitting here fans the URLs out to every
 * participating engine (Bing, Yandex, Seznam, Naver) in one call — Google does
 * not participate. Bing matters most to us: it indexes far faster than Google
 * on a young domain, and it backs ChatGPT's search results.
 */
const ENDPOINT = "https://api.indexnow.org/indexnow";

export interface IndexNowResult {
  ok: boolean;
  status: number;
  submitted: number;
  keyLocation: string;
  detail?: string;
}

/** Every canonical URL we want crawled — kept in sync with the sitemap by construction. */
export function allSiteUrls(): string[] {
  return sitemap().map((entry) => entry.url);
}

/**
 * Pings IndexNow with `urls` (defaults to the whole sitemap).
 *
 * A 200 means accepted; 202 means accepted while the key file is still being
 * verified, which is normal on the first submission — both are successes.
 */
export async function submitToIndexNow(urls?: string[]): Promise<IndexNowResult> {
  const urlList = urls ?? allSiteUrls();
  const host = new URL(SITE.url).host;
  const keyLocation = `${SITE.url}/${INDEXNOW_KEY}.txt`;

  if (urlList.length === 0) {
    return { ok: false, status: 0, submitted: 0, keyLocation, detail: "No URLs to submit" };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation, urlList }),
  });

  const ok = res.status === 200 || res.status === 202;
  return {
    ok,
    status: res.status,
    submitted: urlList.length,
    keyLocation,
    detail: ok ? undefined : await res.text(),
  };
}
