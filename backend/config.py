"""Centralised configuration loaded from environment variables."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load from backend/.env
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path, override=True)

# --- AI Models ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
# Try GOOGLE_API_KEY first, then GEMINI_API_KEY (handle empty strings)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""

# --- YouTube ---
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# --- Database backend ---
# Firebase is the primary backend for app data.
DATABASE_BACKEND = os.getenv("DATABASE_BACKEND", "firebase").lower()
# Optional legacy SQL URL (kept for backward compatibility paths).
DATABASE_URL = os.getenv("DATABASE_URL", "")

# --- JWT ---
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkeyedusense")
JWT_ALGORITHM = "HS256"

# --- Firebase Admin ---
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY", "")
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL", "")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
