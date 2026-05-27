# ShopEase API Test Case Catalog (8_2_API_test)

Comprehensive API test suite covering authentication, authorization, CRUD, validation, errors, performance, and rate limiting — plus retained checkout tests from 8_1.

---

## Authentication (`pytest -m auth`)

| ID | Test | Method | Expected |
|----|------|--------|----------|
| AUTH-01 | Valid login | POST `/api/auth/login` | 200 + JWT |
| AUTH-02 | Invalid password | POST `/api/auth/login` | 401 |
| AUTH-03 | Unknown email | POST `/api/auth/login` | 401 |
| AUTH-04 | Register new user | POST `/api/auth/register` | 201 + token |
| AUTH-05 | Duplicate email | POST `/api/auth/register` | 400 |
| AUTH-06 | Profile with valid token | GET `/api/auth/me` | 200 |
| AUTH-07 | Profile without token | GET `/api/auth/me` | 401 |
| AUTH-08 | Malformed JWT | GET `/api/auth/me` | 401 |
| AUTH-09 | Expired JWT | GET `/api/auth/me` | 401 |
| AUTH-10 | Invalid signature | GET `/api/users` | 401 |

---

## Authorization (`pytest -m authorization`)

| ID | Test | Role | Expected |
|----|------|------|----------|
| AUTHZ-01 | Customer cannot list users | customer | 403 |
| AUTHZ-02 | Admin can list users | admin | 200 |
| AUTHZ-03 | Customer cannot create product | customer | 403 |
| AUTHZ-04 | Admin can create product | admin | 201 |
| AUTHZ-05 | Customer reads own profile | customer | 200 |
| AUTHZ-06 | Customer cannot read admin profile | customer | 403 |
| AUTHZ-07 | Admin deletes order | admin | 204 |
| AUTHZ-08 | Customer cannot delete order | customer | 403 |
| AUTHZ-09 | Admin creates user | admin | 201 |
| AUTHZ-10 | Unauthenticated create user | — | 401 |
| AUTHZ-11 | Customer cannot GET peer’s order | customer | 403 |

---

## CRUD (`pytest -m crud`)

| Resource | GET list | GET one | POST | PUT | DELETE |
|----------|----------|---------|------|-----|--------|
| Products | ✅ public | ✅ | ✅ admin | ✅ admin | ✅ admin |
| Users | ✅ admin | ✅ self/admin | ✅ admin | ✅ self/admin | ✅ admin |
| Orders | ✅ auth | ✅ auth | ✅ auth | ✅ auth/admin | ✅ admin |

---

## Orders — My Orders / All Orders (`pytest -m orders`)

Tests for the `/orders` frontend and role-scoped `GET /api/orders` behavior.

| ID | Test | Role | Expected |
|----|------|------|----------|
| ORD-01 | List orders without token | — | 401 |
| ORD-02 | Customer list excludes other users’ orders | customer | 200, own IDs only |
| ORD-03 | Second customer sees only their orders | customer | 200, isolated set |
| ORD-04 | Admin list includes all customers | admin | 200, all IDs |
| ORD-05 | Customer with no orders | customer | 200, `[]` |
| ORD-06 | List payload shape (items, dates, totals) | customer | 200, required fields |
| ORD-07 | Customer GET own order by id | customer | 200 |
| ORD-08 | Customer GET other’s order | customer | 403 |
| ORD-09 | Admin GET any order | admin | 200 |
| ORD-10 | Owned order GET without token | — | 401 |
| ORD-11 | Guest checkout GET without token | — | 200, `user_id` null |
| ORD-12 | Guest checkout not in customer list | customer | guest ID absent |
| ORD-13 | Authenticated checkout in customer list | customer | order present + `user_id` |
| ORD-14 | Checkout with Bearer sets `user_id` | customer | response + DB link |
| ORD-15 | Guest checkout leaves `user_id` null | — | no ownership |

**Also covered in authorization:** AUTHZ-11 — customer cannot GET peer order (403).

---


## Input Validation (`pytest -m validation`)

| ID | Scenario | Expected |
|----|----------|----------|
| VAL-01 | Short password on register | 400 |
| VAL-02 | Invalid email | 400 |
| VAL-03 | Product missing title | 400 |
| VAL-04 | Negative product price | 400 |
| VAL-05 | Order with empty items | 400 |
| VAL-06 | Order with unknown product | 400 |
| VAL-07 | Invalid user role | 400 |
| VAL-08 | Invalid order status | 400 |

---

## Error Handling (`pytest -m errors`)

| ID | Scenario | Status |
|----|----------|--------|
| ERR-01 | Unknown product | 404 |
| ERR-02 | Unknown user | 404 |
| ERR-03 | Unknown order | 404 |
| ERR-04 | Delete unknown user | 404 |
| ERR-05 | Empty cart checkout | 400 |
| ERR-06 | Unknown API route | 404 |
| ERR-07 | Simulated server error | 500 |

---

## Performance (`pytest -m performance`)

All endpoints must respond in **< 500ms** (test client, local).

| ID | Endpoint |
|----|----------|
| PERF-01 | GET `/api/products` |
| PERF-02 | GET `/api/products/1` |
| PERF-03 | POST `/api/auth/login` |
| PERF-04 | GET `/api/orders` |
| PERF-05 | POST `/api/orders` |
| PERF-06 | GET `/api/orders` (admin, with data) |

---

## Rate Limiting (`pytest -m rate_limit`)

| ID | Scenario | Expected |
|----|----------|----------|
| RL-01 | Exceed 5 req/min limit | 429 after threshold |
| RL-02 | Limit disabled in default tests | all 200 |

---

## Checkout Tests (from 8_1)

Retained in `test_positive.py`, `test_negative.py`, `test_edge_cases.py`, `test_security.py`, `test_unit.py` — see original 8_1 catalog for TC-P*, TC-N*, TC-E*, TC-S*, TC-U* cases.
