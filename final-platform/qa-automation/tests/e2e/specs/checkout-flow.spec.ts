import { test, expect } from "@playwright/test";
import { ShopPage } from "../pages/shop.page";
import { CartPage } from "../pages/cart.page";
import { CheckoutPage } from "../pages/checkout.page";
import { ConfirmationPage } from "../pages/confirmation.page";
import { E2E_CHECKOUT } from "../fixtures/test-data";

test.describe("Checkout flow @e2e @smoke", () => {
  test("complete purchase from shop to confirmation", async ({ page }) => {
    const shop = new ShopPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    const confirmation = new ConfirmationPage(page);

    await shop.open();
    await shop.addFirstProductToCart();
    await shop.goToCart();

    await expect(cart.heading).toBeVisible();
    await cart.proceed();

    await expect(checkout.heading).toBeVisible();
    await checkout.completeCheckout({
      name: E2E_CHECKOUT.customer.name,
      email: E2E_CHECKOUT.customer.email,
      ...E2E_CHECKOUT.payment,
      discountCode: E2E_CHECKOUT.discount.valid,
    });

    await confirmation.expectSuccess();
    await expect(confirmation.orderIdLocator()).toBeVisible();
    await expect(page).toHaveURL(/\/confirmation\//);
  });
});
