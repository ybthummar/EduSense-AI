from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.dataset_service import get_students_master_data, get_students_performance_data, get_faculty_analytics, get_faculty_students, get_student_detail
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

@router.get("/{faculty_id}/students/{student_id}")
def get_student_detail_route(faculty_id: str, student_id: str):
    """Full profile for a single student — personal info + academic metrics."""
    del faculty_id
    try:
        return get_student_detail(student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.get("/{faculty_id}/analytics")
def get_faculty_analytics_route(
    faculty_id: str,
    department: Optional[str] = None,
):
    del faculty_id
    return get_faculty_analytics(department=department)


@router.get("/students-master")
def get_students_master_route(department: Optional[str] = None):
    return get_students_master_data(department=department)

@router.get("/students-performance")
def get_students_performance_route(department: Optional[str] = None):
    return get_students_performance_data(department=department)

@router.post("/attendance")
def save_attendance(data: dict):
    return {"message": "Attendance saved"}
