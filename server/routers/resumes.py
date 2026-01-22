from fastapi import APIRouter, Depends, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil

from core.database import get_db
from core.config import UPLOAD_DIR
from database import crud, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.Resume])
def read_resumes(profile_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_resumes(db, profile_id=profile_id, skip=skip, limit=limit)


@router.post("/", response_model=schemas.Resume)
async def create_resume(
    profile_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    version = crud.get_latest_resume_version(db, profile_id) + 1
    
    safe_filename = file.filename.replace(" ", "_").replace("/", "").replace("\\", "")
    file_path = os.path.join(UPLOAD_DIR, f"{profile_id}_v{version}_{safe_filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    resume_create = schemas.ResumeCreate(
        name=file.filename.replace(".pdf", ""),
        profile_id=profile_id
    )
    
    return crud.create_resume(db=db, resume=resume_create, file_path=file_path, version=version)
