from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.connection import get_db
import database.models as models
from api.auth import get_password_hash
from services.dataset_service import get_admin_dashboard_metrics
import uuid

router = APIRouter()

class FacultyCreate(BaseModel):
    name: str
    email: str
    department: str

@router.post("/create_faculty")
def create_faculty(data: FacultyCreate, db: Session = Depends(get_db)):
    # Admin only scope placeholder assumption
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email exists")
    
    generated_password = f"pwd_{str(uuid.uuid4())[:6]}"
    faculty_id = f"FAC_{str(uuid.uuid4())[:6]}"

    new_user = models.User(
        email=data.email,
        password=get_password_hash(generated_password),
        name=data.name,
        role="faculty"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_faculty = models.Faculty(
        faculty_id=faculty_id,
        department=data.department,
        user_id=new_user.id
    )
    db.add(new_faculty)
    db.commit()

    return {
        "message": "Faculty created",
        "email": data.email,
        "generated_password": generated_password,
        "faculty_id": faculty_id
    }

@router.get("/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db)):
    dataset_metrics = get_admin_dashboard_metrics()
    total_faculty = db.query(models.Faculty).count()

    return {
        "departments": dataset_metrics["departments"],
        "total_students": dataset_metrics["total_students"],
        "total_faculty": total_faculty,
    }
