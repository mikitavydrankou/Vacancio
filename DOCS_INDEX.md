# Vacancio Documentation Index for AI Agents

**Purpose**: Central navigation hub for AI agents working on the Vacancio codebase.

**Project**: Job application tracking with AI-powered parsing  
**Stack**: FastAPI + Next.js + PostgreSQL/SQLite + OpenRouter LLM

---

## 📚 Documentation Map

### Core Architecture
- [docs/BACKEND_ARCHITECTURE.md](docs/BACKEND_ARCHITECTURE.md) - Backend layers, patterns, dependencies
- [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) - Frontend structure, components, routing
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Schema, models, relationships, enums
- [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) - REST endpoints, request/response schemas

### Backend Modules
- [server/SERVER_OVERVIEW.md](server/SERVER_OVERVIEW.md) - Backend overview, quick start, API list
- [server/core/CORE_SYSTEMS.md](server/core/CORE_SYSTEMS.md) - Config, database, environment
- [server/database/DATABASE_LAYER.md](server/database/DATABASE_LAYER.md) - ORM models, Pydantic schemas, CRUD
- [server/routers/API_ROUTERS.md](server/routers/API_ROUTERS.md) - Route handlers, endpoints
- [server/services/BUSINESS_LOGIC.md](server/services/BUSINESS_LOGIC.md) - **AI agent, data import, business logic**
- [server/services/job_parser/JOB_PARSER.md](server/services/job_parser/JOB_PARSER.md) - Job parsing details
- [server/tests/TESTING_GUIDE.md](server/tests/TESTING_GUIDE.md) - Test structure, commands

### Development
- [docs/DEV_WORKFLOW.md](docs/DEV_WORKFLOW.md) - Setup, Docker, environment variables

---

## 📂 File Structure

### Backend
```
server/
├── main.py                    # FastAPI entry point
├── core/
│   ├── config.py             # Environment config
│   └── database.py           # SQLAlchemy setup
├── database/
│   ├── models.py             # ORM models
│   ├── schemas.py            # Pydantic schemas
│   └── crud.py               # CRUD operations
├── routers/
│   ├── applications.py       # Application endpoints
│   ├── profiles.py           # Profile endpoints
│   └── resumes.py            # Resume endpoints
├── services/
│   ├── data_import.py        # Bulk import
│   └── job_parser/
│       ├── models.py         # JobPosting models
│       ├── validator.py      # Tech normalization (70+)
│       └── ai/
│           ├── parser.py     # OpenRouter integration
│           └── prompts.py    # LLM prompts
└── tests/
    ├── unit/                 # Unit tests
    └── integration/          # Integration tests
```

### Frontend
```
frontend/
├── app/
│   ├── page.tsx              # Home (app list)
│   ├── applications/[id]/    # App details
│   └── resumes/              # Resume manager
├── components/
│   ├── add-job-form.tsx      # Job creation
│   ├── application-list.tsx  # App table
│   └── ui/                   # shadcn/ui
├── hooks/
│   ├── use-application-data.ts
│   └── use-filter-state.ts
└── lib/
    ├── types.ts              # TypeScript types
    └── api/                  # API clients
```

---

## 🎯 Quick Task Guide

### Add API Endpoint

**1. Schema** (`/server/database/schemas.py`):
```python
class ResourceCreate(BaseModel):
    field: str
```

**2. CRUD** (`/server/database/crud.py`):
```python
def get_resource(db: Session, id: str):
    return db.query(models.Resource).filter_by(id=id).first()
```

**3. Route** (`/server/routers/resources.py`):
```python
@router.get("/{id}", response_model=schemas.Resource)
def read_resource(id: str, db: Session = Depends(get_db)):
    return crud.get_resource(db, id)
```

**4. Register** (`/server/main.py`):
```python
app.include_router(resources.router, prefix="/resources")
```

### Modify Database

**1. Model** (`/server/database/models.py`):
```python
class JobApplication(Base):
    new_field = Column(String)
```

**2. Schema** (`/server/database/schemas.py`):
```python
class JobApplicationCreate(BaseModel):
    new_field: Optional[str] = None
```

**3. CRUD** - Update create/update functions in `/server/database/crud.py`

### Add Frontend Component

**1. Create** (`/frontend/components/my-component.tsx`):
```tsx
export function MyComponent() { return <div>Content</div> }
```

**2. Types** (`/frontend/lib/types.ts`):
```typescript
export interface MyData { id: string; name: string; }
```

