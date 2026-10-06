import uuid
from pathlib import Path
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.document import Document

STORAGE_ROOT = Path(__file__).resolve().parent.parent.parent / "storage"

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
}


def save_uploaded_file(file: UploadFile, owner_id: uuid.UUID, db: Session) -> Document:
    if file.content_type not in ALLOWED_TYPES:
        raise ValueError(f"Unsupported file type: {file.content_type}")

    doc_id = uuid.uuid4()
    ext = Path(file.filename).suffix
    stored_name = f"{doc_id}{ext}"
    owner_folder = STORAGE_ROOT / str(owner_id)
    owner_folder.mkdir(parents=True, exist_ok=True)
    stored_path = owner_folder / stored_name

    contents = file.file.read()
    with open(stored_path, "wb") as f:
        f.write(contents)

    document = Document(
        id=doc_id,
        owner_id=owner_id,
        filename=file.filename,
        stored_path=str(stored_path),
        content_type=file.content_type,
        size_bytes=len(contents),
        status="uploaded",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document

from app.models.document import AuditLog

def log_action(db, user_id, action: str, details: str = ""):
    db.add(AuditLog(user_id=user_id, action=action, details=details))
    db.commit()