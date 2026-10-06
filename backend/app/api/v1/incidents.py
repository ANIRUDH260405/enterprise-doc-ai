import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.incident import Incident
from app.models.document import Document, DocumentChunk
from app.schemas.incident import IncidentCreate, IncidentOut
from app.services.incident_service import (
    extract_incident_fields, build_evidence_query, score_incident_similarity,
    generate_analysis, generate_scenarios, analyze_consequences, explain_reasoning,
)
from app.services.embedding_service import embed_text, cosine_similarity

router = APIRouter(prefix="/incidents", tags=["incidents"])


def _get_evidence_with_meta(incident, db, current_user, limit=5):
    query_text = build_evidence_query(incident)
    query_embedding = embed_text(query_text)
    chunks = db.query(DocumentChunk).join(Document).filter(Document.owner_id == current_user.id).all()
    if not chunks:
        return []
    scored = [(cosine_similarity(query_embedding, c.embedding), c) for c in chunks]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {"document_id": str(c.document_id), "content": c.content, "relevance": round(s, 4)}
        for s, c in scored[:limit] if s > 0.3
    ]


def _get_evidence_chunks(incident, db, current_user, limit=5):
    return [e["content"] for e in _get_evidence_with_meta(incident, db, current_user, limit)]


def _get_similar_incidents_list(incident, db, current_user, limit=5):
    candidates = db.query(Incident).filter(
        Incident.reported_by == current_user.id, Incident.id != incident.id, Incident.status == "analyzed",
    ).all()
    scored = [(score_incident_similarity(incident, c), c) for c in candidates]
    scored = [(s, c) for s, c in scored if s > 0]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {"incident_type": c.incident_type, "location": c.location, "duration_minutes": c.duration_minutes, "similarity_score": s}
        for s, c in scored[:limit]
    ]


@router.post("/", response_model=IncidentOut, status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = Incident(reported_by=current_user.id, raw_text=payload.raw_text, status="pending")
    db.add(incident)
    db.commit()
    db.refresh(incident)
    try:
        fields = extract_incident_fields(payload.raw_text)
        incident.incident_type = fields["incident_type"]
        incident.location = fields["location"]
        incident.duration_minutes = fields["duration_minutes"]
        incident.time_context = fields["time_context"]
        incident.affected_trains = fields["affected_trains"]
        incident.status = "analyzed"
    except Exception as e:
        print(f"INCIDENT EXTRACTION ERROR: {e}")
        incident.status = "failed"
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/", response_model=list[IncidentOut])
def list_incidents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Incident).filter(Incident.reported_by == current_user.id).order_by(Incident.created_at.desc()).all()


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id, Incident.reported_by == current_user.id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.get("/{incident_id}/evidence")
def get_evidence(incident_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id, Incident.reported_by == current_user.id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"incident_id": str(incident_id), "evidence": _get_evidence_with_meta(incident, db, current_user)}


@router.get("/{incident_id}/similar")
def get_similar_incidents(incident_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id, Incident.reported_by == current_user.id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"incident_id": str(incident_id), "similar_incidents": _get_similar_incidents_list(incident, db, current_user)}


@router.post("/{incident_id}/analyze")
def analyze_incident(incident_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id, Incident.reported_by == current_user.id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    evidence_chunks = _get_evidence_chunks(incident, db, current_user)
    similar_incidents = _get_similar_incidents_list(incident, db, current_user)
    analysis = generate_analysis(incident, evidence_chunks, similar_incidents)
    return {"incident_id": str(incident_id), "analysis": analysis, "evidence_used": len(evidence_chunks), "similar_incidents_found": len(similar_incidents)}


@router.post("/{incident_id}/scenarios")
def get_scenarios(incident_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id, Incident.reported_by == current_user.id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    evidence_chunks = _get_evidence_chunks(incident, db, current_user)
    scenarios = generate_scenarios(incident, evidence_chunks)
    return {"incident_id": str(incident_id), "base_duration_minutes": incident.duration_minutes, "scenarios": scenarios}


@router.post("/{incident_id}/consequences")
def get_consequences(incident_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id, Incident.reported_by == current_user.id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    evidence_chunks = _get_evidence_chunks(incident, db, current_user)
    scenarios = generate_scenarios(incident, evidence_chunks)
    results = []
    for scenario in scenarios:
        consequences = analyze_consequences(incident, scenario["description"], evidence_chunks)
        results.append({"scenario_label": scenario["label"], "duration_minutes": scenario["duration_minutes"], "consequences": consequences})
    return {"incident_id": str(incident_id), "scenario_consequences": results}


@router.get("/{incident_id}/why")
def get_explanation(incident_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id, Incident.reported_by == current_user.id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    evidence = _get_evidence_with_meta(incident, db, current_user)
    similar = _get_similar_incidents_list(incident, db, current_user)
    explanation = explain_reasoning(incident, evidence, similar)
    
    explanation["incident_id"] = str(incident_id)
    return explanation


@router.get("/{incident_id}/dashboard")
def get_dashboard(incident_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id, Incident.reported_by == current_user.id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = _get_evidence_with_meta(incident, db, current_user)
    similar = _get_similar_incidents_list(incident, db, current_user)
    evidence_chunks = [e["content"] for e in evidence]

    analysis = generate_analysis(incident, evidence_chunks, similar)
    scenarios = generate_scenarios(incident, evidence_chunks)

    scenario_consequences = []
    for scenario in scenarios:
        consequences = analyze_consequences(incident, scenario["description"], evidence_chunks)
        scenario_consequences.append({
            "label": scenario["label"],
            "duration_minutes": scenario["duration_minutes"],
            "description": scenario["description"],
            "consequences": consequences,
        })

    explanation = explain_reasoning(incident, evidence, similar)
    explanation["incident_id"] = str(incident.id)

    return {
        "incident": {
            "id": str(incident.id),
            "type": incident.incident_type,
            "location": incident.location,
            "duration_minutes": incident.duration_minutes,
            "time_context": incident.time_context,
            "affected_trains": incident.affected_trains,
            "raw_text": incident.raw_text,
        },
        "relevant_evidence": evidence,
        "similar_incidents": similar,
        "analysis": analysis,
        "scenarios": scenario_consequences,
        "explanation": explanation,
    }
