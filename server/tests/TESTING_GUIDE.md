# Testing Guide

Test suite for Vacancio backend focusing on the AI Job Parser Agent and API functionality.

---

## Overview

**Test Layers**:
- **AI Job Parser Agent** - LLM extraction, validation, normalization
- **Business Logic** - Data processing workflows
- **API Endpoints** - FastAPI routes, database operations

**Philosophy**: Fast feedback (<1s unit tests), isolated tests (fresh DB), realistic data patterns.

**Tools**: pytest, FastAPI TestClient, SQLAlchemy (in-memory), pytest-mock, pytest-cov

---

## Structure

```
tests/
├── conftest.py           # Global fixtures (DB, client)
├── TESTING_GUIDE.md      # This file
├── unit/                 # Fast isolated tests
│   ├── test_salary.py
│   └── test_validator.py
└── integration/          # Multi-component tests
    ├── test_applications.py
    ├── test_profiles.py
    └── test_job_parser_integration.py
```

### conftest.py - Core Fixtures
```python
@pytest.fixture(scope="function")
def db_session():
    """Fresh in-memory SQLite per test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with DB override"""
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
```

---

## Testing the AI Job Parser Agent

**Components to Test**:
1. **LLM Integration** - OpenRouter API calls
2. **Response Parsing** - JSON extraction from LLM
3. **Validation** - Pydantic model enforcement
4. **Normalization** - Tech stack, locations, salary

**Strategy**:
- **Unit Tests**: Individual components (validators, models) - no external APIs
- **Integration Tests**: Full flow with mocked LLM responses
- **Live Tests** (optional): Real API - marked `@pytest.mark.live`, CI-skipped

---

## Unit Testing

### Validators (test_validator.py)

```python
def test_normalize_technology_case_insensitive():
    assert normalize_technology("python") == "Python"
    assert normalize_technology("NodE.JS") == "Node.js"

def test_normalize_location_polish_to_english():
    assert normalize_location("Warszawa") == "Warsaw"
    assert normalize_location("Warsaw 00-001") == "Warsaw"  # Zipcode removed

def test_auto_fix_normalizes_and_dedupes():
    job = JobPosting(stack=[" python ", "PYTHON", "Java"])
    fixed = auto_fix_job_posting(job)
    assert "Python" in fixed.stack and len(fixed.stack) == 2
```

### Salary & Models (test_salary.py, test_models.py)

```python
def test_salary_validation():
    with pytest.raises(ValueError):
        Salary(min=-1000)  # Negative
    with pytest.raises(ValueError):
        Salary(min=10000, max=5000)  # max < min

def test_job_posting():
    job = JobPosting(job_title="Dev", stack=["Python"])
    assert job.job_title == "Dev"
```

---

## Integration Testing

### Job Parser with Mocked LLM

```python
def test_parse_with_ai_success(mocker):
    """Full parsing flow with mocked OpenRouter"""
    mock_response = {
        "choices": [{
            "message": {"content": json.dumps({
                "job_title": "Senior Python Developer",
                "company": "TechCorp",
                "location": "Warsaw",
                "stack": ["Python", "FastAPI"],
                "salary": {"min": 15000, "max": 20000, "currency": "PLN"}
            })}
        }]
    }
    
    mock_post = mocker.patch("requests.post")
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = mock_response
    
    job = parse_with_ai(text="...", source_url="https://nofluffjobs.com/job/123")
    
    assert job.job_title == "Senior Python Developer"
    assert job.source == "nofluffjobs"
    assert job.salary.min == 15000
```

### Error Handling

