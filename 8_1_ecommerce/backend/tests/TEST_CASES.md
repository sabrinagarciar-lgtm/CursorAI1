# ShopEase Checkout — Test Case Catalog

Comprehensive manual and automated test coverage for the e-commerce checkout process.

| Metric | Count |
|--------|------:|
| **Total test cases** | **45** |
| Positive | 10 |
| Negative | 15 |
| Edge cases | 8 |
| Security | 12 |
| Unit (security + payment) | 16 parametrized scenarios |

All backend cases are automated in **pytest** under `backend/tests/`. Frontend cart state cases are automated in **Vitest** under `frontend/src/`.

---

## Test data generation strategy

| Layer | Location | Purpose |
|-------|----------|---------|
| Catalog constants | `tests/helpers/test_data.py` | Product IDs, discount codes, test cards aligned with seeded DB |
| Payload factories | `build_checkout_payload()`, `build_cart_items()`, `build_payment()` | Compose valid/invalid requests without duplication |
| Baseline fixtures | `conftest.py` → `checkout_payload`, `read_email_log` | Fresh DB + email log per test |
| Edge generators | `bulk_quantity_payload()`, `SQL_INJECTION_PAYLOADS` | Boundaries and attack strings |
| Isolation | Temp SQLite file per test run | No cross-test order pollution |

---

## Positive scenarios — successful checkout flow

| ID | Title | Steps | Expected result | Automated |
|----|-------|-------|-----------------|-----------|
| TC-P01 | List products | `GET /api/products` | 200, ≥6 products with id/title/price | `test_tc_p01_list_products_returns_catalog` |
| TC-P02 | Single-item checkout | Add 1 product, valid payment | 201, status confirmed, total = subtotal | `test_tc_p02_single_item_checkout_success` |
| TC-P03 | Multi-item checkout | 2+ products in one order | 201, multiple line items | `test_tc_p03_multi_item_checkout_success` |
| TC-P04 | Valid discount codes | SAVE10 / WELCOME20 / FLAT15 at checkout | Discount applied, total reduced | `test_tc_p04_checkout_with_valid_discount_codes` |
| TC-P05 | Discount validation API | POST validate with SAVE10 | valid=true, amount returned | `test_tc_p05_discount_validation_returns_amount` |
| TC-P06 | Order confirmation | Checkout then GET order by ID | 200, matching order_id | `test_tc_p06_order_confirmation_retrievable_by_id` |
| TC-P07 | Email notification sent | Successful checkout | JSONL log entry created | `test_tc_p07_email_notification_logged_on_success` |
| TC-P08 | Email content | Read email log | Subject + product names present | `test_tc_p08_email_contains_order_summary` |
| TC-P09 | PCI: last4 only | Inspect order response | payment_last4=1111, no full PAN | `test_tc_p09_payment_stores_only_last_four_digits` |
| TC-P10 | Checkout without discount | No discount_code field | discount_amount=0 | `test_tc_p10_checkout_without_discount_code` |

---

## Negative scenarios — failures and validation errors

| ID | Title | Input | Expected result | Automated |
|----|-------|-------|-----------------|-----------|
| TC-N01 | Empty cart | items=[] | 400, empty cart message | `test_tc_n01_empty_cart_rejected` |
| TC-N02 | Invalid discount | NOTREAL | 400, invalid code | `test_tc_n02_invalid_discount_code_rejected` |
| TC-N03 | Expired discount | EXPIRED | 400, expired message | `test_tc_n03_expired_discount_code_rejected` |
| TC-N04 | Below minimum order | WELCOME20 @ $34.99 | 400, minimum order message | `test_tc_n04_discount_below_minimum_order` |
| TC-N05 | Luhn failure | 4111111111111112 | 400, invalid card | `test_tc_n05_invalid_luhn_card_rejected` |
| TC-N06 | Declined card | 4000000000000002 | 400, declined | `test_tc_n06_declined_card_rejected` |
| TC-N07 | Invalid CVV | 12 or 12345 | 400, CVV error | `test_tc_n07_invalid_cvv_rejected` |
| TC-N08 | Expired card | expiry 01/20 | 400, card expired | `test_tc_n08_expired_card_rejected` |
| TC-N09 | Bad expiry format | 2026-12 | 400, format error | `test_tc_n09_invalid_expiry_format_rejected` |
| TC-N10 | Invalid email | not-an-email | 400, email error | `test_tc_n10_invalid_email_rejected` |
| TC-N11 | Unknown product | product_id 999 | 400, not found | `test_tc_n11_unknown_product_rejected` |
| TC-N12 | Zero quantity | quantity=0 | 400, quantity error | `test_tc_n12_zero_quantity_rejected` |
| TC-N13 | Order not found | GET /orders/DOESNOTEXIST | 404 | `test_tc_n13_order_not_found_returns_404` |
| TC-N14 | Empty discount code | code="" | 400 | `test_tc_n14_empty_discount_code_rejected` |
| TC-N15 | Short card number | 411111 | 400 | `test_tc_n15_short_card_number_rejected` |

