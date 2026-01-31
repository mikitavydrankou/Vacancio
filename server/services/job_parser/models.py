"""Pydantic models for job posting data"""
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from enum import Enum


class WorkMode(str, Enum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"


class EmploymentType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    B2B = "b2b"
    INTERNSHIP = "internship"


class Currency(str, Enum):
    PLN = "PLN"
    USD = "USD"
    EUR = "EUR"


class SalaryUnit(str, Enum):
    MONTH = "month"
    YEAR = "year"
    HOUR = "hour"


class GrossNet(str, Enum):
    GROSS = "gross"
    NET = "net"
    UNKNOWN = "unknown"


class Seniority(str, Enum):
    TRAINEE = "trainee"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"


class Salary(BaseModel):
    min: Optional[int] = None
    max: Optional[int] = None
    currency: Optional[Currency] = None
    unit: Optional[SalaryUnit] = None
    gross_net: Optional[GrossNet] = GrossNet.UNKNOWN
    
    @field_validator('min', 'max')
    @classmethod
    def validate_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("Salary must be positive")
        return v
    
    @model_validator(mode='after')
    def validate_max_greater_than_min(self):
        min_val = self.min
        max_val = self.max
        if max_val is not None and min_val is not None and max_val < min_val:
            raise ValueError("Max salary must be >= min salary")
        return self


class JobPosting(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[WorkMode] = None
    employment_type: Optional[EmploymentType] = None
    seniority: Optional[Seniority] = None
    salary: Optional[Salary] = None
    stack: List[str] = Field(default_factory=list)
    nice_to_have_stack: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    project_description: Optional[str] = None
    raw_data: Optional[str] = None
    source: Optional[str] = Field(default=None, description="Auto-filled from URL")
    
    @field_validator('stack', 'nice_to_have_stack', mode='before')
    @classmethod
    def remove_empty_strings(cls, v):
        if not v:
            return []
        return [item.strip() for item in v if item and item.strip()]
