import { submitSitemap } from "@/lib/search-console";
import { submitToIndexNow } from "@/lib/indexnow";

// Always run at request time; never cache.
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, refuse rather than expose the endpoint.
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// Vercel Cron sends a GET with `Authorization: Bearer <CRON_SECRET>`.
//
// Despite the route name this now pings two ecosystems: Search Console (Google)
// and IndexNow (Bing/Yandex/Seznam/Naver). One weakness must not silence the
// other, so each is settled independently and both outcomes are reported.
export async function GET(request: Request) {
  if (!authorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [google, indexnow] = await Promise.allSettled([
    submitSitemap(),
    submitToIndexNow(),
  ]);

  const unwrap = (r: PromiseSettledResult<unknown>) =>
    r.status === "fulfilled"
      ? r.value
      : { ok: false, error: r.reason instanceof Error ? r.reason.message : String(r.reason) };

  const body = { google: unwrap(google), indexnow: unwrap(indexnow) };
  const ok =
    google.status === "fulfilled" &&
    google.value.ok &&
    indexnow.status === "fulfilled" &&
    indexnow.value.ok;

  return Response.json({ ok, ...body }, { status: ok ? 200 : 502 });
}
