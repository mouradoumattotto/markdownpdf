import { test as base, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const FIXTURES = join(__dirname, "..", "fixtures", "generated");
export const fixture = (name: string) => join(FIXTURES, name);

type Problems = { console: string[]; csp: string[]; thirdParty: string[] };

/**
 * Every test gets:
 *  - Google Analytics stubbed (no real traffic from tests; events stay readable
 *    in window.dataLayer),
 *  - a record of console errors, uncaught exceptions and CSP violations,
 *  - a record of any request leaving for a host other than ours or Google
 *    Analytics — the privacy promise, checked on every single test.
 * Any of those fails the test.
 */
export const test = base.extend<{ problems: Problems }>({
  problems: [
    async ({ page }, use) => {
      const problems: Problems = { console: [], csp: [], thirdParty: [] };
      await page.route(/googletagmanager\.com|google-analytics\.com/, (route) =>
        route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
      );
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (e) => {
          (window as unknown as { __csp: string[] }).__csp ??= [];
          (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
        });
      });
      page.on("console", (m) => {
        if (m.type() === "error") problems.console.push(m.text());
      });
      page.on("pageerror", (e) => problems.console.push(`pageerror: ${e.message}`));
      page.on("request", (r) => {
        const host = new URL(r.url()).hostname;
        const ok =
          host === "127.0.0.1" ||
          host === "localhost" ||
          /(^|\.)googletagmanager\.com$|(^|\.)google-analytics\.com$/.test(host) ||
          r.url().startsWith("data:") ||
          r.url().startsWith("blob:");
        if (!ok) problems.thirdParty.push(r.url());
      });
      await use(problems);
      if (problems.console.length) console.log("console errors:\n  " + problems.console.join("\n  "));
      const csp = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []).catch(() => []);
      problems.csp.push(...csp);
      expect(problems.csp, "CSP violations").toEqual([]);
      expect(problems.thirdParty, "requests to third parties").toEqual([]);
      expect(problems.console.filter((m) => !/Failed to load resource.*(favicon|404)/.test(m)), "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** GA events pushed through gtag() — [name, params][] */
export async function gaEvents(page: Page): Promise<[string, Record<string, unknown>][]> {
  return page.evaluate(() => {
    const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];
    return dl
      .map((a) => Array.from(a as ArrayLike<unknown>))
      .filter((a) => a[0] === "event")
      .map((a) => [a[1] as string, (a[2] ?? {}) as Record<string, unknown>]);
  });
}

export async function eventNames(page: Page): Promise<string[]> {
  return (await gaEvents(page)).map(([n]) => n);
}

/** No event parameter may contain document text or file names. */
export async function expectNoPrivateDataInEvents(page: Page, forbidden: string[]) {
  const all = JSON.stringify(await gaEvents(page));
  for (const f of forbidden) expect(all, `analytics leaked "${f}"`).not.toContain(f);
}

export async function upload(page: Page, name: string | string[], selector = 'input[type="file"]') {
  const files = Array.isArray(name) ? name.map(fixture) : fixture(name);
  await page.locator(selector).first().setInputFiles(files);
}

export async function downloadText(page: Page, click: () => Promise<void>) {
  const [dl] = await Promise.all([page.waitForEvent("download"), click()]);
  const path = await dl.path();
  return { name: dl.suggestedFilename(), text: readFileSync(path!, "utf8"), bytes: readFileSync(path!) };
}

export async function downloadBytes(page: Page, click: () => Promise<void>) {
  const [dl] = await Promise.all([page.waitForEvent("download"), click()]);
  return { name: dl.suggestedFilename(), bytes: readFileSync((await dl.path())!) };
}

/** Horizontal overflow is the most common mobile layout bug. */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(1);
}
