// ------------------------------------------------------------------
// scripts/indexnow.mjs — Submit every sitemap URL to IndexNow on demand.
//
// The weekly Vercel cron already does this, but on a young domain you want to
// ping the moment something ships rather than wait for Monday. Reads the *live*
// sitemap so it always reflects what is actually deployed.
//
//   node scripts/indexnow.mjs
//
// Zero dependencies.
// ------------------------------------------------------------------

const KEY = "9c665a441063f524433614f1db1a9a57";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://markdownpdf.app";
const host = new URL(SITE).host;
const keyLocation = `${SITE}/${KEY}.txt`;

// 1. The key file must be live and byte-exact before submitting, otherwise
//    IndexNow rejects the batch with 403.
const keyRes = await fetch(keyLocation);
if (!keyRes.ok) {
  console.error(`❌ Key file unreachable (${keyRes.status}) at ${keyLocation}`);
  console.error("   Deploy first — IndexNow verifies ownership by reading it.");
  process.exit(1);
}
const served = (await keyRes.text()).trim();
if (served !== KEY) {
  console.error(`❌ Key mismatch at ${keyLocation}\n   served: "${served}"\n   expected: "${KEY}"`);
  process.exit(1);
}
console.log(`✅ Key verified at ${keyLocation}`);

// 2. Collect the URLs Google is meant to know about.
const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0) {
  console.error("❌ No <loc> entries found in sitemap.xml");
  process.exit(1);
}
console.log(`📄 ${urlList.length} URLs from ${SITE}/sitemap.xml`);

// 3. Submit. 200 = accepted, 202 = accepted pending key verification.
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: KEY, keyLocation, urlList }),
});

if (res.status === 200 || res.status === 202) {
  console.log(`✅ IndexNow accepted ${urlList.length} URLs (HTTP ${res.status})`);
} else {
  console.error(`❌ IndexNow refused the batch (HTTP ${res.status})`);
  console.error(await res.text());
  process.exit(1);
}
