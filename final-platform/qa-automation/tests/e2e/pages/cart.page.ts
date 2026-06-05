import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class CartPage extends BasePage {
  readonly heading: Locator;
  readonly proceedToCheckout: Locator;
  readonly emptyHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Shopping Cart" });
    this.proceedToCheckout = page.getByRole("link", { name: "Proceed to checkout" });
    this.emptyHeading = page.getByRole("heading", { name: "Your cart is empty" });
  }

  async open(): Promise<void> {
    await this.goto("/cart");
  }

  async proceed(): Promise<void> {
    await this.proceedToCheckout.click();
  }
}
