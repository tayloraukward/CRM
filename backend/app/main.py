from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import CORS_ORIGINS, SESSION_SECRET_KEY
from app.db import engine
from app.models import Base
from app.routers import auth, contacts, deals, organizations

app = FastAPI(title="CRM API", version="0.1.0")

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET_KEY,
    session_cookie="crm_session",
    same_site="lax",
    https_only=False,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(contacts.router)
app.include_router(deals.router)


@app.get("/")
def root() -> dict[str, str]:
    """Landing when you open the API host in a browser (no HTML UI here)."""
    return {
        "service": "CRM API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
