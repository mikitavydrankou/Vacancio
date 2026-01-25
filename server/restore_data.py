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

import argparse

# ... imports ...

def restore_data(json_path: str = "vacancies_backup.json", profile_name: str = "Restored User", resume_path: str = "placeholder.pdf"):
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
        print(f"Checking for profile: '{profile_name}'")
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
            print(f"Creating default resume (v1) from {resume_path}...")
            # Ideally we would upload/copy the file here if it were a real upload
            resume_create = schemas.ResumeCreate(name="Restored Resume", profile_id=profile.id)
            resume = crud.create_resume(db, resume_create, file_path=resume_path, version=1)
            resume_version = 1
        else:
            print(f"Using latest resume version: {resume_version}")
            resume = db.query(models.Resume).filter(
                models.Resume.profile_id == profile.id,
                models.Resume.version == resume_version
            ).first()
            
        # ... rest of the import logic remains mostly the same ...
        
        # 3. Import Applications
        print(f"Found {len(data)} applications to import.")
        count = 0
        for item in data:
            # Fix data mapping
            
            # Map Seniority
            seniority_val = item.get("seniority")
            if seniority_val:
                if isinstance(seniority_val, str) and seniority_val.startswith("Seniority."):
                    seniority_val = seniority_val.split(".")[1]
                
                # Check directly against values
                valid_seniorities = [e.value for e in models.Seniority]
                if seniority_val not in valid_seniorities:
                     # Try to match by name
                     if seniority_val in models.Seniority.__members__:
                        seniority_val = models.Seniority[seniority_val].value
                     else:
                        # print(f"Warning: Invalid seniority '{seniority_val}' for {item.get('company')}, setting to None")
                        seniority_val = None
            
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
                raw_data=json.dumps(item), 
                status=models.ApplicationStatus.no_response
            )
            
            try:
                # Check duplicates based on URL
                existing = None
                if app_create.url:
                    existing = db.query(models.JobApplication).filter(
                        models.JobApplication.url == app_create.url,
                        models.JobApplication.profile_id == profile.id  # Check within profile
                    ).first()
                
                if not existing:
                    crud.create_application(db, app_create)
                    count += 1
                else:
                    # Optional: Update existing? For now, skip
                    pass

            except Exception as e:
                print(f"Failed to import {item.get('company')}: {e}")

        print(f"Successfully restored {count} applications for profile '{profile.name}'.")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Restore vacancies from JSON.")
    parser.add_argument("json_file", nargs="?", default="vacancies_backup.json", help="Path to JSON file")
    parser.add_argument("--name", default="Restored User", help="Profile name to use or create")
    parser.add_argument("--resume", default="placeholder.pdf", help="Fake path/name for the created resume")
    
    args = parser.parse_args()
    
    restore_data(args.json_file, args.name, args.resume)
