## Blog Platform API (PostgreSQL)

### Project overview

**Goal:** Create a Flask project structure with **SQLAlchemy**, **Marshmallow**, **JWT authentication**, and **Swagger UI**. Add **Redis caching** (via **Flask-Caching**) and **comprehensive tests** (pytest, branch coverage gate).

What you get in this repo: a **PostgreSQL 18**–aligned blog REST API with **bcrypt** passwords, **Flask-JWT-Extended** access + refresh rotation, **flask-smorest** OpenAPI + Swagger UI, plural **`/api/*`** routes, **`{ "data", "meta" }`** JSON envelopes and pagination, **bleach** sanitization, **Flask-Limiter** rate limits, **optional Redis** (or in-process **SimpleCache**) for post list/detail reads with **generation-based cache invalidation**, and a **pytest** suite split into fast unit tests and optional **PostgreSQL integration** tests.

### Project layout

```text
blog-platform-api/
├── app/                          # Flask application package
│   ├── __init__.py               # Application factory; db, JWT, Marshmallow, cache, API registration
│   ├── caching/                  # Versioned cache keys + serialized post payloads for Flask-Caching
│   │   ├── post_payloads.py
│   │   └── versioned_keys.py
│   ├── models/                   # SQLAlchemy ORM (users, posts, categories, comments, refresh tokens, …)
│   ├── routes/                   # Blueprints: categories, errors, posts, search, sessions, users; demo page
│   ├── schemas/                  # Marshmallow serialization/validation
│   ├── utils/                    # Sanitization, slug helpers
│   ├── templates/
│   │   └── demo.html             # Local demo UI (links to Swagger; sample accounts after seed)
│   ├── db_bootstrap.py           # `flask init-db`
│   └── seed_demo.py              # `flask seed-demo`
├── tests/                        # Pytest (`conftest.py`, `helpers.py`)
├── docs/
│   └── postgresql_schema.sql     # Reference DDL, indexes, triggers
├── config.py                     # Config classes; Cloud SQL / Redis / cache env wiring
├── run.py                        # `python run.py`
├── docker-compose.yml            # Optional local PostgreSQL (Redis: install on host — see below)
├── pyproject.toml                # pytest + coverage (omit list, fail-under threshold)
├── requirements.txt
├── .env.example
└── README.md
```

### API design

Flask REST API aligned with the **PostgreSQL blogging schema** (`users`, `refresh_tokens`, hierarchical `categories`, UUID `posts` with generated `search_vector`, M2M `post_categories` / `post_tags`, threaded `comments`, enums, JSONB). Uses **SQLAlchemy**, **Marshmallow**, **Flask‑JWT‑Extended**, and **Swagger UI** via **flask-smorest**.

- **HTTP verbs:** resource collections use `GET`/`POST`; single resources use `GET`/`PUT`/`DELETE` as appropriate. **Statuses:** `201` for creates, `200` for reads/updates that return JSON, **`204`** for deletes without a body.
- **Plural nouns:** collection paths include `/api/users`, `/api/sessions`, `/api/posts`, `/api/categories`, `/api/searches`.
- **Pagination:** lists that can grow (`posts`, `categories`, FTS results, **`comments`** on a post) accept **`page`** and **`per_page`** query parameters with standard `meta` pages/totals.
- **JSON shape:** JSON responses use **`{ "data": …, "meta": … }`**. Pagination metadata lives under `meta` (omit or `null` when not applicable). **Errors** stay flat `{ "code", "error", "message" }`.

### Prerequisites

