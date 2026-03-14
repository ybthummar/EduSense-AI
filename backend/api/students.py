from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.connection import get_db
from services.dataset_service import get_student_dashboard, get_student_recommendations
from typing import Optional

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
