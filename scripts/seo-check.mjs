// ------------------------------------------------------------------
// scripts/seo-check.mjs — Technical SEO QA for every page in the sitemap.
//
// Run against a local production build (or any base URL):
//   npm run build && npx next start -p 3217 &
//   npm run seo:check -- http://127.0.0.1:3217
//
// Fails (exit 1) on anything that would hurt indexing: non-200 pages, missing
// or duplicate titles/descriptions, missing canonical or a canonical pointing
// elsewhere, not exactly one H1, missing Open Graph, invalid JSON-LD, broken
// internal links, a sitemap URL that is not canonical, a 404 page that does not
// return 404, or a missing security policy.
// ------------------------------------------------------------------

const BASE = (process.argv[2] ?? "http://127.0.0.1:3217").replace(/\/$/, "");
const PROD = "https://markdownpdf.app";
const errors = [];
const warnings = [];
const err = (url, msg) => errors.push(`${url}  ${msg}`);
const warn = (url, msg) => warnings.push(`${url}  ${msg}`);

const local = (u) => u.replace(PROD, BASE);
const pathOf = (u) => new URL(u).pathname;

const decode = (s) =>
  s
    ?.replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
const one = (html, re) => decode(re.exec(html)?.[1]);

async function get(url, opts = {}) {
  const res = await fetch(url, { redirect: "manual", ...opts });
  return { res, html: res.status === 200 ? await res.text() : "" };
}

// ---- sitemap & robots ------------------------------------------------------
const sitemapXml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (sitemapUrls.length === 0) err("/sitemap.xml", "no URLs");
if (new Set(sitemapUrls).size !== sitemapUrls.length) err("/sitemap.xml", "duplicate URLs");
for (const u of sitemapUrls) if (!u.startsWith(PROD)) err("/sitemap.xml", `non-production URL ${u}`);

const robots = await (await fetch(`${BASE}/robots.txt`)).text();
if (!robots.includes(`Sitemap: ${PROD}/sitemap.xml`)) err("/robots.txt", "sitemap not declared");
if (/Disallow:\s*\/\s*$/m.test(robots)) err("/robots.txt", "disallows everything");

// ---- per-page checks -------------------------------------------------------
const titles = new Map();
const descriptions = new Map();
const internalLinks = new Set();
const EXTRA = ["/about", "/how-it-works", "/privacy-policy", "/terms", "/contact"];

for (const url of [...sitemapUrls, ...EXTRA.map((p) => PROD + p)]) {
  const inSitemap = sitemapUrls.includes(url);
  const path = pathOf(url);
  const { res, html } = await get(local(url));
  if (res.status !== 200) {
    err(path, `status ${res.status}`);
    continue;
  }
  if (!res.headers.get("content-security-policy")) err(path, "no Content-Security-Policy header");

  const title = one(html, /<title>([\s\S]*?)<\/title>/);
  const desc = one(html, /<meta name="description" content="([^"]*)"/);
  const canonical = one(html, /<link rel="canonical" href="([^"]*)"/);
  const robotsMeta = one(html, /<meta name="robots" content="([^"]*)"/) ?? "";
  const h1s = [...html.matchAll(/<h1[\s>]/g)].length;

  if (!title) err(path, "missing <title>");
  else {
    if (title.length > 60) warn(path, `title ${title.length} chars (>60): ${title}`);
    titles.set(title, [...(titles.get(title) ?? []), path]);
  }
  if (!desc) err(path, "missing meta description");
  else {
    if (desc.length > 165 || desc.length < 70) warn(path, `description ${desc.length} chars`);
    descriptions.set(desc, [...(descriptions.get(desc) ?? []), path]);
  }
  if (h1s !== 1) err(path, `${h1s} <h1> elements`);
  const expected = path === "/" ? PROD : PROD + path;
  if (!canonical) err(path, "missing canonical");
  else if (canonical !== expected) err(path, `canonical ${canonical} != ${expected}`);
  if (inSitemap && /noindex/.test(robotsMeta)) err(path, "in sitemap but noindex");
  for (const prop of ["og:title", "og:description", "og:image"]) {
    if (!html.includes(`property="${prop}"`)) err(path, `missing ${prop}`);
  }

  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  const types = [];
  for (const [, json] of blocks) {
    try {
      const walk = (o) => {
        if (Array.isArray(o)) return o.forEach(walk);
        if (o && typeof o === "object") {
          if (o["@type"]) types.push(o["@type"]);
          Object.values(o).forEach(walk);
        }
      };
      walk(JSON.parse(json));
    } catch {
      err(path, "invalid JSON-LD");
    }
  }
  if (path !== "/" && inSitemap && !types.includes("BreadcrumbList")) err(path, "no BreadcrumbList");

  for (const img of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt=/.test(img[0])) err(path, "image without alt");
  for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const href = m[1];
    if (!href.startsWith("/_next") && !/\.(svg|png|ico|webmanifest|txt|xml)$/.test(href) && !href.startsWith("/apple-icon") && !href.startsWith("/icon")) internalLinks.add(href);
  }
}

for (const [t, paths] of titles) if (paths.length > 1) err(paths.join(", "), `duplicate title "${t}"`);
for (const [d, paths] of descriptions) if (paths.length > 1) err(paths.join(", "), `duplicate description "${d.slice(0, 50)}…"`);

// ---- internal links --------------------------------------------------------
for (const href of internalLinks) {
  const res = await fetch(BASE + href, { redirect: "manual" });
  if (res.status === 200) continue;
  if ([301, 308].includes(res.status)) warn(href, `linked internally but redirects (${res.status}) — link the target instead`);
  else err(href, `internal link returns ${res.status}`);
}

// ---- 404 -------------------------------------------------------------------
const nf = await fetch(`${BASE}/this-page-does-not-exist-xyz`);
const nfHtml = await nf.text();
if (nf.status !== 404) err("/404", `returns ${nf.status}`);
if (!/noindex/.test(nfHtml)) err("/404", "not noindex");

// ---- report ----------------------------------------------------------------
console.log(`SEO check — ${BASE}`);
console.log(`  ${sitemapUrls.length} sitemap URLs + ${EXTRA.length} footer pages, ${internalLinks.size} unique internal links`);
for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.log(`  FAIL  ${e}`);
console.log(errors.length ? `\n${errors.length} error(s), ${warnings.length} warning(s)` : `\nOK — 0 errors, ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
