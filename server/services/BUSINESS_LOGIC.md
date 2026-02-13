# Business Logic & Services Layer

Business logic, external integrations, and AI-powered services for Vacancio job tracking.

---

## Overview

Services layer provides business logic between API routers and database:

- **AI-powered job parsing** - Extracts structured data from unstructured job postings using OpenRouter
- **Bulk data import** - Migrates and restores application data
- **Data validation & normalization** - Tech stack (70+), locations, salaries
- **Background job processing** - Asynchronous parsing operations

---

## AI Parsing Agent

### Core Function

```python
from services.job_parser.ai.parser import parse_with_ai

def parse_with_ai(
    text: str,                          # Raw job posting text/HTML
    model: str = "openai/gpt-4o-mini",  # OpenRouter model ID
    custom_prompt: str = None,          # Optional custom extraction prompt
    source_url: str = None              # URL for source detection
) -> JobPosting:
    """Parses unstructured job text using AI, returns validated JobPosting.
    
    Raises:
        ValueError: API errors, invalid JSON, validation failures
        requests.exceptions.Timeout: After 60s timeout
    """
```

**Workflow**: Raw Text → [Source Detection] → [LLM Prompt] → [OpenRouter API] → [JSON Extraction] → [Enum Normalization] → [Pydantic Validation] → [Auto-fix] → JobPosting Object

**Features**:
- 60s timeout protection
- Auto JSON extraction from markdown blocks
- Source detection (indeed, nofluffjobs, pracuj, justjoin, linkedin)
- Structured logging (🤖 ✅ ❌)

**Model Options**:
- `gpt-4o-mini` (default) - $0.0001/job, 95% accuracy, production use
- `claude-3.5-sonnet` - $0.001/job, 98% accuracy, max quality
- `gpt-4o` - $0.0005/job, 97% accuracy, balanced

### LLM Prompt Strategy

```python
DEFAULT_PROMPT = """You are extracting structured job data.

CRITICAL RULES:
- Return ONLY valid JSON, no markdown code blocks
- Use ONLY provided fields and enum values
- If information is missing, use null or empty array []
- Do NOT infer or guess values

ENUM VALUES (exact matches):
- work_mode: "remote" | "hybrid" | "onsite" | null
- employment_type: "full-time" | "part-time" | "contract" | "b2b" | "internship" | null
- seniority: "trainee" | "junior" | "mid" | "senior" | "lead" | "manager" | null
  Mapping: "Principal/Staff" → "senior", "Architect" → "lead", "VP/Director" → "manager"
- currency: "PLN" | "USD" | "EUR" | null
- salary.unit: "month" | "year" | "hour" | null
- gross_net: "gross" | "net" | "unknown"

EXTRACTION RULES:
1. stack: Technology names only ("React", "AWS", "Python")
2. requirements: Full sentences with years/education
3. salary: Remove spaces ("15 000" → 15000)
4. location: City in English, no postal codes ("30-307 Kraków" → "Krakow")
5. project_description: Company context + project details
```

**Design**: Zero-shot learning, explicit enum mapping, strict JSON format, null over guessing

### Data Models

```python
class JobPosting(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None                    # "Warsaw", "Krakow", "Remote"
    work_mode: Optional[WorkMode] = None              # remote | hybrid | onsite
    employment_type: Optional[EmploymentType] = None  # full-time | contract | b2b
    seniority: Optional[Seniority] = None             # trainee | junior | mid | senior | lead
    salary: Optional[Salary] = None
    stack: List[str] = []                             # ["Python", "AWS", "Docker"]
    nice_to_have_stack: List[str] = []
    requirements: List[str] = []
    responsibilities: List[str] = []
    project_description: Optional[str] = None
    source: Optional[str] = None                      # Auto-filled from URL
    raw_data: Optional[str] = None

class Salary(BaseModel):
    min: Optional[int] = None           # Validated: positive
    max: Optional[int] = None           # Validated: >= min
    currency: Optional[Currency] = None  # PLN | USD | EUR
    unit: Optional[SalaryUnit] = None    # month | year | hour
    gross_net: Optional[GrossNet] = GrossNet.UNKNOWN
```

