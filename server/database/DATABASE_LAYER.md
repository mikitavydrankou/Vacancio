# Database

Data models, schemas, and CRUD operations.

## Technologies
- **SQLAlchemy 2.0**: Uses modern `Mapped[...]` and `mapped_column()` syntax for full type safety.
- **Alembic** (future): Migration management.
- **SQLite (WAL)**: Default storage engine for zero-config deployment.

## Files

### models.py
SQLAlchemy ORM models (v2.0 syntax):
- **Profile** - User profiles
- **Resume** - Resume versions with file storage
- **JobApplication** - Job applications with full details

Models use strict type hinting:
```python
class Profile(Base):
    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(unique=True)
```

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
