<div align="center">

<img src="assets/banner.png" alt="Vacancio" width="440" />

### Self-hosted job-application tracker with AI parsing

Paste a posting → structured stack, salary, requirements and seniority.
Track applications, version your resumes, and measure your real conversion rate — all on your machine.

[![Build and publish image](https://github.com/mikitavydrankou/Vacancio/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/mikitavydrankou/Vacancio/actions/workflows/docker-publish.yml)

</div>

---

## Features

- **AI parsing** — raw job text or a URL → structured fields, zero manual entry.
- **Conversion tracking** — a status pipeline per application; response / interview / offer rates per resume version.
- **Filter & group** — by resume, stack, source or status; star favorites, archive the rest.
- **Import / export** — your data as JSON, anytime.

**Stack:** Next.js 16 · FastAPI · SQLAlchemy 2 · SQLite (PostgreSQL optional) · OpenRouter — shipped as one Docker image.

---

## Quick start

Needs Docker. AI parsing needs an [OpenRouter key](https://openrouter.ai/keys); everything else works without one.

```bash
docker run -d --name vacancio -p 3000:3000 -v vacancio-data:/app/server/data ghcr.io/mikitavydrankou/vacancio:latest
```

Open **http://localhost:3000** and paste your key into **Settings** (gear icon) — stored locally, no restart.
**One command, one port:** the browser only hits `3000`; the API is proxied inside the container.

> [!TIP]
> Compose works too: `OPENROUTER_API_KEY=sk-or-... docker compose up -d`

## Usage

1. **Manage Profiles & Resumes** → create a profile, upload a resume PDF (keep multiple versions).
2. **Dashboard** → paste a posting (+ optional URL); AI fills in the details in the background.
3. **Track** → No response → Screening → Interview → Offer / Rejected. (*Parsing* and *Error* are automatic.)
4. **Review** → filter, favorite, archive; your rates update live.

New here? The **ⓘ** button gives a 30-second tour.

---

## Configuration

Everything is optional except the OpenRouter key (for AI parsing).

| Variable             | Default                      | Purpose                                    |
| -------------------- | ---------------------------- | ------------------------------------------ |
| `OPENROUTER_API_KEY` | —                            | Enables AI parsing (or set it in Settings) |
| `DATABASE_URL`       | `sqlite:///data/vacancio.db` | Use PostgreSQL instead                     |
| `DATA_DIR`           | `data`                       | Where the DB and uploads live              |

Your data lives in the `vacancio-data` volume and survives updates:

```bash
docker compose pull && docker compose up -d
```

## Development

```bash
cp .env.example .env                       # add your key
docker compose -f compose.dev.yml up -d    # hot reload
```

UI `:3000` · API docs `:8000/docs` · internals in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

<div align="center"><sub>Built for job seekers who'd rather measure than guess.</sub></div>
