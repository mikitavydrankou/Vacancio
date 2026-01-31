import pytest
from services.job_parser.validator import normalize_technology, normalize_location, auto_fix_job_posting
from services.job_parser.models import JobPosting
from decimal import Decimal

def test_normalize_technology_exact_match():
    assert normalize_technology("Python") == "Python"
    assert normalize_technology("  React  ") == "React"

def test_normalize_technology_case_insensitive():
    assert normalize_technology("python") == "Python"
    assert normalize_technology("NodE.JS") == "Node.js"
    assert normalize_technology("DoCker") == "Docker"

def test_normalize_technology_unknown():
    assert normalize_technology("SomeUnknownTech") == "SomeUnknownTech"
    assert normalize_technology("A") is None

def test_normalize_location_exact_match():
    assert normalize_location("Warsaw") == "Warsaw"
    assert normalize_location("Krakow") == "Krakow"

def test_normalize_location_mapping():
    assert normalize_location("Warszawa") == "Warsaw"
    assert normalize_location("KRAKÓW") == "Krakow"
    assert normalize_location("Poznań") == "Poznan"

def test_normalize_location_zipcode_removal():
    assert normalize_location("Warsaw 00-001") == "Warsaw"
    assert normalize_location("00-001 Warsaw") == "Warsaw"

def test_normalize_location_unknown():
    assert normalize_location("London") == "London"
    assert normalize_location(None) is None

def test_auto_fix_job_posting():
    job = JobPosting(
        job_title="Dev",
        company="Comp",
        project_description="Desc",
        stack=[" python ", "JAVA", "UnknownLib"],
        nice_to_have_stack=[" Docker "],
        responsibilities=["  Code  ", ""],
        requirements=["  Sleep  "],
        work_mode="remote",
        employment_type="b2b",
        salary=None,
        location="Warszawa"
    )

    fixed_job = auto_fix_job_posting(job)
    
    assert "Python" in fixed_job.stack
    assert "Java" in fixed_job.stack
    assert "UnknownLib" in fixed_job.stack
    
    assert "Docker" in fixed_job.nice_to_have_stack
    
    assert len(fixed_job.responsibilities) == 1
    assert fixed_job.responsibilities[0] == "Code"
