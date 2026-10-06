import uuid
from datetime import datetime
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: uuid.UUID
    filename: str
    content_type: str
    size_bytes: int
    status: str
    uploaded_at: datetime
    category: str | None = None

    class Config:
        from_attributes = True