1. **PostgreSQL 18.x** locally or remote — project uses enums, JSONB, generated `search_vector`, and Cloud SQL-compatible connection patterns below. Docker is **not** required: see **Quick start** for macOS Homebrew (or use `docker-compose.yml` if Docker is installed).
2. Optional: run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` before applying the DDL in `docs/postgresql_schema.sql`. You can bootstrap with `flask init-db`; production should rely on **`docs/postgresql_schema.sql`** (indexes/triggers/GIN parity).

### Google Cloud SQL instance (PostgreSQL 18.3)

**Connection resource name**

`gd-gcp-gridu-genai:us-central1:appuser1`

(This is wired as **`CLOUDSQL_INSTANCE_CONNECTION_NAME`** and as `config.DEFAULT_CLOUDSQL_CONNECTION_NAME`; override via env without code changes.)

**Option A — Cloud SQL Auth Proxy (typical laptop / pipelines)**

1. Install the proxy ([install guide](https://cloud.google.com/sql/docs/postgres/sql-proxy)): e.g. on macOS, `brew install cloud-sql-proxy`.
2. Sign in once so the proxy can reach your project:  
   `gcloud auth application-default login`  
   (`gcloud` must use a principal that may connect to `gd-gcp-gridu-genai:us-central1:appuser1`.)
3. In **terminal 1**, run the proxy (default listens on **`127.0.0.1:5432`**):

```bash
cloud-sql-proxy "gd-gcp-gridu-genai:us-central1:appuser1"
```

Stop any **local** Postgres also bound to `:5432`, or bind the proxy elsewhere and change your port:

```bash
cloud-sql-proxy --port 5433 "gd-gcp-gridu-genai:us-central1:appuser1"
# DATABASE_URL …@127.0.0.1:5433/… in .env
```

4. Keep **`DATABASE_URL`** in `.env` as **`127.0.0.1`** + that port — e.g. `appuser2` / `blog_platform_sab` (Cloud SQL roles). **Terminal 2:** `source .venv/bin/activate`, `flask init-db`, `flask seed-demo`, `python run.py`.

**Option B — Unix socket (Cloud Run, GKE, or VM with `/cloudsql` connector)**

Used when Postgres is reachable only via the **`/cloudsql/PROJECT:REGION:INSTANCE`** path:

```bash
export CLOUD_SQL_CONNECT_MODE=unix_socket
export PGUSER=USER
export PGPASSWORD=PASSWORD
export PGDATABASE=DATABASE
# CLOUDSQL_INSTANCE_CONNECTION_NAME defaults to gd-gcp-gridu-genai:us-central1:appuser1
```

The app builds  
`postgresql+psycopg://…@/?host=/cloudsql/gd-gcp-gridu-genai:us-central1:appuser1`  
(or `CLOUDSQL_UNIX_SOCKET_HOST` if you need a nonstandard mount).

**Option C — VPC / private IP**

Set `DATABASE_URL` to host + port reachable from where the Flask process runs:

```bash
export DATABASE_URL="postgresql+psycopg://USER:PASSWORD@PRIVATE_IP:5432/DATABASE"
```

Environment templates: **`.env.example`**. Secrets load via **`python-dotenv`** (`load_dotenv()` is called inside `create_app()`).

### Quick start

You need **PostgreSQL listening on `127.0.0.1:5432`** (or set `DATABASE_URL` to match your install). If `docker` is not installed, use **Homebrew Postgres on macOS** (below). **`docker-compose.yml`** stays available when Docker *is* installed.

#### A. macOS without Docker — Homebrew Postgres (common)

Install and start Postgres, create the database (role is your login user; no password in the URL):

```bash
brew install postgresql@18
export PATH="$(brew --prefix postgresql@18)/bin:$PATH"
brew services start postgresql@18

createdb blog_platform 2>/dev/null || true
export DATABASE_URL="postgresql+psycopg://${USER}@127.0.0.1:5432/blog_platform"
```

(`createdb` is optional — `flask init-db` creates the **`blog_platform`** database on PostgreSQL when your login is allowed to `CREATE DATABASE`.)

If **`brew`** is missing, install it from https://brew.sh or use another Postgres installer (e.g. [Postgres.app](https://postgresapp.com/), then adjust `DATABASE_URL`).

#### Optional — Redis cache (no Docker)

Caching uses **Redis only if you set `REDIS_URL`**; otherwise the app uses **in-process `SimpleCache`**. Run Redis on the host (not in Docker):

```bash
# macOS (Homebrew)
brew install redis
brew services start redis
export REDIS_URL="redis://127.0.0.1:6379/0"
```

```bash
# Debian / Ubuntu (example)
sudo apt update && sudo apt install -y redis-server
sudo systemctl start redis-server
export REDIS_URL="redis://127.0.0.1:6379/0"
```

Default `config.CACHE_REDIS_URL` already points at `127.0.0.1:6379`; set **`REDIS_URL`** (or `CACHE_REDIS_URL`) if your server listens elsewhere.

#### B. Optional — Docker (Postgres only — if `docker compose` works)

```bash
cd exercise7_1/blog-platform-api
docker compose up -d postgres
export DATABASE_URL="postgresql+psycopg://postgres:postgres@127.0.0.1:5432/blog_platform"
# Use host Redis (see § above) if you want Flask-Caching on Redis; Docker Compose does not run Redis here.
```


#### Flask app bootstrap (same either way)

```bash
cd exercise7_1/blog-platform-api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# In this shell you should already have DATABASE_URL from §A or §B; if not, export it now.


export FLASK_APP=run.py

flask init-db
flask seed-demo
python run.py
```

