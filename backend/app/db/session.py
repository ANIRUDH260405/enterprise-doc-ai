from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.base import Base
from app.models import document, incident, user  # noqa: F401


def _resolve_database_url() -> str:
    database_url = settings.database_url
    if database_url and database_url.startswith(("postgresql://", "postgres://")):
        try:
            engine = create_engine(database_url)
            with engine.connect() as connection:
                connection.execute("SELECT 1")
            return database_url
        except Exception:
            return "sqlite:///./app.db"
    return database_url


database_url = _resolve_database_url()
engine_kwargs = {}
connect_args = {}
if database_url.startswith("sqlite"):
    engine_kwargs["poolclass"] = StaticPool
    connect_args["check_same_thread"] = False

engine = create_engine(database_url, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)