import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class ConfirmationPage extends BasePage {
  readonly orderConfirmed: Locator;

  constructor(page: Page) {
    super(page);
    this.orderConfirmed = page.getByText("Order confirmed");
  }

  async expectSuccess(): Promise<void> {
    await this.orderConfirmed.waitFor({ state: "visible", timeout: 20_000 });
  }

  orderIdLocator(): Locator {
    return this.page.getByText(/Order #/i);
  }
}