### Normalizer & Validator

**Tech Stack Normalization (70+ technologies)**:
- Cloud: AWS, Azure, GCP, Docker, Kubernetes, Terraform
- Languages: Python, Go, Java, JavaScript, TypeScript, Rust
- Databases: PostgreSQL, MongoDB, Redis, Elasticsearch, MySQL
- Frontend: React, Vue, Angular, Next.js, Tailwind, Webpack
- Backend: FastAPI, Django, Flask, Node.js, Express, Spring Boot
- DevOps: Jenkins, GitHub Actions, GitLab CI, ArgoCD, Prometheus

**Location Normalization**: `"warszawa"` → `"Warsaw"`, removes postal codes

**Auto-fix Pipeline**:
1. Tech normalization: `"python"` → `"Python"`, `"aws"` → `"AWS"`
2. Deduplication (preserves order)
3. Location cleanup (Polish → English, removes codes)
4. Whitespace stripping

---

## Data Import Service

```python
from services.data_import import import_applications

def import_applications(
    db: Session,
    data: List[Dict[str, Any]],
    profile_name: str = None
) -> Dict[str, Any]:
    """Imports applications from JSON list.
    
    Returns: {
        "success_count": int,
        "errors": List[str],
        "profile_used": str,
        "total_items": int
    }
    """
```

