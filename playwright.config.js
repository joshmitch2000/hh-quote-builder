import { defineConfig } from "@playwright/test";

/**
 * E2E tests against the LIVE site — no fixtures, no local server.
 * Validates real production behavior: pre-selected defaults, first-valid
 * style snap on coverage change, package selection, and the hidden-field
 * bridge. Read-only interactions only (no form submission).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "https://himandhermusic.com",
  },
});
