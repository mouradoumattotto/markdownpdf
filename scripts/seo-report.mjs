// ------------------------------------------------------------------
// scripts/seo-report.mjs — Weekly Search Console opportunity report.
//
//   npm run seo:report                 (prints Markdown to stdout)
//   npm run seo:report -- out.md       (also writes it to a file)
//
// Needs an OAuth token file with client_id / client_secret / refresh_token for
// an owner of the sc-domain:markdownpdf.app property. Path from GSC_TOKEN_FILE,
// defaulting to the shared token used for the other sites. The token never
// leaves this machine: it is only sent to oauth2.googleapis.com.
//
// Opportunities, as defined in the roadmap:
//   A  position 5-15 with real impressions      -> improve the page
//   B  impressions but CTR far below position   -> rewrite title / meta
//   C  query new in the last 28 days            -> create or extend content
//   D  one query spread over several pages      -> cannibalization
//   E  indexed page with (almost) no impressions -> check intent / linking
// Plus the indexing status of every sitemap URL (URL Inspection API).
// ------------------------------------------------------------------

import { readFileSync, writeFileSync } from "node:fs";

const SITE = "sc-domain:markdownpdf.app";
const ORIGIN = "https://markdownpdf.app";
const TOKEN_FILE = process.env.GSC_TOKEN_FILE ?? "/home/mourad/projects/munazzim/.secrets/gsc-token.json";

const cred = JSON.parse(readFileSync(TOKEN_FILE, "utf8"));
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: cred.refresh_token,
    client_id: cred.client_id,
    client_secret: cred.client_secret,
  }),
});
if (!tokenRes.ok) throw new Error(`OAuth refresh failed: ${tokenRes.status}`);
const TOKEN = (await tokenRes.json()).access_token;
const auth = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
async function query(startDate, endDate, dimensions, rowLimit = 1000) {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
  });
  if (!r.ok) throw new Error(`searchAnalytics ${r.status}: ${await r.text()}`);
  return (await r.json()).rows ?? [];
}

// GSC data lags ~2-3 days.
const cur = [day(30), day(3)];
const prev = [day(58), day(31)];
const [totals, totalsPrev, queries, queriesPrev, pages, pageQuery] = await Promise.all([
  query(...cur, []),
  query(...prev, []),
  query(...cur, ["query"]),
  query(...prev, ["query"]),
  query(...cur, ["page"]),
  query(...cur, ["page", "query"], 5000),
]);

// Rough expected CTR by position (industry curves vary; only used to spot outliers).
const expectedCtr = (pos) => (pos <= 1 ? 0.25 : pos <= 3 ? 0.12 : pos <= 5 ? 0.06 : pos <= 10 ? 0.025 : pos <= 20 ? 0.008 : 0.002);
const fmt = (r) => `${r.clicks} clicks, ${r.impressions} impr., CTR ${(r.ctr * 100).toFixed(1)}%, pos ${r.position.toFixed(1)}`;
const short = (u) => u.replace(ORIGIN, "") || "/";

const A = queries.filter((r) => r.position >= 5 && r.position <= 15 && r.impressions >= 10).sort((a, b) => b.impressions - a.impressions);
const B = queries
  .filter((r) => r.impressions >= 20 && r.position <= 20 && r.ctr < expectedCtr(r.position) / 2)
  .sort((a, b) => b.impressions - a.impressions);
const prevSet = new Set(queriesPrev.map((r) => r.keys[0]));
const C = queries.filter((r) => !prevSet.has(r.keys[0]) && r.impressions >= 3).sort((a, b) => b.impressions - a.impressions);
const byQuery = new Map();
for (const r of pageQuery) {
  const [page, q] = r.keys;
  if (r.impressions < 5) continue;
  byQuery.set(q, [...(byQuery.get(q) ?? []), { page, ...r }]);
}
const D = [...byQuery].filter(([, rows]) => rows.length > 1).sort((a, b) => b[1].length - a[1].length);

// Indexing status of every sitemap URL.
const sitemap = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const inspection = [];
for (const url of urls) {
  const r = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
  });
  const s = r.ok ? (await r.json()).inspectionResult?.indexStatusResult ?? {} : {};
  inspection.push({ url, coverage: s.coverageState ?? `error ${r.status}`, lastCrawl: s.lastCrawlTime ?? null });
  await new Promise((res) => setTimeout(res, 1100)); // API quota: ~1 req/s
}
const indexed = inspection.filter((i) => /indexed/i.test(i.coverage) && !/not indexed/i.test(i.coverage));
const pageImpr = new Map(pages.map((r) => [r.keys[0], r.impressions]));
const E = indexed.filter((i) => (pageImpr.get(i.url) ?? 0) < 5);

const t = totals[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
const tp = totalsPrev[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
const lines = [];
const out = (s = "") => lines.push(s);
out(`# SEO opportunities — ${new Date().toISOString().slice(0, 10)}`);
out();
out(`Window ${cur[0]} → ${cur[1]} (previous: ${prev[0]} → ${prev[1]})`);
out();
out(`- Now: ${fmt(t)}`);
out(`- Before: ${fmt(tp)}`);
out(`- Indexed: **${indexed.length} / ${urls.length}** sitemap URLs`);
out();
const section = (title, rows, render, action) => {
  out(`## ${title}`);
  out(`_Action: ${action}_`);
  out();
  if (!rows.length) out("None.");
  for (const r of rows.slice(0, 15)) out(`- ${render(r)}`);
  out();
};
section("A — Position 5–15 with impressions", A, (r) => `\`${r.keys[0]}\` — ${fmt(r)}`, "strengthen the ranking page (content depth, internal links, FAQ answering the query).");
section("B — CTR far below what the position earns", B, (r) => `\`${r.keys[0]}\` — ${fmt(r)} (expected ≈${(expectedCtr(r.position) * 100).toFixed(1)}%)`, "rewrite the title and meta description of the ranking page.");
section("C — New queries this period", C, (r) => `\`${r.keys[0]}\` — ${fmt(r)}`, "check intent; extend the closest page or plan a guide.");
section("D — Queries split across several pages", D, ([q, rows]) => `\`${q}\` — ${rows.map((x) => `${short(x.page)} (pos ${x.position.toFixed(0)})`).join(", ")}`, "pick one page per intent; link the others to it.");
section("E — Indexed but (almost) no impressions", E, (i) => `${short(i.url)} — ${pageImpr.get(i.url) ?? 0} impressions`, "check search intent, title and internal links.");
out("## Indexing status");
out();
for (const i of inspection) out(`- ${short(i.url)} — ${i.coverage}${i.lastCrawl ? ` (crawled ${i.lastCrawl.slice(0, 10)})` : ""}`);

const report = lines.join("\n");
console.log(report);
if (process.argv[2]) writeFileSync(process.argv[2], report + "\n");