**3. Hook** (`/frontend/hooks/use-my-data.ts`) - Add fetch logic

**4. Use** - Import in page/component

### Use AI Parser

```python
from services.job_parser.ai.parser import parse_with_ai

job = parse_with_ai(text="Job text...", source_url="https://...")
print(job.job_title, job.company, job.stack)
```

---

## 🔍 Finding Code

### Backend
- **Models**: `/server/database/models.py`
- **Schemas**: `/server/database/schemas.py`
- **CRUD**: `/server/database/crud.py`
- **Endpoints**: `/server/routers/*.py`
- **Business logic**: `/server/services/*.py`
- **AI parsing**: `/server/services/job_parser/ai/*.py`
- **Config**: `/server/core/config.py`

### Frontend
- **Pages**: `/frontend/app/**/page.tsx`
- **Components**: `/frontend/components/*.tsx`
- **Hooks**: `/frontend/hooks/*.ts`
- **Types**: `/frontend/lib/types.ts`
- **API calls**: `/frontend/lib/api/*.ts`

---

## 🔧 Common Operations

### Database
- **Create**: `crud.create_application(db, schema)`
- **Read**: `crud.get_application(db, id)`
- **Update**: `crud.update_application(db, id, schema)`
- **Delete**: `crud.delete_application(db, id)`
- **Batch**: `import_applications(db, data, profile_name)`

### AI Parsing
- **Parse**: `parse_with_ai(text, model, custom_prompt, source_url)`
- **Models**: `gpt-4o-mini` (default), `claude-3.5-sonnet`, `gpt-4o`
- **Normalization**: Auto via `auto_fix_job_posting()`
- **Tech stack**: 70+ in `/server/services/job_parser/validator.py`

### Frontend State
- **Local**: `useState`, `useReducer`
- **Persistent**: `usePersistentState` (localStorage)
- **Server**: `useApplicationData` (fetch + cache)
- **Filters**: `useFilterState`

---

## 🐛 Troubleshooting

### Backend
- **API errors**: Check logs, verify schema
- **DB errors**: Check `/server/database/models.py` relationships
- **AI parsing**: Check `OPENROUTER_API_KEY`, review prompts
- **Import**: Check `/server/services/data_import.py` validation

### Frontend
- **API fails**: Check Network tab, verify backend on :8000
- **State issues**: Check hooks in `/frontend/hooks/`
- **Type errors**: Check `/frontend/lib/types.ts`

### Environment
- **Missing vars**: Copy `.env.example` to `.env`
- **Docker**: `docker-compose down -v && docker-compose up --build`
- **Ports**: Change PORT in `.env` or `docker-compose.yml`

---

## 🌐 Environment Variables

```bash
# Required (minimal)
PORT=8000

# AI Parsing (optional)
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Database (optional, defaults to SQLite)
DATABASE_URL=postgresql://user:pass@localhost:5432/vacancio

# Development
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

---

## 📊 Key Concepts

### Status Flow
```
no_response → pending → [rejected | offer → accepted] | archived | failed
```

### AI Parsing Flow
```
Text → Source Detection → LLM → JSON → Normalize → Validate → Auto-fix → JobPosting
```

### Models
- **JobApplication** - Main record with status, tech stack, requirements
- **Profile** - User profile (can have multiple)
- **Resume** - Versioned resume files
- **JobPosting** - Pydantic model for AI-parsed data (not in DB)

### Tech Normalization
70+ technologies: AWS, Azure, GCP, Docker, Kubernetes, Python, Go, Java, JavaScript, TypeScript, Rust, PostgreSQL, MongoDB, Redis, React, Vue, Angular, Next.js, FastAPI, Django, Flask, Node.js

---

## 🚀 Quick Commands

```bash
# Backend
python server/main.py                # Run server
uvicorn main:app --reload            # With reload
pytest                               # Tests
pytest --cov                         # With coverage

# Frontend
cd frontend && npm run dev           # Dev server
npm run build                        # Build
npm run lint                         # Lint

# Docker
docker-compose up                    # Start
docker-compose up --build            # Rebuild
docker-compose down -v               # Stop + clean
docker-compose logs -f server        # Logs
```

---

## 📝 Testing

```bash
# Backend unit
pytest server/tests/unit/

# Backend integration (requires OPENROUTER_API_KEY)
pytest server/tests/integration/

# Manual AI test
from services.job_parser.ai.parser import parse_with_ai
job = parse_with_ai("Senior Dev at TechCorp, Warsaw, 15k PLN")
```

---

**Last Updated**: February 2026
