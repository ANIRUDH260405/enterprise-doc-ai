from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, documents, ai, dashboard, incidents

app = FastAPI(title="Enterprise Document AI")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(incidents.router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok"}
