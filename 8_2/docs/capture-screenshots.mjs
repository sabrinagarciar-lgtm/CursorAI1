import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.SHOPEASE_URL ?? "http://localhost:5175";
const apiBase = process.env.SHOPEASE_API ?? "http://127.0.0.1:5052";
const outDir = path.join(__dirname, "screenshots");

const CUSTOMER = {
  email: "customer@shopease.com",
  password: "customer12345",
};

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1 — Shop
  await page.goto(base);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: path.join(outDir, "01-shop-page.png"), fullPage: true });

  // 2 — Cart
  await page
    .getByRole("button", { name: /Add Wireless Bluetooth Headphones to cart/i })
    .click();
  await page.waitForTimeout(400);
  await page.getByRole("navigation").getByRole("link", { name: /^Cart/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "02-cart-with-items.png"), fullPage: true });

  // 3 — Sign in
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "03-sign-in.png"), fullPage: true });
  await page.getByLabel("Email").fill(CUSTOMER.email);
  await page.getByLabel("Password").fill(CUSTOMER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(base + "/");
  await page.waitForTimeout(500);

  // 4 — Checkout
  await page.getByRole("link", { name: "Checkout", exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "04-checkout.png"), fullPage: true });

  const checkoutResponse = await page.request.post(`${apiBase}/api/checkout`, {
    headers: {
      Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem("shopease_token"))}`,
      "Content-Type": "application/json",
    },
    data: {
      customer_name: "Jane Doe",
      customer_email: "jane@example.com",
      discount_code: "SAVE10",
      items: [{ product_id: "1", quantity: 1 }],
      payment: {
        card_number: "4111111111111111",
        expiry: "12/30",
        cvv: "123",
        cardholder_name: "Jane Doe",
      },
    },
  });
  const checkoutBody = await checkoutResponse.json();
  const orderId = checkoutBody.order.order_id;

  // 5 — Confirmation
  await page.goto(`${base}/confirmation/${orderId}`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "05-order-confirmation.png"), fullPage: true });

  // 6 — My Orders (customer)
  await page.goto(`${base}/orders`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "06-my-orders.png"), fullPage: true });

  await browser.close();
  console.log("Screenshots saved to", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
