from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import logging

from core.database import get_db
from core.config import settings
from database import crud, schemas

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=List[schemas.Resume])
def read_resumes(profile_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_resumes(db, profile_id=profile_id, skip=skip, limit=limit)


@router.post("", response_model=schemas.Resume)
async def create_resume(
    profile_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not crud.get_profile(db, profile_id):
        raise HTTPException(status_code=404, detail="Profile not found")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    version = crud.get_latest_resume_version(db, profile_id) + 1

    safe_filename = os.path.basename(file.filename).replace(" ", "_")
    file_path = os.path.join(settings.UPLOAD_DIR, f"{profile_id}_v{version}_{safe_filename}")

    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except OSError as e:
        logger.error(f"Failed to save resume file to {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    name = file.filename[:-4] if file.filename.lower().endswith(".pdf") else file.filename
    resume_create = schemas.ResumeCreate(name=name, profile_id=profile_id)

    return crud.create_resume(db=db, resume=resume_create, file_path=file_path, version=version)


@router.put("/{resume_id}", response_model=schemas.Resume)
def rename_resume(resume_id: str, payload: schemas.ResumeUpdate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    db_resume = crud.update_resume(db, resume_id, name)
    if not db_resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return db_resume


@router.delete("/{resume_id}")
def delete_resume(resume_id: str, db: Session = Depends(get_db)):
    db_resume = crud.delete_resume(db, resume_id)
    if not db_resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"ok": True}
