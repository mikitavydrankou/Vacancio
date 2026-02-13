# Server

FastAPI backend for Vacancio job tracking system with AI-powered job parsing.

## Tech Stack
- **FastAPI** - Modern async web framework (v0.115+)
- **SQLAlchemy 2.0** - Modern ORM with type-safe `Mapped` syntax
- **Pydantic V2** - High-performance data validation
- **Pydantic Settings** - 12-factor configuration management
- **OpenRouter** - LLM API gateway (GPT-4o-mini, Claude)
- **pytest** - Testing framework
- **Docker** - Multi-stage builds, rootless execution

## Structure
- **main.py** - Application entry point, auto-migration logic
- **requirements.txt** - Python dependencies (locked)
- [core/](core/CORE_SYSTEMS.md) - **Config via Pydantic**, database connection, migrations
- [database/](database/DATABASE_LAYER.md) - SQLAlchemy 2.0 models, Pydantic schemas
- [routers/](routers/API_ROUTERS.md) - REST API endpoints
- [services/](services/BUSINESS_LOGIC.md) - AI parsing logic
- [data/](data/) - **Persistent storage** (SQLite DB + Uploads) - Gitignored

## Key Features

### 🚀 Zero-Config Deployment
- **"Pull & Run" Architecture** - Works immediately with `docker compose up`
- **Self-Contained Data** - All data stored in `./data` folder
- **Automatic Migrations** - Detects and moves legacy data to new structure
- **SQLite Default** - Production-ready SQLite configuration with WAL mode

### 🤖 AI-Powered Job Parsing
- **Automatic extraction** from unstructured job postings (text/HTML)
- **OpenRouter integration** - GPT-4o-mini ($0.0001/job), Claude 3.5 Sonnet
- **Smart normalization** - 70+ tech stack, Polish→English locations, salary parsing
- **Background processing** - Non-blocking async parsing
- **Source detection** - Indeed, NoFluffJobs, Pracuj, JustJoin, LinkedIn

### 📦 Application Management
- Full CRUD operations for job applications
- Status tracking (no_response, pending, rejected, offer, accepted, archived, failed)
- Tech stack and requirements extraction
- Duplicate detection (URL-based)
- Bulk import/export with data migration support

### 📄 Resume Management
- Multi-version resume support per profile
- File upload and storage
- Resume-application association tracking

### 👤 Profile Management
- Multi-profile support
- Profile-specific resumes and applications
- Auto-creation during data import

### 🗄️ Database
- **PostgreSQL** (production) - Full-featured with JSON support
- **SQLite** (development) - Zero-config quick start
- Automatic migrations and schema management

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost/vacancio"
export OPENROUTER_API_KEY="sk-or-v1-xxxxx"  # For AI parsing

# Run server
python main.py
# or with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/vacancio

# Optional (for AI features)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx

# Optional
PORT=8000
DEBUG=true
```

## API Endpoints

### Applications
- `GET /applications/` - List applications (filter by profile/resume)
- `POST /applications/` - Create application (with background AI parsing)
- `GET /applications/{id}` - Get application details
- `PUT /applications/{id}` - Update application
- `DELETE /applications/{id}` - Delete application
- `POST /applications/import` - Bulk import from JSON

### Profiles
- `GET /profiles/` - List profiles
- `POST /profiles/` - Create profile
- `GET /profiles/{id}` - Get profile details
- `PUT /profiles/{id}` - Update profile
- `DELETE /profiles/{id}` - Delete profile

### Resumes
- `GET /resumes/` - List resumes (filter by profile)
- `POST /resumes/` - Upload resume
- `GET /resumes/{id}` - Get resume details
- `DELETE /resumes/{id}` - Delete resume

## Testing

```bash
# Run all tests
pytest

# Unit tests only
pytest server/tests/unit/

# Integration tests (requires OPENROUTER_API_KEY)
pytest server/tests/integration/

# With coverage
pytest --cov=server --cov-report=html
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              FastAPI Application                │
│                   (main.py)                     │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              API Routers Layer                  │
│    /applications  /profiles  /resumes           │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│           Services Layer (Business Logic)       │
│  • AI Job Parser (OpenRouter + GPT-4o-mini)     │
│  • Data Import/Export                           │
│  • Background Task Processing                   │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│         Database Layer (CRUD Operations)        │
│           SQLAlchemy ORM + Pydantic              │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│          PostgreSQL / SQLite Database           │
└─────────────────────────────────────────────────┘
```

## Development

```bash
# Install dev dependencies
pip install -r requirements.txt pytest pytest-cov

# Run with auto-reload
uvicorn main:app --reload

# Format code
black server/
isort server/

# Type checking
mypy server/
```

## Related Documentation
- [Business Logic & AI Agent](services/BUSINESS_LOGIC.md) - Detailed AI parsing docs
- [Database Schema](../docs/DATABASE_SCHEMA.md) - Data models and relationships
- [API Contracts](../docs/API_CONTRACTS.md) - Complete API reference
- [Backend Architecture](../docs/BACKEND_ARCHITECTURE.md) - System design
- [Testing Guide](tests/TESTING_GUIDE.md) - Testing strategies

---

**Last Updated**: February 2026
