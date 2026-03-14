from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.dataset_service import (
    get_faculty_analytics,
    get_faculty_students,
    get_student_detail,
    load_dataset,
    _normalize_student_id,
    _risk_level,
    _clean_value,
)
from typing import Optional, List, Dict, Any

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
def get_students_master(department: Optional[str] = None, limit: int = 100):
    """Get all students from master data CSV for faculty view."""
    return get_faculty_students(department=department, limit=limit)


@router.get("/students-performance")
def get_students_performance(
    department: Optional[str] = None,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """Get student performance data from enriched and master datasets."""
    import pandas as pd
    
    try:
        # Load enriched dataset which has performance metrics
        enriched_df = load_dataset("enriched").copy()
        enriched_df["Student_ID"] = enriched_df["Student_ID"].astype(str).str.upper().str.strip()
        
        # Also load master for additional personal info
        master_df = load_dataset("student_master").copy()
        master_df["Student_ID"] = master_df["Student_ID"].astype(str).str.upper().str.strip()
        
        # Filter by department if specified
        if department:
            dept = department.strip()
            enriched_df = enriched_df[enriched_df["Department"].str.strip() == dept]
            master_df = master_df[master_df["Department"].str.strip() == dept]
        
        # Limit results
        enriched_df = enriched_df.head(limit)
        
        # Merge with master data for complete info
        merged = enriched_df.merge(
            master_df[["Student_ID", "Phone_Number", "Email", "Department_Code"]],
            on="Student_ID",
            how="left",
            suffixes=("", "_master")
        )
        
        students = []
        for _, row in merged.iterrows():
            # Parse marks and subjects
            marks_str = str(row.get("Current_Subject_Marks", ""))
            codes_str = str(row.get("Current_Subject_Codes", ""))
            marks = [int(m.strip()) for m in marks_str.split("|") if m.strip()]
            codes = [c.strip() for c in codes_str.split("|") if c.strip()]
            avg_marks = sum(marks) / len(marks) if marks else 0

            subject_marks = []
            for i in range(min(len(codes), len(marks))):
                subject_marks.append({
                    "subject_code": codes[i],
                    "marks": marks[i],
                })
            # if there are extra marks or codes, include them gracefully
            if len(marks) > len(codes):
                for i in range(len(codes), len(marks)):
                    subject_marks.append({"subject_code": f"MISC-{i+1}", "marks": marks[i]})
            elif len(codes) > len(marks):
                for i in range(len(marks), len(codes)):
                    subject_marks.append({"subject_code": codes[i], "marks": None})

            # Calculate SGPA from average marks (10-point scale)
            current_sem_sgpa = round((avg_marks / 10), 2)
            previous_sem_sgpa = float(row.get("Previous_Sem_SGPA", 0)) if not pd.isna(row.get("Previous_Sem_SGPA")) else 0
            
            # Risk calculation
            risk_score = 0
            if avg_marks < 40:
                risk_score += 50
            elif avg_marks < 50:
                risk_score += 30
            elif avg_marks < 60:
                risk_score += 15
            
            attendance = float(row.get("Attendance_Percentage", 0)) if not pd.isna(row.get("Attendance_Percentage")) else 0
            if attendance < 75:
                risk_score += 30
            elif attendance < 85:
                risk_score += 10
            
            students.append({
                "student_id": str(row["Student_ID"]),
                "name": f"{row.get('First_Name', '')} {row.get('Last_Name', '')}".strip(),
                "first_name": _clean_value(row.get("First_Name", "")),
                "last_name": _clean_value(row.get("Last_Name", "")),
                "email": _clean_value(row.get("Email", "")),
                "phone_number": str(_clean_value(row.get("Phone_Number", ""))),
                "department": str(row.get("Department", "")),
                "department_code": _clean_value(row.get("Department_Code", "")),
                "year": int(row.get("Current_Year", 1)) if not pd.isna(row.get("Current_Year")) else 1,
                "semester": int(row.get("Semester", 1)) if not pd.isna(row.get("Semester")) else 1,
                "attendance_percentage": round(attendance, 2),
                "average_marks": round(avg_marks, 2),
                "previous_sem_sgpa": round(previous_sem_sgpa, 2),
                "current_sem_sgpa": current_sem_sgpa,  # Calculated from current marks
                "current_subjects": subject_marks,
                "extracurricular_level": _clean_value(row.get("Extracurricular_Level", "")),
                "internship": _clean_value(row.get("Internship", "")),
                "devops_status": _clean_value(row.get("DevOps_Engineering_Status", "")),
                "project_status": _clean_value(row.get("Project_Phase_II_Status", "")),
                "risk_score": round(risk_score, 2),
                "risk_level": _risk_level(risk_score),
            })
        
        return students
    except Exception as e:
        print(f"Error fetching performance data: {e}")
        return []

