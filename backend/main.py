from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from connection import engine
from api import auth, students, faculty, admin, chatbot

# Create database tables
models.Base.metadata.create_all(bind=engine)

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

@app.get("/")
def health_check():
    return {"status": "ok", "message": "EduSense AI Platform API is running"}
