/**
 * k6 load test for ShopEase API
 * Run: k6 run performance/k6-load-test.js
 * Env: API_BASE_URL (default http://127.0.0.1:5051)
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const productsDuration = new Trend("products_duration", true);

const BASE = __ENV.API_BASE_URL || "http://127.0.0.1:5051";

const thresholds = JSON.parse(open("./performance-thresholds.json"));
const k6Thresholds = thresholds.k6?.thresholds || {
  http_req_duration: ["p(95)<500"],
  http_req_failed: ["rate<0.01"],
};

export const options = {
  vus: Number(__ENV.K6_VUS || thresholds.k6?.vus || 10),
  duration: __ENV.K6_DURATION || thresholds.k6?.duration || "30s",
  thresholds: k6Thresholds,
};

const checkoutPayload = JSON.stringify({
  customer_name: "Load Test User",
  customer_email: "loadtest@shopease.test",
  items: [{ product_id: "1", quantity: 1 }],
  payment: {
    card_number: "4111111111111111",
    expiry: "12/30",
    cvv: "123",
    cardholder_name: "Load Test",
  },
});

export default function () {
  const productsRes = http.get(`${BASE}/api/products`);
  productsDuration.add(productsRes.timings.duration);
  const productsOk = check(productsRes, {
    "products status 200": (r) => r.status === 200,
    "products has catalog": (r) => {
      try {
        return JSON.parse(r.body).length >= 1;
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!productsOk);

  const discountRes = http.post(
    `${BASE}/api/discounts/validate`,
    JSON.stringify({ code: "SAVE10", subtotal: 50 }),
    { headers: { "Content-Type": "application/json" } }
  );
  const discountOk = check(discountRes, {
    "discount status 200": (r) => r.status === 200,
  });
  errorRate.add(!discountOk);

  if (__VU % 5 === 0) {
    const checkoutRes = http.post(`${BASE}/api/checkout`, checkoutPayload, {
      headers: { "Content-Type": "application/json" },
    });
    const checkoutOk = check(checkoutRes, {
      "checkout status 201": (r) => r.status === 201,
    });
    errorRate.add(!checkoutOk);
  }

  sleep(0.3);
}

export function handleSummary(data) {
  return {
    "../results/performance/k6-summary.json": JSON.stringify(data, null, 2),
  };
}
