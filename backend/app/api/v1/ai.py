from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.services.embedding_service import embed_text, cosine_similarity
from app.services.rag_service import answer_question, summarize_document, compare_documents

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/ask")
def ask(
    question: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query_embedding = embed_text(question)

    chunks = (
        db.query(DocumentChunk)
        .join(Document)
        .filter(Document.owner_id == current_user.id)
        .all()
    )

    if not chunks:
        return {"answer": "You haven't uploaded any documents yet.", "sources": []}

    scored = [
        (cosine_similarity(query_embedding, chunk.embedding), chunk)
        for chunk in chunks
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [chunk for _, chunk in scored[:5]]

    answer = answer_question(question, [c.content for c in top_chunks])

    return {
        "answer": answer,
        "sources": list({str(c.document_id) for c in top_chunks}),
    }


@router.post("/summarize/{document_id}")
def summarize(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(
        Document.id == document_id, Document.owner_id == current_user.id
    ).first()
    if not doc or not doc.extracted_text:
        return {"error": "Document not found or has no extracted text."}

    summary = summarize_document(doc.extracted_text)
    return {"document_id": document_id, "summary": summary}


@router.post("/compare")
def compare(
    document_id_a: str,
    document_id_b: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc_a = db.query(Document).filter(
        Document.id == document_id_a, Document.owner_id == current_user.id
    ).first()
    doc_b = db.query(Document).filter(
        Document.id == document_id_b, Document.owner_id == current_user.id
    ).first()
    if not doc_a or not doc_b:
        return {"error": "One or both documents not found."}

    comparison = compare_documents(doc_a.extracted_text or "", doc_b.extracted_text or "")
    return {"comparison": comparison}
