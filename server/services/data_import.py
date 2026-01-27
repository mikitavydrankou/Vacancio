import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from database import models, schemas, crud

def import_applications(db: Session, data: List[Dict[str, Any]], profile_name: str = None) -> Dict[str, Any]:
    """
    Import applications from a list of dictionaries.
    If profile_name is provided, tries to use/create that profile.
    Otherwise, uses the most recent profile.
    """
    results = {
        "success_count": 0,
        "errors": [],
        "profile_used": None,
        "total_items": len(data)
    }

    profile = None
    if profile_name:
        profile = crud.get_profile_by_name(db, profile_name)
        if not profile:
            profile_create = schemas.ProfileCreate(name=profile_name)
            profile = crud.create_profile(db, profile_create)
    else:
        profile = db.query(models.Profile).order_by(models.Profile.created_at.desc()).first()
        if not profile:
            profile_create = schemas.ProfileCreate(name="Restored User")
            profile = crud.create_profile(db, profile_create)
    
    results["profile_used"] = profile.name

    resume_version = crud.get_latest_resume_version(db, profile.id)
    resume = None
    
    if resume_version == 0:
        resume_create = schemas.ResumeCreate(name="Default Resume", profile_id=profile.id)
        resume = crud.create_resume(db, resume_create, file_path="placeholder.pdf", version=1)
        resume_version = 1
    else:
        resume = db.query(models.Resume).filter(
            models.Resume.profile_id == profile.id,
            models.Resume.version == resume_version
        ).first()

    for index, item in enumerate(data):
        try:
            seniority_val = item.get("seniority")
            if seniority_val:
                if isinstance(seniority_val, str) and seniority_val.startswith("Seniority."):
                    seniority_val = seniority_val.split(".")[1]
                
                valid_seniorities = [e.value for e in models.Seniority]
                if seniority_val not in valid_seniorities:
                     if seniority_val in models.Seniority.__members__:
                        seniority_val = models.Seniority[seniority_val].value
                     else:
                        seniority_val = None
            
            app_create = schemas.JobApplicationCreate(
                profile_id=profile.id,
                resume_id=resume.id,
                resume_version=resume_version,
                url=item.get("url"),
                company=item.get("company") or "Unknown Company",
                position=item.get("position") or "Unknown Position",
                location=item.get("location"),
                salary=item.get("salary"),
                source=item.get("source"),
                tech_stack=item.get("tech_stack", []),
                nice_to_have_stack=item.get("nice_to_have_stack", []),
                responsibilities=item.get("responsibilities", []),
                requirements=item.get("requirements", []),
                work_mode=item.get("work_mode"),
                employment_type=item.get("employment_type"),
                seniority=seniority_val,
                description=item.get("description"),
                raw_data=json.dumps(item), 
                status=models.ApplicationStatus.no_response
            )
            
            existing = None
            if app_create.url:
                 existing = db.query(models.JobApplication).filter(
                    models.JobApplication.url == app_create.url,
                    models.JobApplication.profile_id == profile.id
                ).first()
            
            if not existing:
                crud.create_application(db, app_create)
                results["success_count"] += 1
            else:
                 results["errors"].append(f"Skipped duplicate (Index {index}): {app_create.company} - {app_create.url}")

        except Exception as e:
            results["errors"].append(f"Failed item {index}: {str(e)}")
            
    return results
