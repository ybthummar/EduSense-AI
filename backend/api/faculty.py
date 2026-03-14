from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.connection import get_db
import database.models as models
from services.dataset_service import get_faculty_analytics, get_faculty_students
from typing import Optional

router = APIRouter()

class StudentCreate(BaseModel):
    student_id: str
    name: str
    email: str
    department: str
    faculty_id: str
    semester: int

@router.post("/add_student")
def add_student(student: StudentCreate, db: Session = Depends(get_db)):
    # Placeholder for checking faculty scope & adding student
    return {"message": f"Student {student.name} added successfully."}

@router.get("/{faculty_id}/students")
def get_faculty_students_route(
    faculty_id: str,
    department: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    del faculty_id, db
    return get_faculty_students(department=department, limit=limit)

@router.get("/{faculty_id}/analytics")
def get_faculty_analytics_route(
    faculty_id: str,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
):
    del faculty_id, db
    return get_faculty_analytics(department=department)