**Features**:
- Auto-creates profile if missing (uses `profile_name` or "Restored User")
- Auto-creates default resume if needed
- URL-based duplicate detection (skips if exists)
- Per-item error handling (one failure doesn't stop batch)
- Enum normalization (`"Seniority.mid"` → `"mid"`)

**Input Format**:
```json
[{
  "url": "https://...", "company": "TechCorp", "position": "Senior Python Dev",
  "location": "Warsaw", "salary": "15000-20000 PLN", "source": "nofluffjobs",
  "tech_stack": ["Python", "FastAPI"], "nice_to_have_stack": ["Kubernetes"],
  "responsibilities": ["Design APIs"], "requirements": ["5+ years Python"],
  "work_mode": "hybrid", "employment_type": "b2b", "seniority": "senior",
  "description": "We are looking for..."
}]
```

---

## Integration Patterns

### Background Processing (Non-blocking)

```python
from fastapi import BackgroundTasks

@router.post("/applications/")
def create_application(app_data: schemas.JobApplicationCreate,
                       background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    new_app = crud.create_application(db, app_data)
    background_tasks.add_task(process_application_background, new_app.id)
    return new_app

def process_application_background(app_id: str):
    db = next(get_db())
    try:
        db_app = crud.get_application(db, app_id)
        parsed = parse_with_ai(db_app.raw_data, source_url=db_app.url)
        updates = schemas.JobApplicationUpdate(
            company=parsed.company, position=parsed.job_title,
            tech_stack=parsed.stack, status=models.ApplicationStatus.no_response
        )
        crud.update_application(db, app_id, updates)
    except Exception as e:
        crud.update_application(db, app_id, {
            "status": models.ApplicationStatus.failed,
            "description": f"Parsing failed: {str(e)}"
        })
    finally:
        db.close()
```

### Synchronous Parsing (Immediate)

```python
@router.post("/applications/preview")
def preview_parsed_job(job_text: str, source_url: str = None):
    try:
        parsed = parse_with_ai(job_text, source_url=source_url)
        return parsed.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
```

### Bulk Import

```python
@router.post("/applications/import")
def bulk_import(file: UploadFile, profile_name: str = None):
    data = json.load(file.file)
    results = import_applications(db, data, profile_name)
    if results["errors"]:
        logger.warning(f"Import errors: {results['errors']}")
    return results
```

---

## Usage Examples

### Parse Job Posting

```python
from services.job_parser.ai.parser import parse_with_ai

# Basic usage
job = parse_with_ai("Senior Python Engineer at TechCorp, Warsaw...")

# With source URL
job = parse_with_ai(text=job_html, source_url="https://nofluffjobs.com/job/123")

# Access data
print(f"Position: {job.job_title}")   # "Senior Python Engineer"
print(f"Company: {job.company}")      # "TechCorp"
print(f"Stack: {job.stack}")          # ["Python", "FastAPI", "PostgreSQL"]
print(f"Source: {job.source}")        # "nofluffjobs"
```

### Import Applications

```python
from services.data_import import import_applications

data = [
    {"company": "TechCorp", "position": "Backend Dev", ...},
    {"company": "StartupXYZ", "position": "Frontend Dev", ...}
]

results = import_applications(db, data, profile_name="John Doe")
print(f"Imported: {results['success_count']}/{results['total_items']}")
```

---

## Configuration

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx

# Optional
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  # default
DATABASE_URL=postgresql://user:pass@localhost/db
```

---

## Error Handling

**API Errors**:
- Timeout (60s) → `requests.exceptions.Timeout`
- HTTP 4xx/5xx → `ValueError`
- Network → `requests.exceptions.RequestException`

**Validation Errors**:
- Invalid JSON from LLM → `ValueError`
- Schema mismatches → Pydantic `ValidationError`
- Enum violations → Auto-normalized when possible
- Salary constraints → Validated (positive, max >= min)

**Import Errors**:
- Duplicates → Skipped, logged in errors list
- Missing profile → Auto-creates
- Database errors → Transaction rollback

**Logging**:
```
INFO: 🤖 Parsing with openai/gpt-4o-mini
INFO: ✅ Parsed: Senior Python Developer @ TechCorp
ERROR: ❌ OpenRouter request timed out after 60s
WARNING: Skipped duplicate (Index 3): TechCorp - https://...
```

---

## Testing

```bash
# Unit tests
pytest server/tests/unit/
pytest server/tests/unit/test_validator.py

# Integration tests (requires OPENROUTER_API_KEY)
pytest server/tests/integration/

# Manual test
from services.job_parser.ai.parser import parse_with_ai
sample = """Senior Full-Stack Developer\nTechCorp\nWarsaw (Hybrid)\n15-20k PLN/month"""
job = parse_with_ai(sample)
print(job.model_dump_json(indent=2))
```

---

## Best Practices

**AI Parsing**:
- ✅ Send full job descriptions (more context = better accuracy)
- ✅ Use `gpt-4o-mini` for production (cost-effective)
- ✅ Use background tasks for non-blocking parsing
- ✅ Handle `None` values gracefully
- ❌ Don't truncate job text
- ❌ Don't parse synchronously in user-facing endpoints

**Data Import**:
- ✅ Validate JSON before import
- ✅ Provide meaningful profile names
- ✅ Review error list after import
- ❌ Don't import without URLs (can't detect duplicates)
- ❌ Don't ignore error messages

**Performance**:
- Batch operations for multiple applications
- Use background tasks for async parsing
- Choose appropriate model for use case
- Cache parsed results for identical text

**Security**:
- Never commit `OPENROUTER_API_KEY`
- Sanitize user-provided text
- Implement rate limiting
- Don't expose internal errors to users

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `OPENROUTER_API_KEY not set` | Add to `.env` file |
| Parsing timeout (60s) | Use `gpt-4o-mini`, reduce text size, check API status |
| Invalid JSON from LLM | Try Claude model, review `_extract_json()` logic |
| Duplicate applications | Expected - checks URL+profile combination |
| Wrong tech capitalization | Add to `KNOWN_TECHNOLOGIES` in `validator.py` |

---

## Related Documentation

- [job_parser/JOB_PARSER.md](job_parser/JOB_PARSER.md) - Detailed AI parsing docs
- [Database Schema](../../docs/DATABASE_SCHEMA.md)
- [API Contracts](../../docs/API_CONTRACTS.md)
- [Backend Architecture](../../docs/BACKEND_ARCHITECTURE.md)

---

**Last Updated**: February 2026
