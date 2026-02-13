# Job Parser Agent

AI-powered service that extracts structured job data from unstructured text/HTML using OpenRouter (GPT-4o-mini).

## Overview

**Flow**: Raw job text → AI extraction → Validation → Normalization → `JobPosting` model

### Features
- 🤖 AI extraction via OpenRouter (GPT-4o-mini, Claude, etc.)
- ✅ Auto-validation with Pydantic models
- 🔧 Tech stack normalization (70+ known technologies)
- 🌍 Multi-source detection (Indeed, LinkedIn, NoFluffJobs, etc.)
- 🌐 Location normalization (Polish → English cities)
- 💰 Salary parsing with currency/unit/gross-net detection

---

## Architecture

```
Raw Text → [AI Parser] → JSON → [Normalizer] → [Validator] → JobPosting
               ↓
         OpenRouter API
```

**Components**: `ai/parser.py`, `ai/prompts.py`, `models.py`, `validator.py`

---

## Data Models

### JobPosting
```python
JobPosting(
    job_title: str | None,
    company: str | None,
    location: str | None,              # City in English ("Warsaw")
    work_mode: WorkMode | None,        # remote | hybrid | onsite
    employment_type: EmploymentType | None,  # full-time | contract | b2b | internship
    seniority: Seniority | None,       # trainee | junior | mid | senior | lead | manager
    salary: Salary | None,
    stack: List[str],                  # Required tech ["Python", "AWS"]
    nice_to_have_stack: List[str],
    requirements: List[str],
    responsibilities: List[str],
    project_description: str | None,
    source: str | None,                # "nofluffjobs", "indeed", etc.
    raw_data: str | None
)
```

### Salary
```python
Salary(
    min: int | None, max: int | None,  # Validated: positive, max >= min
    currency: Currency | None,          # PLN | USD | EUR
    unit: SalaryUnit | None,            # month | year | hour
    gross_net: GrossNet                 # gross | net | unknown
)
```

---

## Usage

### Basic Parsing
```python
from server.services.job_parser import parse_with_ai

job = parse_with_ai(
    text="Senior Python Developer at TechCorp\nWarsaw, 15-20k PLN/month...",
    source_url="https://nofluffjobs.com/job/123"
)

print(job.job_title)    # "Senior Python Developer"
print(job.seniority)    # Seniority.SENIOR
print(job.source)       # "nofluffjobs"
print(job.stack)        # ["Python", "Django", "AWS"]
```

### Custom Model
```python
job = parse_with_ai(text=text, model="anthropic/claude-3.5-sonnet")
```

### Error Handling
```python
try:
    job = parse_with_ai(text)
except ValueError as e:
    print(f"Failed: {e}")  # API/JSON/validation errors
except requests.exceptions.Timeout:
    print("Timeout after 60s")
```

---

## Configuration

```bash
# Required environment variable
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

**Model Options**:
- `openai/gpt-4o-mini` (default) - Fast, $0.0001/job
- `anthropic/claude-3.5-sonnet` - Highest accuracy
- `openai/gpt-4o` - Balanced

---

## AI Prompt Rules

**Critical Rules**:
- Return ONLY valid JSON (no markdown blocks)
- Use exact enum values (no variations)
- Use `null` for missing data (never guess)

**Extraction Logic**:
- **Stack**: Tech names only ("React", "AWS"), not full sentences
- **Location**: City in English, strip codes (`"30-307 Kraków"` → `"Krakow"`)
- **Salary**: Remove spaces (`"15 000"` → `15000`)
- **Seniority**: "Principal/Staff" → "senior", "Architect" → "lead", "VP" → "manager"

---

## Validation & Auto-Fix

**Post-processing steps**:

1. **Tech Normalization**: Case-insensitive matching (70+ techs)
   - `"python"` → `"Python"`, `"aws"` → `"AWS"`, `"kubernetes"` → `"Kubernetes"`

2. **Deduplication**: Removes duplicates, preserves order

3. **Location Mapping**: `"Warszawa"` → `"Warsaw"`, removes postal codes

4. **Whitespace**: Strips empty strings from lists

**Known Technologies** (70+ items):
Cloud (AWS, Azure, GCP, Docker, Kubernetes), Languages (Python, Go, Java, TypeScript), 
Databases (PostgreSQL, MongoDB, Redis), Frontend (React, Vue, Next.js), 
Backend (FastAPI, Django, Spring Boot), DevOps (Jenkins, GitHub Actions, Prometheus)

---

## Source Detection

Job board auto-detection:
- **indeed** (indeed.com) | **nofluffjobs** (nofluffjobs.com)
- **pracuj** (pracuj.pl) | **justjoin** (justjoin.it) | **linkedin** (linkedin.com)
- **fallback**: domain name

---

## Error Handling

**API**: Timeout (60s), HTTP errors, malformed JSON  
**Validation**: Negative salary, max < min, invalid enums (auto-normalized)  
**Logging**: 🤖 Parsing / ✅ Success / ❌ Errors

---

## Best Practices

1. ✅ Send full job descriptions for accuracy
2. 💰 Use `gpt-4o-mini` for production (10x cheaper than GPT-4)
3. 🔍 Validate critical fields (`job_title`, `company`) before saving
4. ⚠️ Handle optional fields (many are `None`)
5. 📊 Monitor LLM output quality for prompt optimization

---

## Testing

```bash
pytest server/tests/unit/           # Salary & validator tests
pytest server/tests/integration/    # Full API tests
```

---

## Function Reference

### `parse_with_ai(text, model, custom_prompt, source_url)`
Main parsing function.

**Parameters**:
- `text` (str): Raw job posting text/HTML
- `model` (str): OpenRouter model ID (default: "openai/gpt-4o-mini")
- `custom_prompt` (str): Optional custom extraction prompt
- `source_url` (str): Optional URL for source detection

**Returns**: `JobPosting` - Validated Pydantic model

**Raises**:
- `ValueError`: API errors, invalid JSON, validation failures
- `requests.exceptions.Timeout`: After 60s

### `auto_fix_job_posting(job)`
Normalizes tech stack, locations, and removes duplicates. Called automatically by `parse_with_ai`.

---

## Limitations

- ⚠️ Requires API key (no offline mode)
- 💰 Cost: $0.0001-0.001 per job (model-dependent)
- ⏱️ Latency: 2-5 seconds per job
- 🎯 Accuracy: 85-95% (depends on input quality)
- 🌍 Optimized for English/Polish postings
