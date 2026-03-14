"""Centralised configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

# --- OpenAI ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# --- YouTube ---
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# --- Database ---
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "edusense")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
)

# --- JWT ---
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkeyedusense")
JWT_ALGORITHM = "HS256"

# --- Firebase Admin ---
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY", "")
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL", "")
