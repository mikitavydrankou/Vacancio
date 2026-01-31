from fastapi.testclient import TestClient

def test_create_profile(client: TestClient):
    response = client.post("/profiles/", json={"name": "Test User"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test User"
    assert "id" in data
    assert "created_at" in data

def test_read_profiles(client: TestClient):
    client.post("/profiles/", json={"name": "User 1"})
    client.post("/profiles/", json={"name": "User 2"})

    response = client.get("/profiles/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    names = [p["name"] for p in data]
    assert "User 1" in names
    assert "User 2" in names

def test_create_duplicate_profile(client: TestClient):
    client.post("/profiles/", json={"name": "Unique User"})
    response = client.post("/profiles/", json={"name": "Unique User"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Profile already exists"

def test_delete_profile(client: TestClient):
    res = client.post("/profiles/", json={"name": "To Delete"})
    profile_id = res.json()["id"]

    del_res = client.delete(f"/profiles/{profile_id}")
    assert del_res.status_code == 200

    get_res = client.get("/profiles/")
    names = [p["name"] for p in get_res.json()]
    assert "To Delete" not in names

def test_delete_nonexistent_profile(client: TestClient):
    response = client.delete("/profiles/nonexistent_id_123")
    assert response.status_code == 404
