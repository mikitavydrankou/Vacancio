# Core Systems

Configuration, database connection, and environment management.

## 1. Configuration (`config.py`)

The application uses **Pydantic Settings (v2)** for robust, type-safe configuration. It loads variables from `.env` files and environment variables, with sensible defaults for a "zero-config" experience.

### Key Settings
- `DATA_DIR`: Directory for persistent data (Default: `data/`).
- `DATABASE_URL`: Connection string (Default: `sqlite:///data/vacancio.db`).
- `UPLOAD_DIR`: Resume storage path (Default: `data/uploads/`).
- `OPENROUTER_API_KEY`: Required for AI parsing features.

### Usage
```python
from core.config import settings

print(settings.DATABASE_URL)
```

## 2. Database Layer (`database.py`)

Handles the SQLAlchemy engine and session lifecycle.

### Connection Strategy
- **Engine**: Auto-detects SQLite vs PostgreSQL.
- **SQLite Optimization**: Enables WAL (Write-Ahead-Logging) mode for better concurrency.
- **Session Management**: Provides a scoped `SessionLocal` via `get_db()` dependency.

### Auto-Migration (`migration.py`)
To support the "pull & run" architecture, the system includes an auto-migration script that runs on startup:
1.  Checks for legacy data files (`vacancio.db`, `uploads/`) in the root directory.
2.  If found, moves them to the secure `data/` directory.
3.  Ensures seamless upgrades for existing users.

