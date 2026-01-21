"""
Job scraping and parsing module - Refactored

Module structure:
- models.py: Pydantic data models
- validator.py: Validation and auto-fixing
- core/: Core scraping logic (orchestrator, browser, http)
- ai/: AI parsing (parser, prompts)
- scrapers/: Site-specific scrapers (indeed, pracuj_pl)
"""

from .models import Salary, JobPosting, WorkMode, EmploymentType
from .validator import validate_job_posting, auto_fix_job_posting
from .ai import parse_with_ai

__all__ = [
    "Salary",
    "JobPosting",
    "WorkMode",
    "EmploymentType",
    "validate_job_posting",
    "auto_fix_job_posting",
    "parse_with_ai",
]