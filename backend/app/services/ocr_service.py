from pathlib import Path
import pytesseract
from PIL import Image
from pypdf import PdfReader
from docx import Document as DocxDocument

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def extract_text(file_path: str, content_type: str) -> str:
    path = Path(file_path)

    if content_type == "application/pdf":
        reader = PdfReader(str(path))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text

    if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        doc = DocxDocument(str(path))
        return "\n".join(p.text for p in doc.paragraphs)

    if content_type == "text/plain":
        return path.read_text(encoding="utf-8", errors="ignore")

    if content_type in ("image/png", "image/jpeg"):
        return pytesseract.image_to_string(Image.open(path))

    return ""


def clean_text(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap
    return chunks