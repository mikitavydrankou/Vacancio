from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from database import crud, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.Profile])
def read_profiles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_profiles(db, skip=skip, limit=limit)


@router.post("/", response_model=schemas.Profile)
def create_profile(profile: schemas.ProfileCreate, db: Session = Depends(get_db)):
    db_profile = crud.get_profile_by_name(db, name=profile.name)
    if db_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")
    return crud.create_profile(db=db, profile=profile)


@router.delete("/{profile_id}")
def delete_profile(profile_id: str, db: Session = Depends(get_db)):
    db_profile = crud.delete_profile(db, profile_id)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"ok": True}
