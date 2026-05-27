import { chromium } from "playwright";

const base = "http://localhost:5174";
const outDir = "docs/screenshots";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(base);
  await page.getByRole("button", { name: /Add Wireless Bluetooth Headphones to cart/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/02-cart-with-items.png`, fullPage: true });

  await page.getByRole("link", { name: "Checkout", exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/03-checkout-with-items.png`, fullPage: true });

  const checkoutResponse = await page.request.post("http://127.0.0.1:5051/api/checkout", {
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
  await page.goto(`${base}/confirmation/${orderId}`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/04-order-confirmation.png`, fullPage: true });

  await browser.close();
}

main();
