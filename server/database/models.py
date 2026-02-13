from sqlalchemy import ForeignKey, Text, Enum, Boolean, String, Integer, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy.types import JSON
from typing import List, Optional, Any
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

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(unique=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    resumes: Mapped[List["Resume"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    applications: Mapped[List["JobApplication"]] = relationship(back_populates="profile", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"))
    name: Mapped[str] = mapped_column()
    version: Mapped[int] = mapped_column()
    file_path: Mapped[str] = mapped_column()
    uploaded_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile: Mapped["Profile"] = relationship(back_populates="resumes")
    applications: Mapped[List["JobApplication"]] = relationship(back_populates="resume")


class JobApplication(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(primary_key=True, default=generate_uuid)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"))
    resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id"))
    resume_version: Mapped[int] = mapped_column()
    
    url: Mapped[Optional[str]] = mapped_column(nullable=True)

    company: Mapped[str] = mapped_column()
    position: Mapped[str] = mapped_column()
    location: Mapped[Optional[str]] = mapped_column(nullable=True)
    salary: Mapped[Optional[str]] = mapped_column(nullable=True)
    source: Mapped[Optional[str]] = mapped_column(nullable=True)
    
    tech_stack: Mapped[List[Any]] = mapped_column(JSON, default=[])
    nice_to_have_stack: Mapped[List[Any]] = mapped_column(JSON, default=[])
    responsibilities: Mapped[List[Any]] = mapped_column(JSON, default=[])
    requirements: Mapped[List[Any]] = mapped_column(JSON, default=[])
    work_mode: Mapped[Optional[str]] = mapped_column(nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(nullable=True)
    seniority: Mapped[Optional[Seniority]] = mapped_column(Enum(Seniority), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[ApplicationStatus] = mapped_column(Enum(ApplicationStatus), default=ApplicationStatus.no_response)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    applied_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    responded_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    interview_date: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    profile: Mapped["Profile"] = relationship(back_populates="applications")
    resume: Mapped["Resume"] = relationship(back_populates="applications")