---

## Edge cases — boundaries and concurrency

| ID | Title | Scenario | Expected result | Automated |
|----|-------|----------|-----------------|-----------|
| TC-E01 | Large cart quantity | 50× same item | 201, correct subtotal | `test_tc_e01_large_cart_quantity_checkout` |
| TC-E02 | Many distinct SKUs | 3 products one order | 201, 3 line items | `test_tc_e02_multiple_distinct_products_in_one_order` |
| TC-E03 | Concurrent purchases | Two checkouts back-to-back | Unique order IDs | `test_tc_e03_sequential_concurrent_purchases_create_unique_orders` |
| TC-E04 | Single-use discount | VIP50 twice | 1st 201, 2nd usage limit | `test_tc_e04_vip50_single_use_limit_enforced` |
| TC-E05 | Fixed discount cap | FLAT15 on $30 order | discount_amount=15 | `test_tc_e05_flat_discount_capped_at_subtotal` |
| TC-E06 | Negative quantity | quantity=-1 | 400 | `test_tc_e06_remove_item_equivalent_zero_quantity` |
| TC-E07 | Spaced card number | 4111 1111 1111 1111 | 201 (Luhn after strip) | `test_tc_e07_checkout_with_spaced_card_number` |
| TC-E08 | Amex 4-digit CVV | 378282246310005 + 1234 | 201 | `test_tc_e08_amex_four_digit_cvv_accepted` |

---

## Security scenarios — PCI-style validation & injection prevention

| ID | Title | Attack / check | Expected result | Automated |
|----|-------|----------------|-----------------|-----------|
| TC-S01 | SQLi in discount | `'; DROP TABLE` in code | 400, unsafe | `test_tc_s01_sql_injection_in_discount_code_blocked` |
| TC-S02 | SQLi in name | `'); DROP TABLE` | 400, unsafe | `test_tc_s02_sql_injection_in_customer_name_blocked` |
| TC-S03 | SQLi in email | `' OR '1'='1` | 400 | `test_tc_s03_sql_injection_in_email_blocked` |
| TC-S04 | UNION in cardholder | `UNION SELECT` | 400 | `test_tc_s04_union_injection_in_cardholder_name_blocked` |
| TC-S05 | DB integrity | After injection attempts | Products API still works | `test_tc_s05_database_intact_after_injection_attempts` |
| TC-S06 | Oversized input | 101-char name | 400 | `test_tc_s06_oversized_customer_name_rejected` |
| TC-S07 | SQLi in card field | `'; DROP` in PAN | 400 | `test_tc_s07_sql_payload_in_card_number_rejected` |
| TC-S08 | PAN not in API response | Full card in response body | Absent | `test_tc_s08_full_pan_not_in_order_response` |
| TC-S09 | PAN not in email log | Full card in JSONL | Absent | `test_tc_s09_full_pan_not_in_email_log` |
| TC-S10 | Parameterized lookup | `' OR '1'='1` order ID | 404, no leak | `test_tc_s10_order_lookup_uses_parameterized_query` |
| TC-S11 | last4 length | payment_last4 field | Exactly 4 chars | `test_tc_s11_successful_order_does_not_persist_full_card` |
| TC-S12 | Malicious product ID | `; DELETE FROM` in ID | 400, not found | `test_tc_s12_delete_injection_in_product_id_rejected` |

---

## Frontend cart state (Vitest)

| ID | Title | Expected | Automated |
|----|-------|----------|-----------|
| TC-F01 | Add to cart | itemCount increments | `adds item to cart` |
| TC-F02 | Increment quantity | Same product adds qty | `increments quantity for same product` |
| TC-F03 | Update quantity | Subtotal recalculates | `updates quantity and subtotal` |
| TC-F04 | Remove item | Item removed, count 0 | `removes item from cart` |
| TC-F05 | Clear cart | items=[], discount cleared | `clears cart and discount` |
| TC-F06 | Empty subtotal | No items → subtotal 0 | `returns zero subtotal for empty cart` |

---

## Running automated tests

### Backend (pytest)

```bash
cd "8_1_ecommerce testing/backend"
source .venv/bin/activate
pytest -v --tb=short
pytest -m positive    # positive only
pytest -m security    # security only
```

### Frontend (Vitest)

```bash
cd "8_1_ecommerce testing/frontend"
npm test
```

---

## Acceptance criteria checklist

- [x] 30+ test cases across all categories (45 cataloged)
- [x] Positive checkout paths covered
- [x] Negative payment/discount failures covered
- [x] Edge cases: empty cart, limits, concurrency
- [x] Security: payment validation, SQL injection, PCI last4
- [x] Automated pytest + Vitest scripts
- [x] Test data generation strategy documented
