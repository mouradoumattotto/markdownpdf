// ------------------------------------------------------------------
// scripts/seo-rank.mjs — Rank tracker on Google US through DataForSEO.
//
//   npm run seo:rank                 (prints a Markdown table)
//   npm run seo:rank -- --dry-run    (lists the keywords and the cost cap)
//
// For every tracked keyword it fetches the live top 100 (SERP API) and
// records where markdownpdf.app appears, which URL ranks, and the
// competitor at #1. Each run is appended to seo-data/rank-history.json so
// runs can be compared; the raw SERPs are not kept (they are large and
// re-fetchable). Cost: about $0.02 per keyword at depth 100.
//
// Credentials: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD from the environment
// or .env.local (never printed). Volumes and KD are the DataForSEO Labs
// figures measured on 2026-09-26, kept here to rank priorities.
// ------------------------------------------------------------------

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const DOMAIN = "markdownpdf.app";
const HISTORY = resolve(ROOT, "seo-data/rank-history.json");

// [keyword, target path, monthly US volume, keyword difficulty]
const KEYWORDS = [
  ["pdf to markdown", "/", 3600, 9],
  ["pdf to markdown converter", "/", 3600, 8],
  ["pdf to md", "/", 1900, 8],
  ["convert pdf to markdown", "/", 880, 9],
  ["markdown to pdf", "/md-to-pdf", 14800, 26],
  ["md to pdf", "/md-to-pdf", 14800, 17],
  ["convert md to pdf", "/md-to-pdf", 3600, 17],
  ["markdown table generator", "/markdown-table-generator", 1900, 5],
  ["markdown to word", "/markdown-to-docx", 1900, 13],
  ["markdown to docx", "/markdown-to-docx", 590, 5],
  ["word to markdown", "/docx-to-markdown", 880, 14],
  ["markdown to html", "/markdown-to-html", 1900, 6],
  ["html to markdown", "/html-to-markdown", 1600, 26],
  ["compare pdf files", "/text-diff", 2400, 15],
  ["remove metadata from pdf", "/pdf-metadata", 1600, 26],
  ["claude token counter", "/token-counter", 320, 7],
  ["can notebooklm read markdown", "/blog/pdf-to-markdown-for-notebooklm", 0, 0],
  ["markdownpdf", "/", 0, 0],
];

function loadEnv(file) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(".env");
loadEnv(".env.local");

if (process.argv.includes("--dry-run")) {
  for (const [kw, path] of KEYWORDS) console.log(`${kw}  →  ${path}`);
  console.log(`\n${KEYWORDS.length} keywords, about $${(KEYWORDS.length * 0.02).toFixed(2)} per run.`);
  process.exit(0);
}

const { DATAFORSEO_LOGIN: login, DATAFORSEO_PASSWORD: password } = process.env;
if (!login || !password) {
  console.error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required (.env.local or environment).");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${login}:${password}`).toString("base64");

async function serp(keyword) {
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/regular", {
    method: "POST",
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: JSON.stringify([{ keyword, location_code: 2840, language_code: "en", depth: 100 }]),
  });
  const json = await res.json();
  const task = json.tasks?.[0];
  if (json.status_code !== 20000 || task?.status_code !== 20000) {
    throw new Error(`${keyword}: ${task?.status_message ?? json.status_message}`);
  }
  return { cost: json.cost, items: (task.result?.[0]?.items ?? []).filter((i) => i.type === "organic") };
}

const history = existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, "utf8")) : [];
const previous = history.at(-1)?.ranks ?? {};
const run = { date: new Date().toISOString().slice(0, 10), cost: 0, ranks: {} };

const rows = [];
for (const [keyword, target, volume, kd] of KEYWORDS) {
  const { cost, items } = await serp(keyword);
  run.cost += cost;
  const hit = items.find((i) => i.domain === DOMAIN || i.domain?.endsWith(`.${DOMAIN}`));
  const pos = hit?.rank_group ?? null;
  const url = hit ? new URL(hit.url).pathname : null;
  run.ranks[keyword] = { pos, url };

  const before = previous[keyword]?.pos ?? null;
  const delta = pos && before ? before - pos : null;
  rows.push(
    `| ${keyword} | ${volume || "—"} | ${kd || "—"} | ${pos ?? ">100"} | ${
      delta === null ? "" : delta > 0 ? `▲${delta}` : delta < 0 ? `▼${-delta}` : "="
    } | ${url ?? ""}${url && url !== target ? ` ⚠ expected ${target}` : ""} | ${items[0]?.domain ?? ""} |`,
  );
}

mkdirSync(resolve(ROOT, "seo-data"), { recursive: true });
history.push(run);
writeFileSync(HISTORY, JSON.stringify(history, null, 1) + "\n");

console.log(`## Google US rankings for ${DOMAIN} — ${run.date}\n`);
console.log("| Keyword | Vol. | KD | Pos. | Δ | Ranking URL | #1 |");
console.log("|---|---:|---:|---:|---|---|---|");
console.log(rows.join("\n"));
const ranked = Object.values(run.ranks).filter((r) => r.pos).length;
console.log(`\n${ranked}/${KEYWORDS.length} keywords in the top 100 · cost $${run.cost.toFixed(3)}`);
