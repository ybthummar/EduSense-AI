from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.connection import get_db

router = APIRouter()

@router.get("/dashboard")
def get_student_dashboard(db: Session = Depends(get_db)):
    # Placeholder for student dashboard aggregation logic
    return {
        "sgpa_trend": [{"semester": "Sem 1", "sgpa": 7.2}, {"semester": "Sem 2", "sgpa": 7.5}],
        "subject_performance": [{"subject": "DSA", "marks": 85, "total": 100}],
        "attendance": [{"month": "Jan", "percentage": 90}]
    }

@router.get("/recommendations")
def get_study_recommendations(db: Session = Depends(get_db)):
    # Interface with ML models to generate custom recs
    return [
         {"title": "Strengthen Computer Networks", "priority": "high", "topic": "OSI Model"}
    ]
