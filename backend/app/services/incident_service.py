import json
import re
from groq import Groq

from app.core.config import settings
from app.models.incident import INCIDENT_TYPES

client = Groq(api_key=settings.groq_api_key)
MODEL = "openai/gpt-oss-120b"


def extract_incident_fields(raw_text: str) -> dict:
    categories_list = ", ".join(INCIDENT_TYPES)
    prompt = f"""Extract structured information from this railway incident report.

Report: "{raw_text}"

Return ONLY a JSON object with these exact fields, nothing else, no explanation:
{{
  "incident_type": one of [{categories_list}],
  "location": string or null,
  "duration_minutes": number or null,
  "time_context": string or null (e.g. "peak_hours", "off_peak", "night"),
  "affected_trains": number or null
}}

If a field cannot be determined from the text, use null. For incident_type, pick the closest match from the list, or "other" if none fit.

JSON:"""
    response = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    content = response.choices[0].message.content
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        return _fallback_fields()
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return _fallback_fields()
    incident_type = data.get("incident_type")
    if incident_type not in INCIDENT_TYPES:
        incident_type = "other"
    return {
        "incident_type": incident_type,
        "location": data.get("location"),
        "duration_minutes": _safe_int(data.get("duration_minutes")),
        "time_context": data.get("time_context"),
        "affected_trains": _safe_int(data.get("affected_trains")),
    }


def build_evidence_query(incident) -> str:
    parts = [incident.raw_text]
    if incident.incident_type:
        parts.append(f"Incident type: {incident.incident_type.replace('_', ' ')}")
    if incident.location:
        parts.append(f"Location: {incident.location}")
    return ". ".join(parts)


def score_incident_similarity(current, candidate) -> float:
    if not current.incident_type or current.incident_type != candidate.incident_type:
        return 0.0
    score = 0.5
    if current.location and candidate.location and current.location.lower() == candidate.location.lower():
        score += 0.2
    if current.time_context and current.time_context == candidate.time_context:
        score += 0.15
    if current.duration_minutes is not None and candidate.duration_minutes is not None:
        diff = abs(current.duration_minutes - candidate.duration_minutes)
        if diff <= 15:
            score += 0.15
        elif diff <= 45:
            score += 0.08
    return round(score, 2)


def generate_analysis(incident, evidence_chunks: list[str], similar_incidents: list[dict]) -> str:
    evidence_text = "\n\n".join(f"[Document excerpt {i+1}]: {c}" for i, c in enumerate(evidence_chunks)) or "No relevant documents found."
    similar_text = "\n".join(
        f"- {s['incident_type']} at {s['location']}, {s['duration_minutes']} min (similarity: {s['similarity_score']})"
        for s in similar_incidents
    ) or "No similar past incidents found."
    prompt = f"""You are a railway operations analyst. Analyze this incident using ONLY the evidence and historical data provided below. Cite which document or historical incident supports each claim you make.

CURRENT INCIDENT:
Type: {incident.incident_type}
Location: {incident.location}
Duration: {incident.duration_minutes} minutes
Time context: {incident.time_context}
Affected trains: {incident.affected_trains}
Description: {incident.raw_text}

RELEVANT DOCUMENTS:
{evidence_text}

SIMILAR PAST INCIDENTS:
{similar_text}

Provide a concise analysis (3-5 sentences) covering:
1. What procedure or rule applies, citing the specific document excerpt.
2. How this compares to similar past incidents, if any exist.
3. Any notable risk factors based on the evidence.

If the evidence doesn't support a claim, say so explicitly rather than guessing."""
    response = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return response.choices[0].message.content


def generate_scenarios(incident, evidence_chunks: list[str]) -> list[dict]:
    evidence_text = "\n\n".join(evidence_chunks) or "No relevant documents found."
    base_duration = incident.duration_minutes or 30
    variations = [
        {"label": "Scenario A (same duration)", "duration_minutes": base_duration, "extra_factor": None},
        {"label": "Scenario B (doubled duration)", "duration_minutes": base_duration * 2, "extra_factor": None},
        {"label": "Scenario C (doubled duration + complication)", "duration_minutes": base_duration * 2, "extra_factor": "an adjacent track also becomes unavailable"},
    ]
    scenarios = []
    for v in variations:
        extra = f" Additionally, {v['extra_factor']}." if v["extra_factor"] else ""
        prompt = f"""You are a railway operations analyst. Based ONLY on the reference material below, describe what would likely happen in this hypothetical scenario.

ORIGINAL INCIDENT: {incident.incident_type} at {incident.location}, time context: {incident.time_context}

HYPOTHETICAL SCENARIO: The same type of incident occurs, but lasts {v['duration_minutes']} minutes instead of {base_duration}.{extra}

REFERENCE MATERIAL:
{evidence_text}

In 2-3 sentences, describe the likely operational impact of this scenario, referencing the reference material where it applies. If the material doesn't cover this duration or situation, say so explicitly."""
        response = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
        scenarios.append({
            "label": v["label"],
            "duration_minutes": v["duration_minutes"],
            "extra_factor": v["extra_factor"],
            "description": response.choices[0].message.content,
        })
    return scenarios


def analyze_consequences(incident, scenario_description: str, evidence_chunks: list[str]) -> dict:
    evidence_text = "\n\n".join(evidence_chunks) or "No relevant documents found."
    prompt = f"""You are a railway operations analyst. Based ONLY on the reference material below, list the likely chain of consequences for this scenario, step by step.

SCENARIO: {scenario_description}

REFERENCE MATERIAL:
{evidence_text}

Return ONLY a JSON object with this exact structure, nothing else:
{{
  "consequence_chain": ["step 1 consequence", "step 2 consequence", "step 3 consequence"],
  "supported_by_evidence": true or false,
  "confidence_note": "one sentence explaining whether the reference material actually supports this chain or if it's a reasonable inference beyond the documented evidence"
}}

JSON:"""
    response = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    content = response.choices[0].message.content
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        return {"consequence_chain": [], "supported_by_evidence": False, "confidence_note": "Could not parse consequence analysis."}
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {"consequence_chain": [], "supported_by_evidence": False, "confidence_note": "Could not parse consequence analysis."}


def explain_reasoning(incident, evidence_chunks: list[dict], similar_incidents: list[dict]) -> dict:
    evidence_summary = "\n".join(
        f"- Document {e['document_id']} (relevance {e['relevance']}): \"{e['content'][:150]}...\""
        for e in evidence_chunks
    ) or "No documents were matched."

    similar_summary = "\n".join(
        f"- {s['incident_type']} incident, similarity score {s['similarity_score']}"
        for s in similar_incidents
    ) or "No similar incidents were found."

    return {
        "incident_id": None,
        "why_this_evidence": f"These documents were selected because their text content scored highest in semantic similarity to the incident description '{incident.raw_text[:100]}...'.",
        "evidence_breakdown": evidence_summary,
        "why_these_similar_incidents": "These past incidents were selected using rule-based matching on incident_type, location, time_context, and duration proximity.",
        "similar_incidents_breakdown": similar_summary,
        "transparency_note": "All AI-generated analysis, scenarios, and consequences above were explicitly instructed to use only the evidence and historical data shown here. Where the evidence did not cover a situation, the system was instructed to say so rather than invent an answer.",
    }


def _safe_int(value):
    try:
        return int(value) if value is not None else None
    except (ValueError, TypeError):
        return None


def _fallback_fields() -> dict:
    return {"incident_type": "other", "location": None, "duration_minutes": None, "time_context": None, "affected_trains": None}
