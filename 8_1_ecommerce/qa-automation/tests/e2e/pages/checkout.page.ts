import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export interface CheckoutFormData {
  name: string;
  email: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName?: string;
  discountCode?: string;
}

export class CheckoutPage extends BasePage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly discountInput: Locator;
  readonly applyDiscountButton: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvvInput: Locator;
  readonly payButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Checkout" });
    this.nameInput = page.getByPlaceholder("Jane Doe").first();
    this.emailInput = page.getByPlaceholder("jane@example.com");
    this.discountInput = page.getByPlaceholder(/SAVE10/i);
    this.applyDiscountButton = page.getByRole("button", { name: "Apply" });
    this.cardNumberInput = page.getByPlaceholder("4111 1111 1111 1111");
    this.expiryInput = page.getByPlaceholder("MM/YY");
    this.cvvInput = page.getByPlaceholder("123");
    this.payButton = page.getByRole("button", { name: /Pay /i });
  }

  async open(): Promise<void> {
    await this.goto("/checkout");
  }

  async fillContact(name: string, email: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
  }

  async applyDiscount(code: string): Promise<void> {
    await this.discountInput.fill(code);
    await this.applyDiscountButton.click();
  }

  async fillPayment(data: CheckoutFormData): Promise<void> {
    await this.cardNumberInput.fill(data.cardNumber);
    await this.expiryInput.fill(data.expiry);
    await this.cvvInput.fill(data.cvv);
    if (data.cardholderName) {
      const nameOnCard = this.page.getByPlaceholder("Jane Doe").last();
      await nameOnCard.fill(data.cardholderName);
    }
  }

  async submitPayment(): Promise<void> {
    await this.payButton.click();
  }

  async completeCheckout(data: CheckoutFormData): Promise<void> {
    await this.fillContact(data.name, data.email);
    if (data.discountCode) {
      await this.applyDiscount(data.discountCode);
    }
    await this.fillPayment(data);
    await this.submitPayment();
  }
}