If port **5432** is already used, stop the other Postgres, or map a different host port in `docker-compose.yml` (e.g. `"127.0.0.1:5433:5432"`) and use that port in `DATABASE_URL`.

Demo UI: `http://127.0.0.1:5000/demo` (root `/` redirects here). After seeding, open the demo for sample posts; published JSON is at `/api/posts/<slug>` (**envelope**: `{"data":{...},"meta":null}`).

Swagger UI: `http://127.0.0.1:5000/swagger-ui` — OpenAPI: `http://127.0.0.1:5000/api-docs.json` — `GET /health`.

On macOS Sonoma and later, port **5000** is often occupied (e.g. AirPlay Receiver). If `python run.py` fails to bind or you get unexpected HTML, use another port: `PORT=5055 python run.py`, then open `http://127.0.0.1:5055/demo`.

Authenticated JSON payloads for a single post look like **`{"data": { ...post..., "comments": [] }, "meta": null}`**. Pagination for replies is **`GET /api/posts/<slug>/comments?page=…`**.

### Security

- **Passwords:** **bcrypt** (`bcrypt.hashpw`). Legacy passwords hashed with older Werkzeug schemes still validate until rotated.
- **JWT:** configurable access TTL (**`JWT_ACCESS_SECONDS`**); refresh rotation with DB-backed **`REFRESH_TOKEN_DAYS`**.
- **Input:** Marshmallow validation everywhere; **`bleach.clean`** strips tags from post and comment text before storage when clients send markup.
- **SQL:** **SQLAlchemy ORM** only (parameterized statements).
- **Rate limiting:** **Flask-Limiter** default limits plus **`RATELIMIT_AUTH`** on signup and session endpoints.
- **Production (`FLASK_ENV=production`):** secure session cookies, **Talisman** HSTS + CSP (Swagger CDN allowlisted), optional **`TALISMAN_FORCE_HTTPS`**. Use **`TRUST_PROXY_HEADERS=1`** behind TLS-terminating proxies. **HTTPS** is enforced at the edge (load balancer / ingress), not typically by Flask’s bundled server.

### Redis caching (`Flask-Caching`)

- **Redis** activates automatically when **`REDIS_URL`** is populated (override with **`CACHE_TYPE`** / **`CACHE_REDIS_URL`**); otherwise **`SimpleCache`** backs a single Flask worker (demo-friendly, not horizontally scalable).
- Cached surfaces: **`GET /api/posts`** (**`published`** and **`mine`** pages) plus **`GET /api/posts/<slug>`**. Payloads are the same JSON envelopes Marshmallow returns normally. Published detail lookups consult Redis **before** Postgres when caching is enabled.
- **Invalidation:** every **`POST` / `PUT` / `DELETE`** on posts bumps a numeric generation key (`blog:posts:cache_gen`). Keys embed that generation—no wildcard deletes.
- **Tune:** **`CACHE_POSTS_LIST_TTL`**, **`CACHE_POSTS_DETAIL_TTL`**, **`CACHE_DISABLED`**, **`CACHE_POSTS_ENABLED`** (documented below).
- **Local Redis:** install via your OS package manager (e.g. **`brew install redis`**) and **`export REDIS_URL=...`** — Redis is **not** started by this repo’s **`docker-compose.yml`**.

### Testing & coverage targets

The suite validates **JWT + Marshmallow + SQLAlchemy + caching** behavior end-to-end where a database exists, and keeps CI-friendly **offline** passes when Postgres is unreachable.

#### How to run

```bash
cd exercise7_1/blog-platform-api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

pytest                                         # pytest-cov branch coverage; gated subset ≥ 85 %
pytest --cov=app --cov-report=html             # optional HTML report — same omit list as CLI defaults above
pytest --override-ini="addopts="               # enumerate tests without coverage / fail_under
```

`pyproject.toml` sets **`pythonpath = ["."]`** so `import app` works without extra `PYTHONPATH`. Default **`addopts`** include **`--cov=app`** and **`fail_under = 85`** on a **measured subset**: several thin route modules / slugs / CLI seed files are **`omit`**’d intentionally (see **`[tool.coverage.run]`** in `pyproject.toml`); totals are meaningful for exercised layers (models, schemas, caching, errors, sanitization, categories route, integration paths).

#### Test suites and use cases (44 tests)

