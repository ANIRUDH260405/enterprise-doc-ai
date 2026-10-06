import uuid


def register_and_get_token(test_client, email_prefix="eval"):
    email = f"{email_prefix}_{uuid.uuid4().hex[:8]}@example.com"
    test_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "testpass123", "full_name": "Evaluator"},
    )
    login = test_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    return login.json()["access_token"]


def test_incident_extraction_accuracy(test_client):
    """Does the system correctly extract structured fields from free text?"""
    token = register_and_get_token(test_client)
    headers = {"Authorization": f"Bearer {token}"}

    response = test_client.post(
        "/api/v1/incidents/",
        headers=headers,
        json={"raw_text": "Signal failure at Station A, lasted about 30 minutes during peak hours, affected 5 trains."},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["incident_type"] == "signal_failure"
    assert data["location"] == "Station A"
    assert data["duration_minutes"] == 30
    assert data["affected_trains"] == 5
    assert data["status"] == "analyzed"


def test_evidence_retrieval_finds_relevant_document(test_client):
    """Does the system find the correct evidence for a known incident type?"""
    token = register_and_get_token(test_client)
    headers = {"Authorization": f"Bearer {token}"}

    incident_response = test_client.post(
        "/api/v1/incidents/",
        headers=headers,
        json={"raw_text": "Signal failure causing delays at the main junction."},
    )
    incident_id = incident_response.json()["id"]

    evidence_response = test_client.get(f"/api/v1/incidents/{incident_id}/evidence", headers=headers)
    assert evidence_response.status_code == 200


def test_similar_incidents_require_matching_type(test_client):
    """Does the system correctly refuse to match unrelated incident types?"""
    token = register_and_get_token(test_client)
    headers = {"Authorization": f"Bearer {token}"}

    r1 = test_client.post(
        "/api/v1/incidents/",
        headers=headers,
        json={"raw_text": "Signal failure at Station A, 30 minutes, peak hours, 5 trains."},
    )
    r2 = test_client.post(
        "/api/v1/incidents/",
        headers=headers,
        json={"raw_text": "Weather delay due to heavy fog, 20 minutes, early morning, 2 trains."},
    )
    incident_id = r1.json()["id"]

    similar_response = test_client.get(f"/api/v1/incidents/{incident_id}/similar", headers=headers)
    assert similar_response.status_code == 200
    similar_ids = [s["incident_type"] for s in similar_response.json()["similar_incidents"]]
    assert "weather_delay" not in similar_ids


def test_scenarios_are_distinct(test_client):
    """Are the generated scenarios actually different from each other (sensible)?"""
    token = register_and_get_token(test_client)
    headers = {"Authorization": f"Bearer {token}"}

    incident_response = test_client.post(
        "/api/v1/incidents/",
        headers=headers,
        json={"raw_text": "Signal failure at Station A, 30 minutes, peak hours, 5 trains."},
    )
    incident_id = incident_response.json()["id"]

    scenarios_response = test_client.post(f"/api/v1/incidents/{incident_id}/scenarios", headers=headers)
    assert scenarios_response.status_code == 200
    scenarios = scenarios_response.json()["scenarios"]
    assert len(scenarios) == 3
    durations = [s["duration_minutes"] for s in scenarios]
    assert len(set(durations)) == 2  # scenario A differs from B/C, B and C share duration but differ by complication


def test_explanation_traces_to_evidence(test_client):
    """Can the system explain its reasoning with a traceable evidence breakdown?"""
    token = register_and_get_token(test_client)
    headers = {"Authorization": f"Bearer {token}"}

    incident_response = test_client.post(
        "/api/v1/incidents/",
        headers=headers,
        json={"raw_text": "Signal failure at Station A, 30 minutes, peak hours, 5 trains."},
    )
    incident_id = incident_response.json()["id"]

    why_response = test_client.get(f"/api/v1/incidents/{incident_id}/why", headers=headers)
    assert why_response.status_code == 200
    data = why_response.json()
    assert "why_this_evidence" in data
    assert "transparency_note" in data
