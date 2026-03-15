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
    """Get student performance data from silver_student_profile (enriched + master merged)."""
    import pandas as pd
    
    try:
        # silver_student_profile has all enriched + master data in one table
        profile_df = load_dataset("enriched").copy()
        profile_df["student_id"] = profile_df["student_id"].astype(str).str.upper().str.strip()
        
        # Filter by department if specified
        if department:
            dept = department.strip()
            profile_df = profile_df[profile_df["department"].str.strip() == dept]
        
        # Limit results
        profile_df = profile_df.head(limit)
        
        students = []
        for _, row in profile_df.iterrows():
            # Parse marks and subjects
            marks_str = str(row.get("current_subject_marks", ""))
            codes_str = str(row.get("current_subject_codes", ""))
            marks = []
            for m in marks_str.split("|"):
                m = m.strip()
                if m and m.lower() != "nan":
                    try:
                        marks.append(int(float(m)))
                    except (ValueError, OverflowError):
                        pass
            codes = [c.strip() for c in codes_str.split("|") if c.strip() and c.strip().lower() != "nan"]
            avg_marks = sum(marks) / len(marks) if marks else 0

            subject_marks = []
            for i in range(min(len(codes), len(marks))):
                subject_marks.append({
                    "subject_code": codes[i],
                    "marks": marks[i],
                })
            if len(marks) > len(codes):
                for i in range(len(codes), len(marks)):
                    subject_marks.append({"subject_code": f"MISC-{i+1}", "marks": marks[i]})
            elif len(codes) > len(marks):
                for i in range(len(marks), len(codes)):
                    subject_marks.append({"subject_code": codes[i], "marks": None})

            # Calculate SGPA from average marks (10-point scale)
            current_sem_sgpa = round((avg_marks / 10), 2)
            previous_sem_sgpa = float(row.get("previous_sem_sgpa", 0)) if not pd.isna(row.get("previous_sem_sgpa")) else 0
            
            # Risk calculation
            risk_score = 0
            if avg_marks < 40:
                risk_score += 50
            elif avg_marks < 50:
                risk_score += 30
            elif avg_marks < 60:
                risk_score += 15
            
            attendance = float(row.get("attendance_percentage", 0)) if not pd.isna(row.get("attendance_percentage")) else 0
            if attendance < 75:
                risk_score += 30
            elif attendance < 85:
                risk_score += 10
            
            students.append({
                "student_id": str(row["student_id"]),
                "name": f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
                "first_name": _clean_value(row.get("first_name", "")),
                "last_name": _clean_value(row.get("last_name", "")),
                "email": _clean_value(row.get("email", "")),
                "phone_number": str(_clean_value(row.get("phone_number", ""))),
                "department": str(row.get("department", "")),
                "department_code": _clean_value(row.get("department_code", "")),
                "year": int(row.get("current_year", 1)) if not pd.isna(row.get("current_year")) else 1,
                "semester": int(row.get("semester", 1)) if not pd.isna(row.get("semester")) else 1,
                "attendance_percentage": round(attendance, 2),
                "average_marks": round(avg_marks, 2),
                "previous_sem_sgpa": round(previous_sem_sgpa, 2),
                "current_sem_sgpa": current_sem_sgpa,
                "current_subjects": subject_marks,
                "extracurricular_level": _clean_value(row.get("extracurricular_level", "")),
                "internship": _clean_value(row.get("internship", "")),
                "devops_status": _clean_value(row.get("devops_engineering_status", "")),
                "project_status": _clean_value(row.get("project_phase_ii_status", "")),
                "risk_score": round(risk_score, 2),
                "risk_level": _risk_level(risk_score),
            })
        
        return students
    except Exception as e:
        print(f"Error fetching performance data: {e}")
        return []


class SuggestionCreate(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    topic: str = "General"


@router.post("/students/{student_id}/suggestions")
def add_student_suggestion(student_id: str, suggestion: SuggestionCreate):
    from services.dataset_service import add_faculty_suggestion

    new_entry = add_faculty_suggestion(student_id, suggestion.dict())
    return {"message": "Suggestion added", "suggestion": new_entry}


@router.get("/students/{student_id}/suggestions")
def list_student_suggestions(student_id: str):
    from services.dataset_service import get_faculty_suggestions

    return get_faculty_suggestions(student_id)


@router.get("/subject-mapping")
def get_faculty_subject_mapping(
    department: Optional[str] = None,
    faculty_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Faculty-subject mapping from gold star-schema (dim_faculty + dim_subject + fact_performance)."""
    import pandas as pd

    try:
        fac_df = load_dataset("dim_faculty").copy()
        subj_df = load_dataset("dim_subject").copy()
        perf_df = load_dataset("fact_performance").copy()

        # Build faculty-subject mapping by joining dim tables
        # dim_subject has subject_id; fact_performance links student×subject×faculty
        # Get unique faculty-subject pairs from fact_performance
        if not perf_df.empty and "faculty_id" in perf_df.columns and "subject_id" in perf_df.columns:
            perf_df["total_marks"] = pd.to_numeric(perf_df.get("total_marks"), errors="coerce")
            # Aggregate per subject
            subj_stats = perf_df.groupby(["faculty_id", "subject_id"]).agg(
                avg_marks=("total_marks", "mean"),
                pass_rate=("result_status", lambda x: (x == "Pass").mean() * 100),
                student_count=("student_id", "nunique"),
            ).reset_index().round(2)

            # Merge faculty info
            result = subj_stats.merge(fac_df, on="faculty_id", how="left")
            # Merge subject info (rename department to avoid collision)
            subj_renamed = subj_df.rename(columns={"department": "subject_department"})
            result = result.merge(subj_renamed, on="subject_id", how="left")
            # Use faculty department as the canonical one, drop the duplicate
            if "subject_department" in result.columns:
                result = result.drop(columns=["subject_department"])
            # Teaching load
            result["teaching_load"] = result.groupby("faculty_id")["subject_id"].transform("count")
        else:
            # Fallback: just return dim_faculty with subject info
            result = fac_df.copy()

        if department:
            dept = department.strip()
            result = result[result["department"].str.strip() == dept]

        if faculty_id:
            fid = faculty_id.strip().upper()
            result = result[result["faculty_id"].str.upper() == fid]

        records = []
        for _, row in result.iterrows():
            records.append({k: _clean_value(v) for k, v in row.items()})
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

