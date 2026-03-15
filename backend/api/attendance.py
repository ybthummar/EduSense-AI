"""
Attendance API
──────────────
Endpoints for live attendance marking and retrieval.

POST /api/attendance/mark      — Faculty marks attendance → PostgreSQL → Gold
GET  /api/attendance/today     — Today's attendance (optional student_id filter)
GET  /api/attendance/student   — A student's attendance for today
GET  /api/attendance/history   — Attendance history (date range, student, subject)
GET  /api/attendance/summary   — Aggregated attendance stats (department, subject)
POST /api/attendance/login     — Faculty login (default: FACCE001 / faculty123)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from services.attendance_service import (
    DEFAULT_FACULTY,
    save_attendance,
    get_attendance_by_date,
    get_student_today_attendance,
    get_attendance_history,
    get_attendance_summary,
)

router = APIRouter()


class AttendanceRecord(BaseModel):
    student_id: str
    status: str  # "present" or "absent"


class MarkAttendanceRequest(BaseModel):
    faculty_id: str = DEFAULT_FACULTY["faculty_id"]
    subject_id: Optional[str] = None
    date: Optional[str] = None
    records: List[AttendanceRecord]


class FacultyLoginRequest(BaseModel):
    faculty_id: str
    password: str


@router.post("/login")
def faculty_attendance_login(req: FacultyLoginRequest):
    """Authenticate faculty for attendance (demo: FACCE001 / faculty123)."""
    if (
        req.faculty_id.strip().upper() == DEFAULT_FACULTY["faculty_id"]
        and req.password == DEFAULT_FACULTY["password"]
    ):
        return {
            "success": True,
            "faculty_id": DEFAULT_FACULTY["faculty_id"],
            "faculty_name": DEFAULT_FACULTY["faculty_name"],
            "department": DEFAULT_FACULTY["department"],
        }
    raise HTTPException(status_code=401, detail="Invalid faculty credentials")


@router.post("/mark")
def mark_attendance(req: MarkAttendanceRequest):
    """
    Mark attendance for a list of students.
    Saves to PostgreSQL, then updates gold layer for dashboard.
    """
    if not req.records:
        raise HTTPException(status_code=400, detail="No attendance records provided")

    result = save_attendance(
        faculty_id=req.faculty_id,
        subject_id=req.subject_id,
        records=[r.dict() for r in req.records],
        attendance_date=req.date,
    )
    return result


@router.get("/today")
def get_today_attendance(student_id: Optional[str] = None, date: Optional[str] = None):
    """Get all attendance records for today (or specified date)."""
    records = get_attendance_by_date(attendance_date=date, student_id=student_id)
    return {"date": date, "records": records, "count": len(records)}


@router.get("/student/{student_id}")
def get_student_attendance(student_id: str):
    """Get today's attendance summary for a specific student."""
    return get_student_today_attendance(student_id)


@router.get("/history")
def attendance_history(
    student_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Get attendance history from daily records with optional filters."""
    records = get_attendance_history(
        student_id=student_id,
        subject_id=subject_id,
        start_date=start_date,
        end_date=end_date,
    )
    return {"records": records, "count": len(records)}


@router.get("/summary")
def attendance_summary(
    department: Optional[str] = None,
    subject_id: Optional[str] = None,
):
    """Get aggregated attendance summary with per-student breakdowns."""
    return get_attendance_summary(department=department, subject_id=subject_id)
