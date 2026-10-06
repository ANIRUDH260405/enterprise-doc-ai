import uuid
import io


def register_and_get_token(test_client):
    email = f"doctest_{uuid.uuid4().hex[:8]}@example.com"
    test_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "testpass123", "full_name": "Doc Tester"},
    )
    login = test_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    return login.json()["access_token"]


def test_upload_document(test_client):
    token = register_and_get_token(test_client)
    headers = {"Authorization": f"Bearer {token}"}

    fake_file = io.BytesIO(b"This is a test document about inspection procedures.")
    response = test_client.post(
        "/api/v1/documents/upload",
        headers=headers,
        files={"file": ("test.txt", fake_file, "text/plain")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["status"] in ("processed", "failed")


def test_upload_requires_auth(test_client):
    fake_file = io.BytesIO(b"content")
    response = test_client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.txt", fake_file, "text/plain")},
    )
    assert response.status_code in (401, 403)


def test_list_documents_only_shows_own(test_client):
    token = register_and_get_token(test_client)
    headers = {"Authorization": f"Bearer {token}"}

    response = test_client.get("/api/v1/documents/", headers=headers)
    assert response.status_code == 200
    assert response.json() == []
