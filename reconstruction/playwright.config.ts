import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 35_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["json", { outputFile: "evidence/playwright-results.json" }],
    ["html", { outputFolder: "evidence/playwright-report", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3000",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      ...(existsSync("/usr/bin/chromium")
        ? { executablePath: "/usr/bin/chromium" }
        : {}),
      args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
      ...(process.env.HTTPS_PROXY
        ? {
            proxy: {
              server: process.env.HTTPS_PROXY,
              bypass: "127.0.0.1,localhost",
            },
          }
        : {}),
    },
  },
  webServer: {
    command: "node scripts/start-test-server.mjs",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  outputDir: "test-results",
});
