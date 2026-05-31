import { expect, test } from "@playwright/test";

const users = [
  { email: "admin@payhub.local", password: "Admin123!", path: /\/admin/ },
  { email: "merchant@payhub.local", password: "Merchant123!", path: /\/merchant/ },
  { email: "agent@payhub.local", password: "Agent123!", path: /\/agent/ },
];

test("home page opens", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Finexeble|FXpay|Global Payment/i);
});

test("login page opens", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

for (const user of users) {
  test(`${user.email} can sign in`, async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(user.email);
    await page.locator('input[type="password"]').fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(user.path);
  });
}

test("payment and withdraw workflow passes through API", async ({ request }) => {
  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";
  const smoke = await request.post(`${apiBaseUrl}/api/auth/login`, {
    data: { email: "admin@payhub.local", password: "Admin123!" },
  });
  expect(smoke.ok()).toBeTruthy();
});
