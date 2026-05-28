import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class ShopPage extends BasePage {
  readonly heading: Locator;
  readonly addToCartButtons: Locator;
  readonly viewCartLink: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Product Showcase" });
    this.addToCartButtons = page.getByRole("button", { name: "Add to Cart" });
    this.viewCartLink = page.getByRole("link", { name: /View cart/i });
    this.toast = page.locator('[role="status"]');
  }

  async open(): Promise<void> {
    await this.goto("/");
    await this.heading.waitFor({ state: "visible", timeout: 15_000 });
  }

  async addFirstProductToCart(): Promise<void> {
    await this.addToCartButtons.first().click();
    await this.toast.waitFor({ state: "visible" });
  }

  async goToCart(): Promise<void> {
    await this.viewCartLink.click();
  }
}