```python
def test_parse_api_timeout(mocker):
    mocker.patch("requests.post", side_effect=requests.exceptions.Timeout)
    with pytest.raises(requests.exceptions.Timeout):
        parse_with_ai(text="...")

def test_parse_api_http_error(mocker):
    mock_resp = mocker.Mock()
    mock_resp.raise_for_status.side_effect = requests.exceptions.HTTPError
    mocker.patch("requests.post", return_value=mock_resp)
    with pytest.raises(ValueError, match="API request failed"):
        parse_with_ai(text="...")

def test_parse_invalid_json(mocker):
    mock_response = {"choices": [{"message": {"content": "Not JSON"}}]}
    mocker.patch("requests.post").return_value.json.return_value = mock_response
    with pytest.raises(ValueError, match="Invalid JSON"):
        parse_with_ai(text="...")

def test_parse_validation_error(mocker):
    mock_response = {
        "choices": [{
            "message": {"content": json.dumps({"salary": {"min": 10000, "max": 5000}})}
        }]
    }
    mocker.patch("requests.post").return_value.json.return_value = mock_response
    with pytest.raises(ValueError, match="validation failed"):
        parse_with_ai(text="...")
```errors(mocker):
    # Timeout
    mocker.patch("requests.post", side_effect=requests.exceptions.Timeout)
    with pytest.raises(requests.exceptions.Timeout):
        parse_with_ai(text="...")
    
    # Invalid JSON
    mocker.patch("requests.post").return_value.json.return_value = {
        "choices": [{"message": {"content": "Not JSON"}}]
    }
    with pytest.raises(ValueError, match="Invalid JSON"):
        parse_with_ai(text="...")
    
    # Validation error (max < min)
    mocker.patch("requests.post").return_value.json.return_value = {
        "choices": [{"message": {"content": json.dumps({"salary": {"min": 10000, "max": 5000}})}}]
    }
    with pytest.raises(ValueError, match="validation failed"):
        parse_with_ai(text="...")
    job = parse_with_ai(text="...")
    assert job.job_title == "Dev"
```

---

## Test Data

```python
@pytest.fixture
def sample_job_text():
    return """
    Senior Python Developer - TechCorp
    Warsaw (Hybrid)
    Salary: 15-20k PLN/month B2B
    
    Requirements: 5+ years Python, FastAPI, PostgreSQL
    Tech: Python, FastAPI, PostgreSQL, AWS, Docker
    """
```

---

## Running Tests

```bash
pytest                    # All tests
pytest tests/unit/        # Unit only
pytest tests/integration/ # Integration only
pytest -v                 # Verbose
pytest -s                 # Show prints
pytest -x                 # Stop on first fail
pytest --lf               # Last failed
pytest --cov=server       # Coverage

# Markers
pytest -m "not slow"      # Skip slow tests
pytest -m live            # Run live API tests
```

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  tRunning Tests

```bash
pytest                    # All tests
pytest tests/unit/        # Unit only
pytest tests/integration/ # Integration only
pytest -v                 # Verbose
pytest -x                 # Stop on first fail
pytest --cov=server       # Coverage report
pytest -m "not slow"      # Skip slow tests
```

---

## CI/CD Example

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-python@v4
      with: { python-version: '3.11' }
    - run: pip install -r server/requirements.txt && pip install pytest pytest-mock
    - run: cd server && pytest -v
      env: { OPENROUTER_API_KEY: "mock-key" }
### 5. Parametrize Similar Cases
```python
@pytest.mark.parametrize("input,expected", [
    ("python", "Python"),
    ("PYTHON", "Python"),
])
def test_normalize(input, expected):
    assert normalize_technology(input) == expected
```

### 6. Mock Externals
```python
def test_parse(mocker):  # ✅ Mocked
    mocker.patch("requests.post").return_value.json.return_value = {...}
    job = parse_with_ai(text="...")

def test_parse():  # ❌ Hits real API
    job = parse_with_ai(text="...")
```

### 7. Test Error Paths
```python
def test_timeout(mocker):
    mocker.patch("requests.post", side_effect=Timeout)
    with pytest.raises(Timeout):
        parse_with_ai(text="...")
```

### 8. Isolation
```python
def test_create(db_session):  # ✅ Self-contained
    profile = Profile(name="John")
    db_session.add(profile)
    db_session.commit()
```

1. **Descriptive Names**: `test_normalize_technology_case_insensitive()` not `test_normalize()`
2. **AAA Pattern**: Arrange data → Act (execute) → Assert results
3. **One Concept**: One test validates one behavior
4. **Use Fixtures**: Share setup code via `@pytest.fixture`
5. **Parametrize**: Use `@pytest.mark.parametrize` for similar cases
6. **Mock Externals**: Always mock API calls to avoid cost/latency
7. **Test Errors**: Verify exception handling with `pytest.raises`
8. **Isolation**: Each test is independent (fresh DB, no shared state)