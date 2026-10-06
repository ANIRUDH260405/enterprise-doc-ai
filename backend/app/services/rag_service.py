from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.groq_api_key)
MODEL = "openai/gpt-oss-120b"


def answer_question(question: str, relevant_chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(relevant_chunks)

    prompt = f"""Answer the question using ONLY the information in the context below.
If the answer isn't in the context, say you don't have that information.

Context:
{context}

Question: {question}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def summarize_document(full_text: str) -> str:
    prompt = f"""Summarize the following document in a clear, concise way. 
Cover the main points, purpose, and any key conclusions.

Document:
{full_text[:8000]}

Summary:"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def compare_documents(text_a: str, text_b: str) -> str:
    prompt = f"""Compare the following two documents. Highlight key similarities and differences.

Document A:
{text_a[:4000]}

Document B:
{text_b[:4000]}

Comparison:"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content
