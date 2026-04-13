# CRM (demo)

Small CRM demo: **FastAPI** + **SQLite** backend with session-cookie auth, **React (Vite)** frontend, and **Playwright** E2E that logs in, creates a contact, and checks persistence via the API (optional direct SQLite check).

## Prerequisites

- Python 3.11+ recommended
- Node.js 18+ (Playwright’s default ESM config wants **18.19+**; this repo uses a **CommonJS** Playwright config so **18.18** still works)

## Backend (port 8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health (no auth): `GET http://127.0.0.1:8000/health`
- API base: `http://127.0.0.1:8000`
- SQLite file: `backend/crm.db` (override with env `DATABASE_URL`)

### Demo login (local only)

- Username: `demo`
- Password: `password`

These credentials are for **local demonstration only**. Do not reuse in production or expose on the public internet.

## Frontend (port 5173)

In development, the Vite dev server proxies `/api` to the backend so session cookies stay on the same origin as the UI.

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173`. Production builds can set `VITE_API_BASE` to the full API URL (for example `http://127.0.0.1:8000`) if you are not using the proxy.

## Playwright E2E

From `frontend` after backend dependencies are installed and `backend/.venv` exists:

```bash
cd frontend
npx playwright install chromium   # once per machine
CI=1 npm run test:e2e
```

`CI=1` forces fresh servers from `playwright.config.cjs` (seed + uvicorn + Vite). Without `CI`, Playwright reuses servers already listening on ports 8000 and 5173.

The test creates a contact with a unique email, then verifies it exists by calling `GET /api/contacts?email=...` in the browser (same session cookie as the UI).

Optional stricter database check (requires the `sqlite3` CLI):

```bash
SQLITE_PATH=/absolute/path/to/backend/crm.db CI=1 npm run test:e2e
```

## API overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Organizations | Full CRUD under `/organizations` |
| Contacts | Full CRUD under `/contacts` (`GET /contacts?email=` supported) |
| Deals | Full CRUD under `/deals` |

All CRUD routes require an authenticated session cookie except `GET /health`.

## Configuration

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLAlchemy URL (default: `sqlite:///.../backend/crm.db`) |
| `SESSION_SECRET_KEY` | Secret for signed session cookie |
| `CORS_ORIGINS` | Comma-separated origins (default includes Vite dev URL) |
| `VITE_API_BASE` | Frontend API prefix or absolute base (default in dev: `/api`) |
