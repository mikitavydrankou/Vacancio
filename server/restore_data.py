import json
import os
import sys
from sqlalchemy.orm import Session
from datetime import datetime

# Add the current directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal, engine, Base
from database import models, schemas
from database import crud

def restore_data(json_path: str = "vacancies_backup.json"):
    print(f"Reading data from {json_path}...")
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {json_path} not found.")
        return
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return

    db = SessionLocal()
    
    # ensure tables exist
    models.Base.metadata.create_all(bind=engine)

    try:
        # 1. Get or Create Profile
        profile_name = "Restored User"
        profile = crud.get_profile_by_name(db, profile_name)
        if not profile:
            print(f"Creating profile '{profile_name}'...")
            profile_create = schemas.ProfileCreate(name=profile_name)
            profile = crud.create_profile(db, profile_create)
        else:
            print(f"Using existing profile '{profile.name}' (ID: {profile.id})")

        # 2. Get or Create Resume
        resume_version = crud.get_latest_resume_version(db, profile.id)
        if resume_version == 0:
            print("Creating default resume...")
            resume_create = schemas.ResumeCreate(name="Restored Resume", profile_id=profile.id)
            resume = crud.create_resume(db, resume_create, file_path="placeholder.pdf", version=1)
            resume_version = 1
        else:
            print(f"Using latest resume version: {resume_version}")
            # Get the resume object
            # We assume the resume exists if version > 0
            resume = db.query(models.Resume).filter(
                models.Resume.profile_id == profile.id,
                models.Resume.version == resume_version
            ).first()

        # 3. Import Applications
        print(f"Found {len(data)} applications to import.")
        count = 0
        for item in data:
            # Fix data mapping
            
            # Map Seniority
            seniority_val = item.get("seniority")
            if seniority_val:
                if seniority_val.startswith("Seniority."):
                    seniority_val = seniority_val.split(".")[1]
                # Validate if it's a valid enum member
                if seniority_val not in models.Seniority.__members__:
                     # fallback or keep as None if invalid
                     print(f"Warning: Invalid seniority '{seniority_val}' for {item.get('company')}, setting to None")
                     seniority_val = None
            
            # Handle timestamps if they aren't in the JSON (assuming they are new imports)
            
            # Create Schema Object
            # We need to map JSON keys to JobApplicationCreate keys
            app_create = schemas.JobApplicationCreate(
                profile_id=profile.id,
                resume_id=resume.id,
                resume_version=resume_version,
                url=item.get("url"),
                company=item.get("company"),
                position=item.get("position"),
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
                raw_data=json.dumps(item), # Store original as raw_data just in case
                status=models.ApplicationStatus.no_response # Default status
            )
            
            # Use CRUD to create
            try:
                # Check duplicates based on URL if available
                existing = None
                if app_create.url:
                    existing = db.query(models.JobApplication).filter(models.JobApplication.url == app_create.url).first()
                
                if not existing:
                    crud.create_application(db, app_create)
                    count += 1
                else:
                    print(f"Skipping duplicate: {app_create.company} - {app_create.position}")

            except Exception as e:
                print(f"Failed to import {item.get('company')}: {e}")

        print(f"Successfully restored {count} applications.")

    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        restore_data(sys.argv[1])
    else:
        restore_data()
