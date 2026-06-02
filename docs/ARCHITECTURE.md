# Architecture

A short map for contributors. For setup and usage, see the [README](../README.md).

## How it runs

One Docker image runs both halves under `supervisord`:

- **Frontend** — Next.js on port `3000` (the only port you publish).
- **Backend** — FastAPI on port `8000`, internal.

The browser only talks to `3000`. A Next.js rewrite (`/api/backend/*` → `http://127.0.0.1:8000/*`,
see `frontend/next.config.mjs`) proxies API calls to the backend, so there's a single origin and no CORS in production.

## Data

Everything persists in `data/` (the `vacancio-data` Docker volume):

- `data/vacancio.db` — SQLite database.
- `data/uploads/` — resume PDFs.

Model (see `server/database/models.py`):

```
Profile ──1:N──> Resume ──1:N──> JobApplication
Setting (key/value — e.g. the OpenRouter key set from the UI)
```

Deleting a profile cascades to its resumes and applications; deleting a resume cascades to its applications.

## Adding an application

1. Frontend creates the application with status `parsing`.
2. FastAPI runs a background task: `parse_with_ai()` calls OpenRouter, then normalizes and validates the result.
3. On success the application is updated (status `no_response`); on failure it becomes `failed`.

`parsing` and `failed` are assigned automatically. Users only set
`no_response → screening → interview → offer / rejected`.

The OpenRouter key resolves DB-first: a key saved in **Settings** overrides the `OPENROUTER_API_KEY` env var.

## Layout

```
server/
├── core/        config, database, migrations
├── database/    SQLAlchemy models, Pydantic schemas, CRUD
├── routers/     applications, profiles, resumes, settings
├── services/    data import, job_parser/ (AI parser + validator)
└── tests/       pytest unit + integration

frontend/
├── app/         pages (dashboard, applications/[id], resumes, archived)
├── components/  UI (add-job-form, filters, analytics, dialogs, ...)
├── hooks/       data + UI state
└── lib/api/     typed backend clients (base URL in lib/api/base.ts)
```

## Local development

```bash
docker compose -f compose.dev.yml up -d   # hot-reload frontend + backend
```

- UI: http://localhost:3000 · API docs: http://localhost:8000/docs
- Backend tests: `pytest` (from `server/`).

## CI

`.github/workflows/docker-publish.yml` builds a multi-arch image (amd64 + arm64) and
publishes it to GHCR on every push to `main` and on `v*` tags.
