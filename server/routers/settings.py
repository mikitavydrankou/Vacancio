from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests

from core.database import get_db
from database import crud, schemas
from services.settings_service import OPENROUTER_KEY, get_key_status, get_openrouter_key

router = APIRouter()


@router.get("/openrouter", response_model=schemas.OpenRouterStatus)
def get_openrouter_status(db: Session = Depends(get_db)):
    """Whether an OpenRouter key is configured and where it comes from (key is never returned)."""
    return get_key_status(db)


@router.put("/openrouter", response_model=schemas.OpenRouterStatus)
def update_openrouter_key(payload: schemas.OpenRouterKeyUpdate, db: Session = Depends(get_db)):
    """Save the OpenRouter key (overrides env). Send an empty string to clear it."""
    crud.set_setting(db, OPENROUTER_KEY, payload.api_key.strip() or None)
    return get_key_status(db)


@router.post("/openrouter/test")
def test_openrouter_key(payload: schemas.OpenRouterKeyUpdate, db: Session = Depends(get_db)):
    """Validate a key against OpenRouter. Uses the provided key, or the stored/env one if blank."""
    key = payload.api_key.strip() or get_openrouter_key(db)
    if not key:
        raise HTTPException(status_code=400, detail="No API key provided or stored")

    try:
        response = requests.get(
            "https://openrouter.ai/api/v1/key",
            headers={"Authorization": f"Bearer {key}"},
            timeout=15,
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Could not reach OpenRouter: {e}")

    if response.status_code == 200:
        return {"valid": True}
    if response.status_code in (401, 403):
        return {"valid": False, "detail": "Invalid API key"}
    return {"valid": False, "detail": f"OpenRouter returned status {response.status_code}"}
