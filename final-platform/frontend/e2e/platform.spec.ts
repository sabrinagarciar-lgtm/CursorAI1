import { test, expect } from "@playwright/test";

async function loginAsCustomer(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/login/);
}

test.describe("CursorHub Platform E2E", () => {
  test("home page shows all feature modules", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "CursorHub Final Platform" })).toBeVisible();
    await expect(page.getByText("Product Search")).toBeVisible();
    await expect(page.getByText("Kanban Board")).toBeVisible();
    await expect(page.getByText("Social Feed")).toBeVisible();
    const hero = page.getByRole("heading", { name: "CursorHub Final Platform" }).locator("..");
    await expect(hero.getByRole("link", { name: /sign in/i })).toHaveCount(0);
    await expect(hero.getByRole("link", { name: "Browse Products" })).toBeVisible();
  });

  test("search page loads products", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText("Wireless Bluetooth Headphones")).toBeVisible({ timeout: 10000 });
  });

  test("shop route redirects to search", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveURL(/\/search/);
  });

  test("product search filters work", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByTestId("search-page")).toBeVisible();
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("headphones");
      await expect(page.getByText(/headphone/i).first()).toBeVisible();
    }
  });

  test("settings panel renders tabs for logged-in user", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/settings");
    await expect(page.getByTestId("settings-page")).toBeVisible();
    await expect(page.getByRole("tab", { name: /profile/i })).toBeVisible();
    await expect(page.getByText(/signed in as/i)).toBeVisible();
  });

  test("dark mode toggle applies theme class", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/settings");
    await page.getByRole("tab", { name: /appearance/i }).click();
    await page.locator('select[name="theme"]').selectOption("dark");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.locator('select[name="theme"]').selectOption("light");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("analytics dashboard loads", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByTestId("analytics-page")).toBeVisible();
  });

  test("kanban board renders columns", async ({ page }) => {
    await page.goto("/kanban");
    await expect(page.getByTestId("kanban-page")).toBeVisible();
    await expect(page.getByText("Todo")).toBeVisible();
  });

  test("social feed renders", async ({ page }) => {
    await page.goto("/social");
    await expect(page.getByTestId("social-page")).toBeVisible();
  });

  test("tickets page allows creation", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page.getByTestId("tickets-page")).toBeVisible();
    await page.getByPlaceholder("Title").fill("E2E Test Ticket");
    await page.getByPlaceholder("Description").fill("Created by Playwright test");
    await page.getByRole("button", { name: /submit ticket/i }).click();
    await expect(page.getByText(/ticket created/i)).toBeVisible();
  });

  test("navigation between modules", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Shop", exact: true })).toHaveCount(0);
    await nav.getByRole("link", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/search/);
    await nav.getByRole("link", { name: "Analytics", exact: true }).click();
    await expect(page).toHaveURL(/analytics/);
    await nav.getByRole("link", { name: "Kanban", exact: true }).click();
    await expect(page).toHaveURL(/kanban/);
  });
});
