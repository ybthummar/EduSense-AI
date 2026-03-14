from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.connection import get_db
from services.dataset_service import get_student_dashboard, get_student_recommendations
from services.student_context import get_student_context
from typing import Optional
import database.models as models

router = APIRouter()

@router.get("/dashboard")
def get_student_dashboard_route(
    student_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    del db
    try:
        return get_student_dashboard(student_id=student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.get("/recommendations")
def get_study_recommendations(
    student_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    del db
    try:
        return get_student_recommendations(student_id=student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.get("/progress")
def get_student_progress(
    student_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
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
        attempts = (
            db.query(models.QuizAttempt)
            .filter(models.QuizAttempt.student_id == student_id)
            .all()
        )
        quiz_scores = [
            {
                "quiz_id": a.quiz_id,
                "score": a.score,
                "total_questions": a.total_questions,
                "correct_answers": a.correct_answers,
                "submitted_at": a.submitted_at,
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