| File | What it exercises |
|------|-------------------|
| `test_http_without_db.py` | **Smoke:** `GET /health`, unknown path returns problem JSON (no DB). |
| `test_factory_and_uri.py` | **App factory:** production vs **testing** config (**SimpleCache** in tests), `DATABASE_URL` precedence. |
| `test_auth_schema_validation.py` | **RegisterSchema:** weak password / missing digit rejected; strong password accepted; pagination `meta` keyword. |
| `test_sanitize.py` | **bleach** wrapper strips markup; `None` round-trip. |
| `test_post_schema_excerpt.py` | Post excerpt prefers **summary**; truncates **content** when needed. |
| `test_post_payloads.py` | Cached **feed** payload empty list; **detail** serialization round-trip via Marshmallow. |
| `test_helpers_rbac.py` | **RBAC helpers:** enum normalization, admin flag, **post** view/manage rules, **comment** visibility (approved vs pending, author). |
| `test_cache_versioned_keys.py` | **Generation key** monotonic bump; list keys (`published` / `mine` + user id); **detail** keys differ by auth tier. |
| `test_posts_cache_unit.py` | **Flask-Caching** integration: cache reads off when disabled; **safe set** skips on generation race; writes suppressed when posts cache off. |
| `test_integration_posts_cache.py` | **PostgreSQL required:** health, public feed envelope, `mine` **401** without JWT, bad login **401**, duplicate email **409**, **cache hit** on second list/detail GET (spy on serializer), OpenAPI JSON, **generation** advances on post writes. **Skips** if DB unreachable. |

#### Results (expected)

- **Exit code:** `pytest` with default `addopts` must finish with **0** when coverage on the measured lines is **≥ 85 %** (branch-aware).
- **Typical coverage report** (measured modules only): about **91 %** total line + branch cover on `app/` after a full run; exact numbers depend on which integration tests ran.
- **Without PostgreSQL** (or when `DATABASE_URL` / `TEST_DATABASE_URL` cannot connect): the **9** tests in `test_integration_posts_cache.py` **skip**; the remaining **35** tests **pass** — still enough to satisfy the **85 %** gate on the omit-scoped tree.
- **With PostgreSQL** reachable (e.g. `docker compose up -d postgres` or Homebrew Postgres + `flask init-db`): all **44** tests **pass** (no skips from the DB fixture).

With **Postgres running** set `DATABASE_URL` (and optionally **`REDIS_URL`**) before pytest if you want the **9 integration tests** to execute instead of skip — same **`pyproject.toml`** coverage applies:

```bash
docker compose up -d postgres   # or use local Homebrew Postgres instead
export DATABASE_URL="${DATABASE_URL:-postgresql+psycopg://postgres:postgres@127.0.0.1:5432/blog_platform}"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"   # omit to use SimpleCache
pytest tests/ --cov=app --cov-report=term
```

Latency / concurrency goals (**~ 50 % faster repeated reads**, **~ 3× parallel readers** versus cold Postgres) rely on caching hot feeds plus btree indexes documented in **`docs/postgresql_schema.sql`**—benchmark with your favorite load tool (k6, hey, vegeta) tuned to payload size and connection pools.

### Important env vars

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | **`postgresql+psycopg://...`** connection string (**preferred**: proxy/private IP TCP) |
| `CLOUDSQL_INSTANCE_CONNECTION_NAME` | Defaults to `gd-gcp-gridu-genai:us-central1:appuser1` |
| `CLOUD_SQL_CONNECT_MODE` | Set to **`unix_socket`** to build `/cloudsql/...` URIs (`PG*` required) |
| `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Used when `CLOUD_SQL_CONNECT_MODE=unix_socket` |
| `DATABASE_LOCAL_URL` | Fallback localhost DSN when no `DATABASE_URL` and socket mode inactive |
| `POSTGRES_MAINTENANCE_DATABASE` | DB to connect into before `CREATE DATABASE` (defaults to **`postgres`**; set if your cloud role cannot use `postgres`) |
| `SECRET_KEY` | Flask secrets |
| `JWT_SECRET_KEY` | JWT signing (≥32 chars in prod) |
| `JWT_ACCESS_SECONDS` | Access token TTL (default 900 = 15 min) |
| `REFRESH_TOKEN_DAYS` | Opaque refresh row lifetime |
| `REDIS_URL` | If set → Redis-backed cache (**recommended** prod). Optional `CACHE_TYPE`, `CACHE_REDIS_URL` overrides |
| `CACHE_POSTS_ENABLED` | `false` disables post list/detail cache reads/writes |
| `CACHE_DISABLED` | Convenience kill-switch for cache reads/writes |
| `CACHE_POSTS_LIST_TTL` / `CACHE_POSTS_DETAIL_TTL` | Feed vs detail TTLs (seconds) |
| `RATELIMIT_STORAGE_URI` | Flask-Limiter backend (default `memory://`; use Redis URI in prod) |
| `RATELIMIT_DEFAULT` | Default limits (`;`-separated, e.g. `200 per day;50 per hour`) |
| `RATELIMIT_AUTH` | Dedicated limit string for signup/login/token refresh endpoints |
| `TRUST_PROXY_HEADERS` | When `true`/`1`/`yes`, trust `X-Forwarded-*` for HTTPS and remote IP limits |
| `TALISMAN_FORCE_HTTPS` | Production only: Flask performs HTTP→HTTPS redirects (disable behind TLS-only ingress) |

