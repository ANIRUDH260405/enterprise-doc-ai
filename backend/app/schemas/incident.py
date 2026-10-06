import uuid
from datetime import datetime
from pydantic import BaseModel


class IncidentCreate(BaseModel):
    raw_text: str


class IncidentOut(BaseModel):
    id: uuid.UUID
    raw_text: str
    incident_type: str | None
    location: str | None
    duration_minutes: int | None
    time_context: str | None
    affected_trains: int | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
