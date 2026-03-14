import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.firebase import init_firestore
from api import admin, auth, chatbot, datasets, faculty, quizzes, students

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
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["AI Chatbot"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "EduSense AI Platform API is running"}