### Troubleshooting: database connection

- **`FATAL: role "…" does not exist` on `127.0.0.1`:** your `DATABASE_URL` user is almost certainly a **Cloud SQL login** (e.g. `appuser2`). A **local** Postgres instance only has roles you created there (often your macOS username or `postgres`). Either:
  - **Use Cloud SQL Auth Proxy** so `127.0.0.1:5432` is the Cloud SQL endpoint, e.g.
    `cloud-sql-proxy "gd-gcp-gridu-genai:us-central1:appuser1"`
    (instance from `CLOUDSQL_INSTANCE_CONNECTION_NAME`), then keep `DATABASE_URL` pointing at `127.0.0.1:5432`; or
  - **Use a local-only DSN**, e.g. `postgresql+psycopg://${USER}@127.0.0.1:5432/blog_platform` after Homebrew/Docker Postgres is up, and run `flask init-db` / `flask seed-demo`; or
  - **Create the role locally** (as a superuser): `CREATE ROLE appuser2 WITH LOGIN PASSWORD '…';` and `CREATE DATABASE blog_platform_sab OWNER appuser2;` (adjust names to match your `.env`).

- **`database "…" does not exist`:** run `flask init-db` — it creates the DB on PostgreSQL when your user has `CREATEDB`/superuser privileges, or create the database manually in `psql`.

### Endpoint summary (PostgreSQL-aligned)

**Accounts & sessions**

- `POST /api/users` — register; body `name`, `email`, password (minimum 8 characters with upper, lower, digit), optional `availability_status`, `expertise_areas[]` → `201` **`{ data: user, meta: null }`**
- `POST /api/sessions` — `email`, `password` → **`{ data: { access_token, refresh_token, token_type, expires_in }, meta: null }`**
- `POST /api/sessions/refresh` — `{ refresh_token }` rotates the DB row → same token **`data`** shape as login

**Posts (slug‑keyed, not integer id)**

- `GET /api/posts?scope=published|mine&page&per_page` — **`published`** is public; **`mine`** requires JWT → **`{ data: items[], meta: pagination }`**
- `POST /api/posts` — JWT → **`201`** **`{ data: post_without_embedded_comments, meta: null }`**
- `GET /api/posts/<slug>` — optional JWT for drafts → **`{ data: post, meta: null }`**
- `PUT` / `DELETE /api/posts/<slug>` — author or admin; **`DELETE` returns empty `204`**

**Comments (threaded `parent_comment_id`; paginated)**

- `GET /api/posts/<slug>/comments?page=&per_page=` — visibility rules respect approvals and authorship (**`{ data: items[], meta: pagination }`**)  
- `POST /api/posts/<slug>/comments` — JWT → **`{ data: comment, meta: null }`**
- `DELETE /api/posts/<slug>/comments/<uuid>` — reply author, post author, or admin (`204`)

**Taxonomy**

- `GET /api/categories?page=&per_page=` — **`{ data: categories[], meta: pagination }`**

**Full-text searches (FTS)**

- `GET /api/searches?q=...&page=&per_page=` — `posts.search_vector` with `websearch_to_tsquery` / `ts_rank`, **published** only; **`per_page` max 50**; **`meta` includes `keyword`**

### DDL reference

Canonical SQL definitions—including **new performance indexes** such as `idx_posts_author_status_updated`, `idx_posts_status_published_catalog`, and `idx_comments_post_created_at`—live in **`docs/postgresql_schema.sql`**. Align trigger syntax with your exact PostgreSQL build if needed.

### ORM vs raw DDL

`flask init-db` runs `SQLAlchemy.create_all()` — composite indexes declared on **`Post`** / **`Comment`** mirror the btree additions above alongside the FTS GIN helpers. Production still benefits from **`docs/postgresql_schema.sql`** (additional partial indexes, trigger bodies, migrations) plus load testing to validate SLA targets tied to caching + indexes.
