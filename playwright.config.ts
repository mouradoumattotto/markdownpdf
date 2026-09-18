import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the production build (`next start`), because
// the CSP, caching headers and lazy chunks only behave for real in a build.
//   npm run build && npm run test:e2e
// A port no other local project uses — and never reuse an unknown server on it
// (port 3100 is taken by another project on this machine).
const PORT = 3217;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    acceptDownloads: true,
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    // Full suite on desktop Chromium.
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /perf\.spec\.ts/ },
    // Timing budgets, alone on one worker so parallel OCR tests cannot skew them.
    { name: "perf", use: { ...devices["Desktop Chrome"] }, testMatch: /perf\.spec\.ts/, fullyParallel: false },
    // Cross-browser and mobile smoke tests, tagged in the test titles.
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, grep: /@cross/ },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, grep: /@cross/ },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] }, grep: /@mobile/ },
  ],
});
