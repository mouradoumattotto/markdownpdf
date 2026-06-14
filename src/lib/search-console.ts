import { JWT } from "google-auth-library";
import { SITE } from "@/lib/site";

const SCOPE = "https://www.googleapis.com/auth/webmasters";

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
 * Submits the sitemap to Google Search Console using a service-account JWT.
 * Requires GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY env vars; the service account
 * must be a (delegated) owner of the Search Console property.
 */
export async function submitSitemap(): Promise<SubmitResult> {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  // Vercel stores multiline secrets with literal "\n"; restore real newlines.
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GSC_CLIENT_EMAIL or GSC_PRIVATE_KEY env vars");
  }

  const site = siteUrl();
  const sitemap = sitemapUrl();

  const auth = new JWT({ email: clientEmail, key: privateKey, scopes: [SCOPE] });
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("Failed to obtain Google access token");

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
