# AI Parsing Agent Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Parsing Pipeline](#parsing-pipeline)
5. [Configuration](#configuration)
6. [Usage Examples](#usage-examples)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Overview

The **AI Parsing Agent** transforms unstructured job postings into structured, validated data using LLMs via OpenRouter API.

### Key Features
- **Smart Extraction**: 15+ structured fields from raw text
- **Multi-Source**: LinkedIn, Indeed, Pracuj.pl, NoFluffJobs, JustJoin.IT
- **Tech Recognition**: 100+ technologies with fuzzy matching
- **Auto-Validation**: Enum standardization, location normalization
- **Source Detection**: Automatic job board identification
- **Error Recovery**: Multi-layer error handling with detailed logging

### Benefits
- ⏱️ 90%+ time reduction vs manual entry | 🎯 Structured data consistency | 🔄 Custom prompts & models | 📊 Analytics-ready

---

## Architecture

```
services/job_parser/
├── models.py       # Pydantic schemas & enums
├── validator.py    # Tech matching & normalization
└── ai/
    ├── parser.py   # OpenRouter API client
    └── prompts.py  # LLM instructions
```

**Responsibilities**: `parser.py` (API, JSON extraction), `prompts.py` (LLM instructions), `models.py` (validation), `validator.py` (normalization)

---

## Data Models

### JobPosting Schema

```python
JobPosting(
    job_title: Optional[str]                        # "Senior Backend Engineer"
    company: Optional[str]                          # "Google"
    location: Optional[str]                         # "Warsaw" (normalized)
    work_mode: Optional[WorkMode]                   # remote | hybrid | onsite
    employment_type: Optional[EmploymentType]       # full-time | part-time | contract | b2b | internship
    seniority: Optional[Seniority]                  # trainee | junior | mid | senior | lead | manager
    salary: Optional[Salary]                        # Nested object
    stack: List[str]                                # ["Python", "Django", "AWS"]
    nice_to_have_stack: List[str]                   # ["React", "TypeScript"]
    requirements: List[str]                         # Full sentences
    responsibilities: List[str]                     # Job descriptions
    project_description: Optional[str]              # Context
    raw_data: Optional[str]                         # Original text
    source: Optional[str]                           # Auto-detected from URL
)
```

### Salary Schema

```python
Salary(min: int, max: int, currency: Currency, unit: SalaryUnit, gross_net: GrossNet)
# Validation: min/max positive, max >= min, auto-uppercase currency
```

**Enums**: WorkMode (remote/hybrid/onsite), EmploymentType (full-time/part-time/contract/b2b/internship), Seniority (trainee/junior/mid/senior/lead/manager), Currency (PLN/USD/EUR), SalaryUnit (month/year/hour), GrossNet (gross/net/unknown)

---

## Parsing Pipeline

### Flow

```
Raw Text → Prompt Builder → OpenRouter API → JSON Extraction → Enum Normalizer → Source Detector → Pydantic Validator → Auto-Fixer → Validated JobPosting ✅
```

### Process Steps

1. **API Request**: POST to OpenRouter (text + DEFAULT_PROMPT, 60s timeout)
2. **JSON Extraction**: Handles ```json blocks, backticks, raw JSON, embedded JSON
3. **Enum Normalization**: Fuzzy matching ("full time" → "full-time", "wfh" → "remote")
4. **Source Detection**: Identifies job board from URL keywords
5. **Pydantic Validation**: Type checking + constraint enforcement
6. **Auto-Fixing**: Tech normalization, deduplication, whitespace cleanup

### Normalization Rules

**Work Mode**: "remote"/"wfh" → "remote" | **Employment**: "full" → "full-time", "intern" → "internship"  
**Currency**: Auto-uppercase | **Salary Unit**: "monthly" → "month", "yearly" → "year"

---

## Configuration

### Environment Variables

```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx  # Required
```

### Supported Models

| Model | Speed | Cost/1M | Use Case |
|-------|-------|---------|----------|
| `openai/gpt-4o-mini` | Fast | $0.15 | Default ✅ |
| `openai/gpt-4o` | Medium | $5.00 | Complex |
| `anthropic/claude-3.5-sonnet` | Medium | $3.00 | Accurate |
| `meta-llama/llama-3.1-70b` | Fast | $0.88 | Budget |

### Source Mappings

```python
SOURCE_MAPPINGS = {"indeed": ["indeed"], "nofluffjobs": ["nofluffjobs", "nofluff"], "pracuj": ["pracuj.pl"], "justjoin": ["justjoin.it"], "linkedin": ["linkedin"]}
```

---

## Usage Examples

### Basic Parsing

```python
from server.services.job_parser.ai.parser import parse_with_ai

job = parse_with_ai("Senior Python Developer | Spotify | Warsaw | 15K-20K PLN/month")
# Returns: JobPosting(job_title="Senior Python Developer", company="Spotify", seniority=SENIOR, ...)
```

### Custom Model

```python
job = parse_with_ai(raw_text, model="openai/gpt-4o", source_url="https://linkedin.com/jobs/123")
```

### Background Processing (FastAPI)

```python
@router.post("/applications")
def create_application(data, background_tasks, db=Depends(get_db)):
    app = crud.create_application(db, data)
    if app.raw_data:
        background_tasks.add_task(lambda: parse_with_ai(app.raw_data))
    return app
```

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `OPENROUTER_API_KEY not set` | Missing env var | Add to `.env` |
| `API request timed out` | Slow LLM (>60s) | Retry with faster model |
| `Invalid JSON in LLM response` | Model hallucination | Log response, retry |
| `validation failed` | Schema mismatch | Check prompt compatibility |

**Logging**: `logger.info(f"🤖 Parsing")` (start), `logger.info(f"✅ Parsed: {title}")` (success), `logger.error(f"❌ {error}")` (fail)

---

## Best Practices

### DO ✅

- **Background Processing**: Use for user-facing endpoints (non-blocking)
- **Store Raw Data**: Enable re-parsing with better models/prompts
- **Log Errors**: Include raw LLM responses for debugging
- **Handle Nulls**: Many fields optional (missing data)
- **Version Prompts**: Keep in `prompts.py`, not hardcoded

### DON'T ❌

- **Block Requests**: Avoid synchronous parsing in high-traffic APIs
- **Ignore Validation**: Errors indicate prompt/model issues
- **Skip Raw Text**: Always store `raw_data` before parsing
- **Use Expensive Models**: GPT-4 unnecessary for most jobs
- **Hard-Code Prompts**: Centralize for maintainability

---

## Related Documentation

- [JOB_PARSER.md](../services/job_parser/JOB_PARSER.md) - Full system docs
- [DATABASE_SCHEMA.md](../../docs/DATABASE_SCHEMA.md) - Data storage
- [API_CONTRACTS.md](../../docs/API_CONTRACTS.md) - API endpoints
