import uuid


def test_register_and_login(test_client):
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    register_response = test_client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": "testpass123",
            "full_name": "Test User",
        },
    )
    assert register_response.status_code == 201
    assert register_response.json()["email"] == unique_email

    login_response = test_client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "testpass123"},
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


def test_login_wrong_password(test_client):
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    test_client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "password": "correctpass", "full_name": "Test"},
    )

    response = test_client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "wrongpass"},
    )
    assert response.status_code == 401


def test_me_requires_auth(test_client):
    response = test_client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)
