# Database

Data models, schemas, and CRUD operations.

## Files

### models.py
SQLAlchemy ORM models:
- **Profile** - User profiles
- **Resume** - Resume versions with file storage
- **JobApplication** - Job applications with full details

Enums:
- **ApplicationStatus** - parsing, failed, no_response, screening, interview, offer, rejected
- **Seniority** - trainee, junior, mid, senior, lead, manager

### schemas.py
Pydantic models for request/response validation:
- Profile (Create, Update, Response)
- Resume (Create, Update, Response)
- JobApplication (Create, Update, Response)

### crud.py
Database operations for all models:
- Create, read, update, delete functions
- Filtering and querying helpers
