from fastapi import APIRouter, HTTPException, Query
from database.firebase import get_firestore
from services.dataset_service import get_student_dashboard, get_student_recommendations, get_student_academic_history
from services.student_context import get_student_context
from services.youtube_service import search_youtube_videos
from services.stress_evaluation_service import StressEvaluationService
from typing import Optional
import numpy as np

# Singleton stress service (loaded once, reused across requests)
_stress_svc: Optional[StressEvaluationService] = None


def _get_stress_service() -> StressEvaluationService:
    global _stress_svc
    if _stress_svc is None:
        _stress_svc = StressEvaluationService()
        _stress_svc.load_datasets()
        _stress_svc.preprocess()
        _stress_svc.merge_student_data()
        _stress_svc.run_full_analysis()
    return _stress_svc

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

@router.get("/subject-videos")
def get_subject_videos(
    subject: str = Query(..., description="Subject code or name to fetch YouTube videos for")
):
    return search_youtube_videos(subject)


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


@router.get("/stress-analysis")
def get_all_students_stress():
    """Return stress evaluation for every student in the enriched dataset."""
    svc = _get_stress_service()
    if svc.results is None or svc.results.empty:
        raise HTTPException(status_code=404, detail="No stress data available")
    # Replace NaN/Inf with None for JSON safety
    clean = svc.results.replace([np.inf, -np.inf], np.nan).where(svc.results.notna(), None)
    records = clean.to_dict(orient="records")
    return [{k: _to_native(v) for k, v in r.items()} for r in records]


@router.get("/stress-analysis/{student_id}")
def get_student_stress(student_id: str):
    """Return stress evaluation for a single student."""
    svc = _get_stress_service()
    result = svc.get_student_result(student_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found in stress dataset")
    # Convert numpy types to native Python for JSON serialisation
    return {k: _to_native(v) for k, v in result.items()}


def _to_native(val):
    """Coerce numpy/pandas types to JSON-friendly Python types."""
    import numpy as np
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return float(val)
    if isinstance(val, (np.bool_,)):
        return bool(val)
    if isinstance(val, (np.ndarray,)):
        return val.tolist()
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    return val
