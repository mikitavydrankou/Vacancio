from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import traceback

from core.database import get_db
from database import crud, schemas, models
from services.job_parser.ai.parser import parse_with_ai

router = APIRouter()
logger = logging.getLogger(__name__)


def _format_salary(salary) -> Optional[str]:
    if not salary:
        return None
    parts = []
    if salary.min and salary.max:
        parts.append(f"{salary.min} - {salary.max}")
    elif salary.min:
        parts.append(f"{salary.min}+")
    elif salary.max:
        parts.append(f"up to {salary.max}")
    if salary.currency:
        parts.append(salary.currency)
    return " ".join(parts)


def process_application_background(app_id: str):
    logger.info(f"📋 Starting background parsing for application {app_id}")
    db = next(get_db())
    try:
        db_app = crud.get_application(db, app_id)
        if not db_app:
            logger.warning(f"❌ Application {app_id} not found")
            return

        if not db_app.raw_data:
            logger.warning(f"❌ No raw data for application {app_id}")
            return

        parsed = parse_with_ai(db_app.raw_data, source_url=db_app.url)
        logger.info(f"✅ Parsing complete for {app_id}: {parsed.job_title} @ {parsed.company}")
        
        updates = schemas.JobApplicationUpdate(
            company=(parsed.company or "Unknown").strip()[:100],
            position=(parsed.job_title or "Unknown Position").strip()[:100],
            location=(parsed.location or "").strip()[:100],
            salary=_format_salary(parsed.salary),
            tech_stack=parsed.stack or [],
            nice_to_have_stack=parsed.nice_to_have_stack or [],
            responsibilities=parsed.responsibilities or [],
            requirements=parsed.requirements or [],
            description=parsed.project_description,
            work_mode=parsed.work_mode,
            employment_type=parsed.employment_type,
            seniority=parsed.seniority,
            status=models.ApplicationStatus.no_response
        )
        
        crud.update_application(db, app_id, updates)
        logger.info(f"✅ Successfully updated application {app_id}")
        
    except Exception as e:
        error_msg = f"Error processing application {app_id}: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        
        try:
            failed_updates = schemas.JobApplicationUpdate(
                status=models.ApplicationStatus.failed,
                description=f"❌ Parsing failed: {str(e)[:500]}"
            )
            crud.update_application(db, app_id, failed_updates)
        except Exception as update_error:
            logger.error(f"Failed to update application status: {update_error}")
    finally:
        db.close()


@router.get("/", response_model=List[schemas.JobApplication])
def read_applications(
    profile_id: Optional[str] = None, 
    resume_version: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    return crud.get_applications(db, profile_id=profile_id, resume_version=resume_version, skip=skip, limit=limit)


@router.post("/", response_model=schemas.JobApplication)
def create_application(
    app_data: schemas.JobApplicationCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    new_app = crud.create_application(db, app_data)
    background_tasks.add_task(process_application_background, new_app.id)
    return new_app


@router.get("/{app_id}", response_model=schemas.JobApplication)
def read_application(app_id: str, db: Session = Depends(get_db)):
    db_app = crud.get_application(db, app_id)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_app


@router.put("/{app_id}", response_model=schemas.JobApplication)
def update_application(app_id: str, updates: schemas.JobApplicationUpdate, db: Session = Depends(get_db)):
    db_app = crud.update_application(db, app_id, updates)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_app


@router.delete("/{app_id}")
def delete_application(app_id: str, db: Session = Depends(get_db)):
    db_app = crud.delete_application(db, app_id)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"ok": True}
