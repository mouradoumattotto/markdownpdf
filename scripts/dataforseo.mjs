#!/usr/bin/env node
// ------------------------------------------------------------------
// scripts/dataforseo.mjs — Client minimal de l'API DataForSEO v3,
// sans dépendance. Chaque appel est archivé (réponse brute + coût) dans
// seo-data/dataforseo/AAAA-MM-JJ/<nom>.json.gz pour pouvoir
// comparer les relevés dans le temps (snapshot N → N+1).
//
// Identifiants : DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD, lus depuis
// l'environnement, .env puis .env.local (jamais affichés ni archivés).
//
// Usage :
//   node scripts/dataforseo.mjs balance
//   node scripts/dataforseo.mjs post <endpoint> <nom> --body=fichier.json
//   node scripts/dataforseo.mjs post <endpoint> <nom> --data='[{...}]'
//
// Exemple :
//   node scripts/dataforseo.mjs post \
//     dataforseo_labs/google/ranked_keywords/live ranked-ccafprep \
//     --data='[{"target":"ccafprep.com","location_code":2250,"language_code":"fr"}]'
//
// Options :
//   --date=AAAA-MM-JJ   dossier de snapshot (défaut : aujourd'hui, UTC)
//   --force             relance même si le snapshot existe déjà (sinon
//                       le fichier existant est réutilisé : pas de double coût)
// ------------------------------------------------------------------

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const API = "https://api.dataforseo.com/v3/";

function loadEnv(file) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, v] = m;
    if (process.env[k] === undefined)
      process.env[k] = v.replace(/^["']|["']$/g, "");
  }
}
loadEnv(".env");
loadEnv(".env.local");

const { DATAFORSEO_LOGIN: login, DATAFORSEO_PASSWORD: password } = process.env;
if (!login || !password) {
  console.error(
    "❌ DATAFORSEO_LOGIN et DATAFORSEO_PASSWORD sont requis (.env ou environnement).",
  );
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${login}:${password}`).toString("base64");

async function call(endpoint, body) {
  const res = await fetch(API + endpoint.replace(/^\//, ""), {
    method: body ? "POST" : "GET",
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (json.status_code !== 20000) {
    throw new Error(`${json.status_code} ${json.status_message}`);
  }
  return json;
}

const argv = process.argv.slice(2);
const pos = argv.filter((a) => !a.startsWith("--"));
const opts = Object.fromEntries(
  argv
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const i = a.indexOf("=");
      return i === -1 ? [a.slice(2), true] : [a.slice(2, i), a.slice(i + 1)];
    }),
);

if (pos[0] === "balance") {
  const json = await call("appendix/user_data");
  const r = json.tasks[0].result[0];
  console.log(`Solde : ${r.money.balance} USD`);
  process.exit(0);
}

if (pos[0] === "get" && pos[1]) {
  // GET endpoints (task results, tasks_ready…) are printed, not archived.
  console.log(JSON.stringify(await call(pos[1]), null, 1));
  process.exit(0);
}

if (pos[0] !== "post" || !pos[1] || !pos[2]) {
  console.error(
    "Usage : node scripts/dataforseo.mjs balance | post <endpoint> <nom> --data=… | --body=…",
  );
  process.exit(1);
}

const [, endpoint, name] = pos;
const date = opts.date || new Date().toISOString().slice(0, 10);
const dir = resolve(ROOT, "seo-data/dataforseo", date);
const out = resolve(dir, `${name}.json.gz`);

if (existsSync(out) && !opts.force) {
  console.log(`↺ déjà relevé : ${out} (--force pour relancer)`);
  process.exit(0);
}

const body = opts.body
  ? JSON.parse(readFileSync(resolve(opts.body), "utf8"))
  : JSON.parse(opts.data || "[]");

const json = await call(endpoint, body);
const errors = json.tasks
  .filter((t) => t.status_code !== 20000)
  .map((t) => `${t.status_code} ${t.status_message}`);
mkdirSync(dir, { recursive: true });
writeFileSync(
  out,
  gzipSync(
    JSON.stringify(
      {
        endpoint,
        collectedAt: new Date().toISOString(),
        cost: json.cost,
        request: body,
        tasks: json.tasks.map((t) => ({
          id: t.id,
          status_code: t.status_code,
          status_message: t.status_message,
          cost: t.cost,
          data: t.data,
          result: t.result,
        })),
      },
      null,
      1,
    ),
  ),
);
console.log(
  `✓ ${name} · ${json.tasks.length} tâche(s) · coût ${json.cost} USD → ${out}`,
);
if (errors.length) console.error(`⚠️  ${errors.join(" | ")}`);
