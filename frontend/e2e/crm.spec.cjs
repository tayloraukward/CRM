const { execFileSync } = require("node:child_process");
const { expect, test } = require("@playwright/test");

test("logs in, creates a contact, and verifies via API", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/login");
  await page.getByTestId("login-username").fill("demo");
  await page.getByTestId("login-password").fill("password");
  await page.getByTestId("login-submit").click();

  await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("link", { name: "Contacts" }).click();
  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();

  await page.getByTestId("add-contact-button").click();

  await page.getByTestId("contact-first-name").fill("E2E");
  await page.getByTestId("contact-last-name").fill("User");
  await page.getByTestId("contact-email").fill(email);
  await page.getByTestId("contact-submit").click();

  await expect(page.getByRole("cell", { name: email })).toBeVisible({
    timeout: 15_000,
  });

  const rows = await page.evaluate(async (em) => {
    const r = await fetch(`/api/contacts?email=${encodeURIComponent(em)}`, {
      credentials: "include",
    });
    if (!r.ok) {
      throw new Error(`contacts API failed: ${r.status}`);
    }
    return r.json();
  }, email);

  expect(Array.isArray(rows)).toBeTruthy();
  expect(rows.some((c) => c.email === email)).toBe(true);

  const sqlitePath = process.env.SQLITE_PATH;
  if (sqlitePath) {
    const out = execFileSync(
      "sqlite3",
      [sqlitePath, `SELECT email FROM contacts WHERE email='${email.replace(/'/g, "''")}';`],
      { encoding: "utf-8" },
    ).trim();
    expect(out).toBe(email);
  }
});
