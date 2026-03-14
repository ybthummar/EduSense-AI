from fastapi import APIRouter
from pydantic import BaseModel
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
def add_student(student: StudentCreate):
    # Placeholder for checking faculty scope & adding student
    return {"message": f"Student {student.name} added successfully."}

@router.get("/{faculty_id}/students")
def get_faculty_students_route(
    faculty_id: str,
    department: Optional[str] = None,
    limit: int = 100,
):
    del faculty_id
    return get_faculty_students(department=department, limit=limit)

@router.get("/{faculty_id}/analytics")
def get_faculty_analytics_route(
    faculty_id: str,
    department: Optional[str] = None,
):
    del faculty_id
    return get_faculty_analytics(department=department)
