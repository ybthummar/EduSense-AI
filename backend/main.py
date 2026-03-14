from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import models
from database.connection import engine
from api import admin, auth, chatbot, datasets, faculty, students

# Create database tables (gracefully skip if DB unavailable)
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as _db_err:
    print(f"[startup] DB table creation skipped: {_db_err}")

app = FastAPI(
    title="EduSense AI Platform API",
    description="Backend services for AI Academic Intelligence",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(faculty.router, prefix="/api/faculty", tags=["Faculty"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["AI Chatbot"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "EduSense AI Platform API is running"}
