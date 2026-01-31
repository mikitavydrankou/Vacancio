from fastapi.testclient import TestClient
import pytest
from database import models
from routers import applications

@pytest.fixture
def test_profile(db_session):
    profile = models.Profile(name="Test User App")
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile

@pytest.fixture
def test_resume(db_session, test_profile):
    resume = models.Resume(
        name="Resume.pdf", 
        version=1, 
        file_path="/tmp/Resume.pdf", 
        profile_id=test_profile.id
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)
    return resume

def test_create_application_success(client: TestClient, db_session, test_profile, test_resume, mocker):
    # Mock the background task
    mock_bg = mocker.patch("routers.applications.process_application_background")

    payload = {
        "profile_id": test_profile.id,
        "resume_id": test_resume.id,
        "resume_version": test_resume.version,
        "url": "https://example.com/job",
        "company": "Test Company",
        "position": "Test Position",
        "raw_data": "Some job description", 
        "description": "Short desc"
    }

    response = client.post("/applications/", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    
    assert data["company"] == "Test Company"
    assert data["position"] == "Test Position"
    assert data["status"] == "parsing"

    mock_bg.assert_called_once()
    args, _ = mock_bg.call_args
    assert args[0] == data["id"]

def test_read_applications(client: TestClient, db_session, test_profile, test_resume):
    app1 = models.JobApplication(
        profile_id=test_profile.id,
        resume_id=test_resume.id,
        resume_version=test_resume.version,
        company="Comp 1",
        position="Pos 1",
        status=models.ApplicationStatus.parsing,
        tech_stack=[],
        nice_to_have_stack=[],
        responsibilities=[],
        requirements=[]
    )
    app2 = models.JobApplication(
        profile_id=test_profile.id,
        resume_id=test_resume.id,
        resume_version=test_resume.version,
        company="Comp 2",
        position="Pos 2",
        status=models.ApplicationStatus.no_response,
        tech_stack=[],
        nice_to_have_stack=[],
        responsibilities=[],
        requirements=[]
    )
    db_session.add(app1)
    db_session.add(app2)
    db_session.commit()
    
    response = client.get("/applications/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    companies = [d["company"] for d in data]
    assert "Comp 1" in companies
    assert "Comp 2" in companies

def test_read_application_by_id(client: TestClient, db_session, test_profile, test_resume):
    app1 = models.JobApplication(
        profile_id=test_profile.id,
        resume_id=test_resume.id,
        resume_version=test_resume.version,
        company="Comp 1",
        position="Pos 1",
        status=models.ApplicationStatus.no_response,
        tech_stack=[],
        nice_to_have_stack=[],
        responsibilities=[],
        requirements=[]
    )
    db_session.add(app1)
    db_session.commit()
    db_session.refresh(app1)

    response = client.get(f"/applications/{app1.id}")
    assert response.status_code == 200
    assert response.json()["company"] == "Comp 1"

def test_update_application_status(client: TestClient, db_session, test_profile, test_resume):
    app1 = models.JobApplication(
        profile_id=test_profile.id,
        resume_id=test_resume.id,
        resume_version=test_resume.version,
        company="Comp To Update",
        position="Pos 1",
        status=models.ApplicationStatus.no_response,
        tech_stack=[],
        nice_to_have_stack=[],
        responsibilities=[],
        requirements=[]
    )
    db_session.add(app1)
    db_session.commit()
    db_session.refresh(app1)

    payload = {"status": "interview"}
    
    response = client.put(f"/applications/{app1.id}", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "interview"

    db_session.refresh(app1)
    assert app1.status == models.ApplicationStatus.interview
