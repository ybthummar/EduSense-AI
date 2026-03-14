"""Centralised configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

# --- AI Models ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", os.getenv("GEMINI_API_KEY", ""))

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
