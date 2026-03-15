import os
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.firebase import init_firestore
from api import admin, auth, attendance, calls, chat_routes, chatbot, datasets, faculty, faculty_analytics, pipeline, quizzes, students

# Initialize Firestore (gracefully continue if not configured)
try:
    init_firestore()
except Exception as _db_err:
    print(f"[startup] Firestore initialization skipped: {_db_err}")

app = FastAPI(
    title="EduSense AI Platform API",
    description="Backend services for AI Academic Intelligence",
    version="1.0.0"
)

# CORS setup
# Default is local Vite dev origins; override via ALLOWED_ORIGINS (comma-separated).
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
allow_credentials = "*" not in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(faculty.router, prefix="/api/faculty", tags=["Faculty"])
app.include_router(faculty_analytics.router, prefix="/api/faculty", tags=["Faculty Analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["AI Chatbot"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["Pipeline"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(calls.router, prefix="/api/calls", tags=["Call Messages"])
app.include_router(chat_routes.router, prefix="/api/ai/chat", tags=["AI Chat Assistant"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "EduSense AI Platform API is running"}
