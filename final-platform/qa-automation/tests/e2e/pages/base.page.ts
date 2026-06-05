import type { Page, Locator } from "@playwright/test";

/**
 * Base Page Object — shared navigation and utilities for ShopEase E2E tests.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path = "/"): Promise<void> {
    await this.page.goto(path);
  }

  navLink(name: string): Locator {
    return this.page.getByRole("link", { name });
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }
}
