from fastapi import APIRouter, HTTPException, Query
from database.firebase import get_firestore
from services.dataset_service import get_student_dashboard, get_student_recommendations, get_student_academic_history
from services.student_context import get_student_context
from typing import Optional

router = APIRouter()

@router.get("/dashboard")
def get_student_dashboard_route(
    student_id: Optional[str] = Query(default=None),
):
    try:
        return get_student_dashboard(student_id=student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.get("/academic-history")
def get_student_academic_history_route(
    student_id: str = Query(..., description="Student ID to fetch academic history for"),
):
    """Complete semester-wise academic history: all subjects, marks, CGPA, attendance, and more."""
    try:
        return get_student_academic_history(student_id=student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.get("/recommendations")
def get_study_recommendations(
    student_id: Optional[str] = Query(default=None),
):
    try:
        return get_student_recommendations(student_id=student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.get("/progress")
def get_student_progress(
    student_id: Optional[str] = Query(default=None),
):
    """
    Comprehensive progress report: SGPA trend, subject performance,
    attendance, quiz scores, and academic context.
    """
    try:
        dashboard = get_student_dashboard(student_id=student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    context = get_student_context(student_id=student_id)

    # Fetch quiz attempts from DB
    quiz_scores = []
    if student_id:
        db = get_firestore()
        attempts = [
            doc.to_dict()
            for doc in db.collection("quiz_attempts").where("student_id", "==", student_id).stream()
        ]
        quiz_scores = [
            {
                "quiz_id": a.get("quiz_id"),
                "score": a.get("score"),
                "total_questions": a.get("total_questions"),
                "correct_answers": a.get("correct_answers"),
                "submitted_at": a.get("submitted_at"),
            }
            for a in attempts
        ]

    return {
        "student_id": dashboard.get("student_id"),
        "department": dashboard.get("department"),
        "sgpa_trend": dashboard.get("sgpa_trend", []),
        "subject_performance": dashboard.get("subject_performance", []),
        "attendance": dashboard.get("attendance", []),
        "latest_metrics": dashboard.get("latest_metrics", {}),
        "quiz_scores": quiz_scores,
        "academic_context": context,
    }
