import { test, expect } from "@playwright/test";
import { ShopPage } from "../pages/shop.page";

test.describe("Shop page @e2e", () => {
  test("displays product catalog and add-to-cart flow", async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.open();

    await expect(shop.heading).toBeVisible();
    await expect(shop.addToCartButtons.first()).toBeVisible();

    await shop.addFirstProductToCart();
    await expect(shop.toast).toContainText(/added to cart/i);
    await expect(shop.viewCartLink).toBeVisible();
  });
});
