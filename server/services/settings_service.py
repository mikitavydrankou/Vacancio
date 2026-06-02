"""Resolution and status of app-level settings (currently the OpenRouter API key).

Precedence: a key saved through the UI (stored in the DB) overrides the
OPENROUTER_API_KEY environment variable. This lets users configure the key from
the interface without restarting the container, while keeping env vars as a
fallback for headless/automated deployments.
"""
import os
from typing import Optional

from sqlalchemy.orm import Session

from database import crud

OPENROUTER_KEY = "openrouter_api_key"


def get_openrouter_key(db: Session) -> Optional[str]:
    """Return the effective OpenRouter key: DB value first, then env var."""
    return crud.get_setting(db, OPENROUTER_KEY) or os.getenv("OPENROUTER_API_KEY")


def _mask(key: str) -> str:
    if len(key) <= 12:
        return "••••"
    return f"{key[:6]}…{key[-4:]}"


def get_key_status(db: Session) -> dict:
    """Return whether a key is configured and where it comes from (never the raw key)."""
    db_key = crud.get_setting(db, OPENROUTER_KEY)
    env_key = os.getenv("OPENROUTER_API_KEY")

    if db_key:
        source, key = "db", db_key
    elif env_key:
        source, key = "env", env_key
    else:
        source, key = "none", None

    return {
        "configured": key is not None,
        "source": source,
        "masked": _mask(key) if key else None,
    }
