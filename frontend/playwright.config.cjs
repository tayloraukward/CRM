// CommonJS so Node 18.18 can load config (Playwright ESM requires 18.19+).
const { defineConfig, devices } = require("@playwright/test");
const path = require("node:path");

const root = __dirname;
const backendDir = path.join(root, "..", "backend");

module.exports = defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.cjs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "bash -lc '.venv/bin/python seed.py && .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000'",
      cwd: backendDir,
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173",
      cwd: root,
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
