import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.models.user import User
from app.models.document import Document, DocumentChunk, AuditLog
from app.schemas.document import DocumentOut
from app.services.document_service import save_uploaded_file, log_action
from app.services.ocr_service import extract_text, clean_text, chunk_text
from app.services.embedding_service import embed_text, cosine_similarity

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentOut, status_code=201)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        document = save_uploaded_file(file, current_user.id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        raw_text = extract_text(document.stored_path, document.content_type)
        cleaned = clean_text(raw_text)
        document.extracted_text = cleaned
        document.status = "processed"

        chunks = chunk_text(cleaned)
        for chunk in chunks:
            embedding = embed_text(chunk)
            db.add(DocumentChunk(document_id=document.id, content=chunk, embedding=embedding))

    except Exception as e:
        print(f"PROCESSING ERROR: {e}")
        import traceback
        traceback.print_exc()
        document.status = "failed"

    db.commit()
    db.refresh(document)
    log_action(db, current_user.id, "upload_document", f"Uploaded {document.filename}")
    return document


@router.get("/search/keyword", response_model=list[DocumentOut])
def keyword_search(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Document).filter(
        Document.owner_id == current_user.id,
        Document.extracted_text.ilike(f"%{q}%"),
    ).all()


@router.get("/search/semantic")
def semantic_search(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query_embedding = embed_text(q)

    chunks = (
        db.query(DocumentChunk)
        .join(Document)
        .filter(Document.owner_id == current_user.id)
        .all()
    )

    scored = [
        (cosine_similarity(query_embedding, chunk.embedding), chunk)
        for chunk in chunks
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    top_results = scored[:5]

    return [
        {
            "content": chunk.content,
            "document_id": str(chunk.document_id),
            "similarity": round(score, 4),
        }
        for score, chunk in top_results
    ]


@router.get("/admin/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
    return [
        {"user_id": str(l.user_id), "action": l.action, "details": l.details, "created_at": l.created_at}
        for l in logs
    ]


@router.get("/", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Document).filter(Document.owner_id == current_user.id).all()


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{document_id}/download")
def download_document(document_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(doc.stored_path, filename=doc.filename)


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    Path(doc.stored_path).unlink(missing_ok=True)
    db.delete(doc)
    db.commit()
