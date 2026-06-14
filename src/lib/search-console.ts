import { SITE } from "@/lib/site";

/**
 * The Search Console property identifier.
 * - Domain property:     "sc-domain:markdownpdf.app"
 * - URL-prefix property: "https://markdownpdf.app/"
 * Configured via GSC_SITE_URL; falls back to a domain property derived from SITE.url.
 */
function siteUrl(): string {
  if (process.env.GSC_SITE_URL) return process.env.GSC_SITE_URL;
  const host = new URL(SITE.url).host;
  return `sc-domain:${host}`;
}

function sitemapUrl(): string {
  return `${SITE.url}/sitemap.xml`;
}

export interface SubmitResult {
  ok: boolean;
  status: number;
  site: string;
  sitemap: string;
  detail?: string;
}

/**
 * Exchanges the long-lived OAuth refresh token for a short-lived access token.
 * Uses the Google account's own credentials (owner of the GSC property), so it
 * works for every property that account can access — no per-property setup.
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GSC_CLIENT_ID, GSC_CLIENT_SECRET or GSC_REFRESH_TOKEN env vars",
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`OAuth token refresh failed (${res.status}): ${await res.text()}`);
  }
  const { access_token } = (await res.json()) as { access_token?: string };
  if (!access_token) throw new Error("No access_token returned from Google");
  return access_token;
}

/**
 * Submits the sitemap to Google Search Console. Requires the OAuth env vars
 * above; the authenticated account must be an owner of the GSC property.
 */
export async function submitSitemap(): Promise<SubmitResult> {
  const site = siteUrl();
  const sitemap = sitemapUrl();
  const token = await getAccessToken();

  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    site,
  )}/sitemaps/${encodeURIComponent(sitemap)}`;

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  // A successful submit returns 204 No Content.
  const detail = res.ok ? undefined : await res.text();
  return { ok: res.ok, status: res.status, site, sitemap, detail };
}
