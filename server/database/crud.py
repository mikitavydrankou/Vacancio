from sqlalchemy.orm import Session
from . import models, schemas


def get_profile(db: Session, profile_id: str):
    return db.query(models.Profile).filter(models.Profile.id == profile_id).first()


def get_profile_by_name(db: Session, name: str):
    return db.query(models.Profile).filter(models.Profile.name == name).first()


def get_profiles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Profile).offset(skip).limit(limit).all()


def create_profile(db: Session, profile: schemas.ProfileCreate):
    db_profile = models.Profile(name=profile.name)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


def delete_profile(db: Session, profile_id: str):
    db_profile = get_profile(db, profile_id)
    if db_profile:
        db.delete(db_profile)
        db.commit()
    return db_profile


def get_resumes(db: Session, profile_id: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Resume)
    if profile_id:
        query = query.filter(models.Resume.profile_id == profile_id)
    return query.order_by(models.Resume.version.desc()).offset(skip).limit(limit).all()


def get_resume(db: Session, resume_id: str):
    return db.query(models.Resume).filter(models.Resume.id == resume_id).first()


def get_latest_resume_version(db: Session, profile_id: str) -> int:
    last_resume = db.query(models.Resume).filter(
        models.Resume.profile_id == profile_id
    ).order_by(models.Resume.version.desc()).first()
    return last_resume.version if last_resume else 0


def create_resume(db: Session, resume: schemas.ResumeCreate, file_path: str, version: int):
    db_resume = models.Resume(
        profile_id=resume.profile_id,
        name=resume.name,
        version=version,
        file_path=file_path
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume


def get_applications(db: Session, profile_id: str = None, resume_version: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.JobApplication)
    if profile_id:
        query = query.filter(models.JobApplication.profile_id == profile_id)
    if resume_version:
        query = query.filter(models.JobApplication.resume_version == resume_version)
    return query.order_by(models.JobApplication.applied_at.desc()).offset(skip).limit(limit).all()


def get_application(db: Session, application_id: str):
    return db.query(models.JobApplication).filter(models.JobApplication.id == application_id).first()


def create_application(db: Session, application: schemas.JobApplicationCreate):
    db_app = models.JobApplication(**application.model_dump())
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app


def update_application(db: Session, application_id: str, updates: schemas.JobApplicationUpdate):
    db_app = get_application(db, application_id)
    if not db_app:
        return None
    
    update_data = updates.model_dump(exclude_unset=True)
    # Ensure critical fields aren't accidentally set to None if present in update_data
    if "status" in update_data and update_data["status"] is None:
        del update_data["status"]
        
    for key, value in update_data.items():
        setattr(db_app, key, value)

    
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app


def delete_application(db: Session, application_id: str):
    db_app = get_application(db, application_id)
    if db_app:
        db.delete(db_app)
        db.commit()
    return db_app
