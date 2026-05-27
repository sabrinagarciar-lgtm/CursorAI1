# Customer Support SPA

TypeScript + React + Tailwind CSS single-page companion for `7_3_customer_ticketPRD` backend with **manual dark/light mode** toggle (Tailwind `class` strategy) and PRD-aligned views for customers, agents, and admins.

## Requirements

- Node 18+
- Matching API running locally (default Flask `python run.py` on port **5050**)

## Scripts

```bash
cd frontend
npm install          # yarn / pnpm also work
npm run dev          # http://localhost:5173 — proxies `/api/*` → :5050
npm run build
npm run preview
```

## Environment variables

See `.env.example`. Set `VITE_API_BASE` when you ship the SPA from a CDN but call the REST API on another origin (remember to whitelist that origin via `CORS_ORIGINS` in Flask).

During `npm run dev`, leave variables unset unless you purposely want mixed-origin calls.

### Dark mode UX

Preference is stored under `support-desk-theme` (`light`/`dark`). The toggle lives in the global masthead and swaps the Tailwind `.dark` class on `<html>`.

## Capability matrix (PRD)

| Capability | Roles |
|-------------|-------|
| Register / JWT login | Everybody |
| Create tickets + attachments UI | authenticated customers/agents/admin |
| Filterable ticket backlog | Everybody with token (backend enforces scoping) |
| Status / priority tooling | Assigned agent + admins |
| Manual / auto-assign | admins |
| Internal comments checkbox | Agents + admins |
| Directory + availability self-service | Agents (self row editable) |
| Global user census | admins |

## Lint / checks

Projects ship with TS strict flags. Run:

```bash
npm run build
```

to compile + bundle.
