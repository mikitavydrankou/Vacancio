from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
import uuid
import enum

from core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class ApplicationStatus(str, enum.Enum):
    parsing = "parsing"
    failed = "failed"
    no_response = "no_response"
    screening = "screening"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"


class Seniority(str, enum.Enum):
    trainee = "trainee"
    junior = "junior"
    mid = "mid"
    senior = "senior"
    lead = "lead"
    manager = "manager"


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resumes = relationship("Resume", back_populates="profile", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="profile", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=generate_uuid)
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    version = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="resumes")
    applications = relationship("JobApplication", back_populates="resume")


class JobApplication(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=generate_uuid)
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=False)
    resume_version = Column(Integer, nullable=False)
    
    url = Column(String, nullable=True)

    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    location = Column(String)
    salary = Column(String)
    source = Column(String)
    
    tech_stack = Column(JSONB, default=[])
    nice_to_have_stack = Column(JSONB, default=[])
    responsibilities = Column(JSONB, default=[])
    requirements = Column(JSONB, default=[])
    work_mode = Column(String)
    employment_type = Column(String)
    seniority = Column(Enum(Seniority), nullable=True)
    description = Column(Text)
    raw_data = Column(Text)
    
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.no_response)
    is_favorite = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True))
    interview_date = Column(DateTime(timezone=True))
    rejected_at = Column(DateTime(timezone=True))
    
    profile = relationship("Profile", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
