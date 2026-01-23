from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime

from database.models import ApplicationStatus, Seniority

class ProfileBase(BaseModel):
    name: str

class ProfileCreate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class ResumeBase(BaseModel):
    name: str

class ResumeCreate(ResumeBase):
    profile_id: str

class Resume(ResumeBase):
    id: str
    profile_id: str
    version: int
    file_path: str
    uploaded_at: datetime
    # We might not send file_data back, just metadata/url to download

    model_config = {
        "from_attributes": True
    }


class JobApplicationBase(BaseModel):
    url: str
    company: str
    position: str
    location: Optional[str] = None
    salary: Optional[str] = None
    source: Optional[str] = None
    tech_stack: List[str] = []
    nice_to_have_stack: List[str] = []
    responsibilities: List[str] = []
    requirements: List[str] = []
    work_mode: Optional[str] = None
    employment_type: Optional[str] = None
    seniority: Optional[Seniority] = None
    description: Optional[str] = None
    raw_data: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.parsing
    is_favorite: bool = False
    is_archived: bool = False

class JobApplicationCreate(JobApplicationBase):
    profile_id: str
    resume_id: str
    resume_version: int
    url: Optional[str] = ""
    company: Optional[str] = "Parsing..."
    position: Optional[str] = "Parsing..."

class JobApplicationUpdate(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    nice_to_have_stack: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    work_mode: Optional[str] = None
    employment_type: Optional[str] = None
    seniority: Optional[Seniority] = None
    description: Optional[str] = None
    
    status: Optional[ApplicationStatus] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None
    responded_at: Optional[datetime] = None
    interview_date: Optional[datetime] = None
    rejected_at: Optional[datetime] = None

class JobApplication(JobApplicationBase):
    id: str
    profile_id: str
    resume_id: str
    resume_version: int
    
    applied_at: datetime
    responded_at: Optional[datetime]
    interview_date: Optional[datetime]
    rejected_at: Optional[datetime]

    model_config = {
        "from_attributes": True
    }

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v):
        if v is None:
            return ApplicationStatus.failed
        return v

