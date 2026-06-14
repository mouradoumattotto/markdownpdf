import { submitSitemap } from "@/lib/search-console";

// Always run at request time; never cache.
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, refuse rather than expose the endpoint.
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// Vercel Cron sends a GET with `Authorization: Bearer <CRON_SECRET>`.
export async function GET(request: Request) {
  if (!authorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await submitSitemap();
    return Response.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
