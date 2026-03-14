from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.firebase import get_firestore
from api.auth import get_password_hash
from services.dataset_service import get_admin_dashboard_metrics
import uuid

router = APIRouter()

class FacultyCreate(BaseModel):
    name: str
    email: str
    department: str

@router.post("/create_faculty")
def create_faculty(data: FacultyCreate):
    # Admin only scope placeholder assumption
    db = get_firestore()
    existing = db.collection("users").where("email", "==", data.email).limit(1).stream()
    if next(existing, None):
        raise HTTPException(status_code=400, detail="User email exists")
    
    generated_password = f"pwd_{str(uuid.uuid4())[:6]}"
    faculty_id = f"FAC_{str(uuid.uuid4())[:6]}"

    user_id = str(uuid.uuid4())
    db.collection("users").document(user_id).set(
        {
            "email": data.email,
            "password": get_password_hash(generated_password),
            "name": data.name,
            "role": "faculty",
        }
    )

    db.collection("faculty").document(faculty_id).set(
        {
            "faculty_id": faculty_id,
            "department": data.department,
            "user_id": user_id,
        }
    )

    return {
        "message": "Faculty created",
        "email": data.email,
        "generated_password": generated_password,
        "faculty_id": faculty_id
    }

@router.get("/dashboard")
def get_admin_dashboard():
    db = get_firestore()
    dataset_metrics = get_admin_dashboard_metrics()
    total_faculty = sum(1 for _ in db.collection("faculty").stream())

    return {
        "departments": dataset_metrics["departments"],
        "total_students": dataset_metrics["total_students"],
        "total_faculty": total_faculty,
    }
