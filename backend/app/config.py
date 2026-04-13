import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'crm.db'}")
SESSION_SECRET_KEY = os.environ.get(
    "SESSION_SECRET_KEY", "dev-session-secret-change-in-production"
)
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
