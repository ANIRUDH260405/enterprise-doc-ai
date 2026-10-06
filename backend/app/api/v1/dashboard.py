from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.document import Document, DocumentChunk

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_documents = db.query(func.count(Document.id)).filter(
        Document.owner_id == current_user.id
    ).scalar()

    processed_documents = db.query(func.count(Document.id)).filter(
        Document.owner_id == current_user.id,
        Document.status == "processed",
    ).scalar()

    failed_documents = db.query(func.count(Document.id)).filter(
        Document.owner_id == current_user.id,
        Document.status == "failed",
    ).scalar()

    total_chunks = db.query(func.count(DocumentChunk.id)).join(Document).filter(
        Document.owner_id == current_user.id
    ).scalar()

    recent_documents = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_documents": total_documents,
        "processed_documents": processed_documents,
        "failed_documents": failed_documents,
        "total_chunks": total_chunks,
        "recent_documents": [
            {"id": str(d.id), "filename": d.filename, "status": d.status}
            for d in recent_documents
        ],
    }
