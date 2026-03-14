from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[2]
DATASET_DIR = ROOT_DIR / "data" / "datasets"

DATASET_FILES = {
    "student_master": "engineering_student_master_data.csv",
    "cgpa_risk": "student_cgpa_risk_synthetic_dataset_100k.csv",
    "career_path": "student_future_career_path_synthetic_dataset_100k.csv",
    "curriculum": "engineering_college_curriculum_dataset.csv",
    "enriched": "enriched_engineering_student_academic_dataset.csv",
}


class DatasetNotFoundError(Exception):
    pass


def _clean_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp,)):
        return value.isoformat()
    return value


def _normalize_student_id(student_id: str) -> str:
    return str(student_id).strip().upper()


@lru_cache(maxsize=16)
def load_dataset(dataset_key: str) -> pd.DataFrame:
    if dataset_key not in DATASET_FILES:
        raise DatasetNotFoundError(f"Unknown dataset '{dataset_key}'")

    file_path = DATASET_DIR / DATASET_FILES[dataset_key]
    if not file_path.exists():
        raise DatasetNotFoundError(f"Dataset file not found: {file_path}")

    # sep=None lets pandas detect delimiter, needed because one file is semicolon-separated.
    df = pd.read_csv(file_path, sep=None, engine="python")
    df.columns = [str(col).strip() for col in df.columns]
    return df


def get_dataset_status() -> Dict[str, Any]:
    status = {}
    for key, filename in DATASET_FILES.items():
        path = DATASET_DIR / filename
        exists = path.exists()
        row_count = 0
        if exists:
            row_count = int(len(load_dataset(key)))
        status[key] = {
            "file": filename,
            "exists": exists,
            "rows": row_count,
        }
    return status


def _risk_level(risk_score: float) -> str:
    if risk_score >= 75:
        return "Critical"
    if risk_score >= 60:
        return "High"
    if risk_score >= 40:
        return "Medium"
    return "Low"


def _get_enriched_dashboard(row: pd.Series, sid: str) -> Dict[str, Any]:
    """Build dashboard data from enriched dataset row."""
    # Parse subject codes and marks
    subject_codes = [code.strip() for code in str(row.get("Current_Subject_Codes", "")).split("|") if code.strip()]
    subject_marks_raw = str(row.get("Current_Subject_Marks", "")).split("|")
    subject_marks = []
    for m in subject_marks_raw:
        try:
            subject_marks.append(int(m.strip()))
        except ValueError:
            subject_marks.append(0)

    # Get curriculum for subject names
    curriculum_df = load_dataset("curriculum")
    dept = str(row["Department"]).strip()
    year = int(row["Current_Year"])
    sem = int(row["Semester"])

    curriculum_rows = curriculum_df[
        (curriculum_df["Department"].astype(str).str.strip() == dept)
        & (curriculum_df["Year"] == year)
        & (curriculum_df["Semester"] == sem)
    ]

    subject_name_map = {
        str(r["Subject_Code"]): str(r["Subject_Name"])
        for _, r in curriculum_rows.iterrows()
    }

    # Build subject performance with individual marks
    subject_performance = []
    for i, code in enumerate(subject_codes):
        marks = subject_marks[i] if i < len(subject_marks) else 0
        subject_performance.append({
            "subject": subject_name_map.get(code, code),
            "subject_code": code,
            "marks": marks,
            "total": 100,
        })

    # Calculate average marks
    avg_marks = round(sum(subject_marks) / len(subject_marks), 2) if subject_marks else 0

    # Previous SGPA for trend (show current semester's previous SGPA)
    previous_sgpa = float(row["Previous_Sem_SGPA"]) if not pd.isna(row.get("Previous_Sem_SGPA")) else 0
    sgpa_trend = []
    for s in range(1, sem + 1):
        if s == sem:
            # Current semester - estimate from marks
            estimated_sgpa = round((avg_marks / 10) * 0.9 + 1, 2)
            sgpa_trend.append({"semester": f"Sem {s}", "sgpa": estimated_sgpa})
        elif s == sem - 1:
            sgpa_trend.append({"semester": f"Sem {s}", "sgpa": round(previous_sgpa, 2)})
        else:
            # Estimate previous semesters
            estimated = round(previous_sgpa + (0.1 * (sem - s - 1)), 2)
            sgpa_trend.append({"semester": f"Sem {s}", "sgpa": min(estimated, 10.0)})

    # Attendance
    attendance_pct = float(row["Attendance_Percentage"]) if not pd.isna(row.get("Attendance_Percentage")) else 0
    attendance = [{"semester": f"Sem {sem}", "percentage": round(attendance_pct, 2)}]

    # Risk calculation based on marks and attendance
    risk_score = 0
    if avg_marks < 40:
        risk_score += 50
    elif avg_marks < 50:
        risk_score += 30
    elif avg_marks < 60:
        risk_score += 15
    if attendance_pct < 75:
        risk_score += 30
    elif attendance_pct < 85:
        risk_score += 10

    return {
        "student_id": sid,
        "name": f"{row.get('First_Name', '')} {row.get('Last_Name', '')}".strip(),
        "email": _clean_value(row.get("Email", "")),
        "department": dept,
        "department_code": _clean_value(row.get("Department_Code", "")),
        "year": year,
        "semester": sem,
        "enrollment_year": int(row["Enrollment_Year"]) if not pd.isna(row.get("Enrollment_Year")) else None,
        "city": _clean_value(row.get("City", "")),
        "state": _clean_value(row.get("State", "")),
        "sgpa_trend": sgpa_trend,
        "subject_performance": subject_performance,
        "attendance": attendance,
        "latest_metrics": {
            "cgpa": round(previous_sgpa, 2),
            "previous_cgpa": round(previous_sgpa - 0.2, 2) if previous_sgpa > 0.2 else None,
            "average_marks": avg_marks,
            "attendance_percentage": round(attendance_pct, 2),
            "devops_status": _clean_value(row.get("DevOps_Engineering_Status", "")),
            "project_status": _clean_value(row.get("Project_Phase_II_Status", "")),
            "internship": _clean_value(row.get("Internship", "")),
            "extracurricular_level": _clean_value(row.get("Extracurricular_Level", "")),
            "academic_risk_score": round(risk_score, 2),
            "risk_level": _risk_level(risk_score),
        },
    }


def get_student_dashboard(student_id: Optional[str] = None) -> Dict[str, Any]:
    # First try to get data from enriched dataset
    try:
        enriched_df = load_dataset("enriched").copy()
        enriched_df["Student_ID"] = enriched_df["Student_ID"].astype(str).str.upper().str.strip()

        if student_id:
            sid = _normalize_student_id(student_id)
            student_row = enriched_df[enriched_df["Student_ID"] == sid]
            if not student_row.empty:
                return _get_enriched_dashboard(student_row.iloc[0], sid)
    except (DatasetNotFoundError, Exception):
        pass  # Fall back to cgpa_risk dataset

    # Fall back to cgpa_risk dataset
    risk_df = load_dataset("cgpa_risk").copy()
    risk_df["Student_ID"] = risk_df["Student_ID"].astype(str).str.upper().str.strip()

    if student_id:
        sid = _normalize_student_id(student_id)
        student_rows = risk_df[risk_df["Student_ID"] == sid].copy()
        if student_rows.empty:
            raise ValueError(f"Student '{student_id}' not found in dataset")
    else:
        sid = str(risk_df.iloc[0]["Student_ID"])
        student_rows = risk_df[risk_df["Student_ID"] == sid].copy()

    student_rows = student_rows.sort_values(by=["Year", "Semester"]).reset_index(drop=True)
    latest = student_rows.iloc[-1]

    sgpa_trend = [
        {
            "semester": f"Sem {int(row['Semester'])}",
            "sgpa": round(float(row["CGPA"]), 2),
        }
        for _, row in student_rows.iterrows()
    ]

    attendance = [
        {
            "semester": f"Sem {int(row['Semester'])}",
            "percentage": round(float(row["Attendance_Percentage"]), 2),
        }
        for _, row in student_rows.iterrows()
    ]

    subject_codes = [code.strip() for code in str(latest.get("Subject_Codes", "")).split("|") if code.strip()]
    curriculum_df = load_dataset("curriculum")
    curriculum_rows = curriculum_df[
        (curriculum_df["Department"].astype(str).str.strip() == str(latest["Department"]).strip())
        & (curriculum_df["Year"] == latest["Year"])
        & (curriculum_df["Semester"] == latest["Semester"])
    ]

    subject_name_map = {
        str(row["Subject_Code"]): str(row["Subject_Name"])
        for _, row in curriculum_rows.iterrows()
    }

    avg_marks = round(float(latest["Average_Marks"]), 2)
    subject_performance = [
        {
            "subject": subject_name_map.get(code, code),
            "subject_code": code,
            "marks": avg_marks,
            "total": 100,
        }
        for code in subject_codes
    ]

    return {
        "student_id": sid,
        "department": str(latest["Department"]),
        "year": int(latest["Year"]),
        "sgpa_trend": sgpa_trend,
        "subject_performance": subject_performance,
        "attendance": attendance,
        "latest_metrics": {
            "cgpa": round(float(latest["CGPA"]), 2),
            "previous_cgpa": round(float(latest["Previous_CGPA"]), 2) if not pd.isna(latest.get("Previous_CGPA")) else None,
            "average_marks": avg_marks,
            "attendance_percentage": round(float(latest["Attendance_Percentage"]), 2),
            "study_hours_per_day": round(float(latest["Study_Hours_Per_Day"]), 1) if not pd.isna(latest.get("Study_Hours_Per_Day")) else None,
            "assignment_score": round(float(latest["Assignment_Score"]), 2) if not pd.isna(latest.get("Assignment_Score")) else None,
            "internal_exam_score": round(float(latest["Internal_Exam_Score"]), 2) if not pd.isna(latest.get("Internal_Exam_Score")) else None,
            "stress_level": str(latest.get("Stress_Level", "")) if not pd.isna(latest.get("Stress_Level")) else None,
            "backlog_count": int(latest["Backlog_Count"]) if not pd.isna(latest.get("Backlog_Count")) else 0,
            "backlog_risk_probability": round(float(latest["Backlog_Risk_Probability"]), 4) if not pd.isna(latest.get("Backlog_Risk_Probability")) else None,
            "academic_risk_score": round(float(latest["Academic_Risk_Score"]), 2),
            "risk_level": _risk_level(float(latest["Academic_Risk_Score"])),
        },
    }


# Faculty-managed in-memory suggestion store.
FACULTY_SUGGESTIONS: Dict[str, List[Dict[str, Any]]] = {}


def add_faculty_suggestion(student_id: str, suggestion: Dict[str, Any]) -> Dict[str, Any]:
    sid = _normalize_student_id(student_id)
    entry = {
        "title": suggestion.get("title", "Faculty Suggestion"),
        "description": suggestion.get("description", "Please follow your faculty guidance."),
        "priority": suggestion.get("priority", "medium"),
        "topic": suggestion.get("topic", "General"),
        "source": "faculty",
    }
    FACULTY_SUGGESTIONS.setdefault(sid, []).append(entry)
    return entry


def get_faculty_suggestions(student_id: Optional[str] = None) -> List[Dict[str, Any]]:
    if not student_id:
        return []
    sid = _normalize_student_id(student_id)
    return FACULTY_SUGGESTIONS.get(sid, [])


def get_student_recommendations(student_id: Optional[str] = None) -> List[Dict[str, Any]]:
    dashboard = get_student_dashboard(student_id)
    metrics = dashboard["latest_metrics"]

    recommendations: List[Dict[str, Any]] = []

    if metrics.get("attendance_percentage", 0) < 75:
        recommendations.append(
            {
                "title": "Improve attendance consistency",
                "priority": "high",
                "topic": "Attendance",
                "description": "Your attendance is below 75%. Focus on regular lecture participation.",
                "source": "system",
            }
        )

    if metrics.get("average_marks", 0) < 55:
        recommendations.append(
            {
                "title": "Focus on core subject fundamentals",
                "priority": "high",
                "topic": "Core Concepts",
                "description": "Your average marks are low. Revise current semester core subjects with daily practice.",
                "source": "system",
            }
        )

    if metrics.get("cgpa", 0) < 6.5:
        recommendations.append(
            {
                "title": "Raise CGPA with weekly study goals",
                "priority": "medium",
                "topic": "CGPA Improvement",
                "description": "Target weak subjects first and set weekly improvement goals.",
                "source": "system",
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "title": "Maintain your current progress",
                "priority": "low",
                "topic": "Performance",
                "description": "Your recent metrics are healthy. Keep consistent effort and attempt advanced practice sets.",
                "source": "system",
            }
        )

    faculty_recs = get_faculty_suggestions(student_id)
    # Add faculty suggestions first to highlight direct instructor advice
    combined = faculty_recs + recommendations

    # Add own dummy suggestions if none exist at all
    if not combined:
        combined = [
            {
                "title": "Check attendance and complete class tasks",
                "priority": "medium",
                "topic": "Attendance",
                "description": "Regular attendance helps improve performance and reduces risk of missing key concepts.",
                "source": "system",
            },
            {
                "title": "Set a weekly revision schedule",
                "priority": "low",
                "topic": "Time Management",
                "description": "Plan 1-hour daily revision sessions for difficult subjects to gradually boost your scores.",
                "source": "system",
            },
        ]

    return combined


def get_student_academic_history(student_id: str) -> Dict[str, Any]:
    """Complete semester-wise academic history for a student from cgpa_risk dataset."""
    risk_df = load_dataset("cgpa_risk").copy()
    risk_df["Student_ID"] = risk_df["Student_ID"].astype(str).str.upper().str.strip()
    sid = _normalize_student_id(student_id)

    student_rows = risk_df[risk_df["Student_ID"] == sid].copy()
    if student_rows.empty:
        raise ValueError(f"Student '{student_id}' not found in academic dataset")

    student_rows = student_rows.sort_values(by=["Year", "Semester"]).reset_index(drop=True)
    curriculum_df = load_dataset("curriculum")

    semesters: List[Dict[str, Any]] = []
    for _, row in student_rows.iterrows():
        subject_codes = [c.strip() for c in str(row.get("Subject_Codes", "")).split("|") if c.strip()]

        # Map subject codes to names via curriculum
        curr_rows = curriculum_df[
            (curriculum_df["Department"].astype(str).str.strip() == str(row["Department"]).strip())
            & (curriculum_df["Year"] == row["Year"])
            & (curriculum_df["Semester"] == row["Semester"])
        ]
        subject_name_map = {
            str(r["Subject_Code"]): str(r["Subject_Name"]) for _, r in curr_rows.iterrows()
        }

        subjects = [
            {"code": code, "name": subject_name_map.get(code, code)}
            for code in subject_codes
        ]

        semesters.append({
            "year": int(row["Year"]),
            "semester": int(row["Semester"]),
            "department": str(row["Department"]),
            "subjects": subjects,
            "average_marks": round(float(row["Average_Marks"]), 2),
            "cgpa": round(float(row["CGPA"]), 2),
            "previous_cgpa": round(float(row["Previous_CGPA"]), 2) if not pd.isna(row.get("Previous_CGPA")) else None,
            "attendance_percentage": round(float(row["Attendance_Percentage"]), 2),
            "study_hours_per_day": round(float(row["Study_Hours_Per_Day"]), 1) if not pd.isna(row.get("Study_Hours_Per_Day")) else None,
            "assignment_score": round(float(row["Assignment_Score"]), 2) if not pd.isna(row.get("Assignment_Score")) else None,
            "internal_exam_score": round(float(row["Internal_Exam_Score"]), 2) if not pd.isna(row.get("Internal_Exam_Score")) else None,
            "sleep_hours": round(float(row["Sleep_Hours"]), 1) if not pd.isna(row.get("Sleep_Hours")) else None,
            "stress_level": str(row.get("Stress_Level", "")) if not pd.isna(row.get("Stress_Level")) else None,
            "internet_usage_hours": round(float(row["Internet_Usage_Hours"]), 1) if not pd.isna(row.get("Internet_Usage_Hours")) else None,
            "participation_in_activities": str(row.get("Participation_in_Activities", "")) if not pd.isna(row.get("Participation_in_Activities")) else None,
            "internship": str(row.get("Internship", "")) if not pd.isna(row.get("Internship")) else None,
            "part_time_job": str(row.get("Part_Time_Job", "")) if not pd.isna(row.get("Part_Time_Job")) else None,
            "family_income_level": str(row.get("Family_Income_Level", "")) if not pd.isna(row.get("Family_Income_Level")) else None,
            "backlog_count": int(row["Backlog_Count"]) if not pd.isna(row.get("Backlog_Count")) else 0,
            "backlog_risk_probability": round(float(row["Backlog_Risk_Probability"]), 4) if not pd.isna(row.get("Backlog_Risk_Probability")) else None,
            "academic_risk_score": round(float(row["Academic_Risk_Score"]), 2),
            "risk_level": _risk_level(float(row["Academic_Risk_Score"])),
        })

    latest = student_rows.iloc[-1]
    return {
        "student_id": sid,
        "department": str(latest["Department"]),
        "total_semesters": len(semesters),
        "current_cgpa": round(float(latest["CGPA"]), 2),
        "current_risk_level": _risk_level(float(latest["Academic_Risk_Score"])),
        "semesters": semesters,
    }


def get_faculty_students(department: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Return all students from master data with full personal info for faculty view."""
    master_df = load_dataset("student_master").copy()
    enriched_df = load_dataset("enriched").copy()
    risk_df = load_dataset("cgpa_risk").copy()

    master_df["Student_ID"] = master_df["Student_ID"].astype(str).str.upper().str.strip()
    enriched_df["Student_ID"] = enriched_df["Student_ID"].astype(str).str.upper().str.strip()
    risk_df["Student_ID"] = risk_df["Student_ID"].astype(str).str.upper().str.strip()

    latest_enriched = (
        enriched_df.sort_values(by=["Student_ID", "Enrollment_Year", "Current_Year", "Semester"])
        .drop_duplicates(subset=["Student_ID"], keep="last")
        .reset_index(drop=True)
    )

    latest_risk = (
        risk_df.sort_values(by=["Student_ID", "Year", "Semester"])
        .groupby("Student_ID", as_index=False)
        .tail(1)
    )

    merged = master_df.merge(
        latest_enriched[["Student_ID", "Previous_Sem_SGPA", "Attendance_Percentage", "Semester", "Current_Subject_Codes", "Current_Subject_Marks"]],
        on="Student_ID",
        how="left",
        suffixes=("", "_enriched"),
    )

    merged = merged.merge(
        latest_risk[["Student_ID", "CGPA", "Academic_Risk_Score", "Semester"]],
        on="Student_ID",
        how="left",
        suffixes=("", "_risk"),
    )

    if department:
        dept = department.strip().lower()
        merged = merged[merged["Department"].astype(str).str.lower() == dept]

    merged = merged.head(limit)

    rows: List[Dict[str, Any]] = []
    for _, row in merged.iterrows():
        # Try enriched metrics first, then risk fallback
        try:
            marks = [int(m) for m in str(row.get("Current_Subject_Marks", "")).split("|") if m.strip()]
            avg_marks = round(sum(marks) / len(marks), 2) if marks else None
        except Exception:
            avg_marks = None

        current_sem_gpa = round(avg_marks / 10, 2) if avg_marks is not None else None
        gpa_value = None
        if not pd.isna(row.get("Previous_Sem_SGPA")):
            gpa_value = round(float(row["Previous_Sem_SGPA"]), 2)
        elif not pd.isna(row.get("CGPA")):
            gpa_value = round(float(row["CGPA"]), 2)

        attendance_value = None
        if not pd.isna(row.get("Attendance_Percentage")):
            attendance_value = round(float(row["Attendance_Percentage"]), 2)

        derived_risk_score = float(row["Academic_Risk_Score"]) if not pd.isna(row.get("Academic_Risk_Score")) else 0.0
        if avg_marks is not None and avg_marks < 40:
            derived_risk_score = max(derived_risk_score, 70)
        elif avg_marks is not None and avg_marks < 50:
            derived_risk_score = max(derived_risk_score, 50)

        rows.append(
            {
                "id": str(row["Student_ID"]),
                "first_name": _clean_value(row.get("First_Name", "")),
                "last_name": _clean_value(row.get("Last_Name", "")),
                "name": f"{row.get('First_Name', '')} {row.get('Last_Name', '')}".strip(),
                "email": _clean_value(row.get("Email", "")),
                "phone_number": str(_clean_value(row.get("Phone_Number", ""))),
                "gender": _clean_value(row.get("Gender", "")),
                "date_of_birth": _clean_value(row.get("Date_of_Birth", "")),
                "city": _clean_value(row.get("City", "")),
                "state": _clean_value(row.get("State", "")),
                "enrollment_year": int(row["Enrollment_Year"]) if not pd.isna(row.get("Enrollment_Year")) else None,
                "department": str(row["Department"]),
                "department_code": _clean_value(row.get("Department_Code", "")),
                "admission_type": _clean_value(row.get("Admission_Type", "")),
                "current_year": int(row["Current_Year"]) if not pd.isna(row.get("Current_Year")) else None,
                "semester": int(row["Semester"] if not pd.isna(row.get("Semester")) else row.get("Semester_risk", 1)),
                "status": _clean_value(row.get("Status", "")),
                "attendance": attendance_value,
                "gpa": gpa_value,
                "current_sem_gpa": current_sem_gpa,
                "average_marks": avg_marks,
                "risk": _risk_level(derived_risk_score),
            }
        )

    return rows


def get_student_detail(student_id: str) -> Dict[str, Any]:
    """Full profile for a single student: master data + latest academic metrics."""
    master_df = load_dataset("student_master").copy()
    master_df["Student_ID"] = master_df["Student_ID"].astype(str).str.upper().str.strip()
    sid = _normalize_student_id(student_id)

    student_row = master_df[master_df["Student_ID"] == sid]
    if student_row.empty:
        raise ValueError(f"Student '{student_id}' not found in master data")

    row = student_row.iloc[0]
    profile: Dict[str, Any] = {
        "student_id": sid,
        "first_name": _clean_value(row.get("First_Name", "")),
        "last_name": _clean_value(row.get("Last_Name", "")),
        "name": f"{row.get('First_Name', '')} {row.get('Last_Name', '')}".strip(),
        "email": _clean_value(row.get("Email", "")),
        "phone_number": str(_clean_value(row.get("Phone_Number", ""))),
        "gender": _clean_value(row.get("Gender", "")),
        "date_of_birth": _clean_value(row.get("Date_of_Birth", "")),
        "city": _clean_value(row.get("City", "")),
        "state": _clean_value(row.get("State", "")),
        "enrollment_year": int(row["Enrollment_Year"]) if not pd.isna(row.get("Enrollment_Year")) else None,
        "department": str(row["Department"]),
        "department_code": _clean_value(row.get("Department_Code", "")),
        "admission_type": _clean_value(row.get("Admission_Type", "")),
        "current_year": int(row["Current_Year"]) if not pd.isna(row.get("Current_Year")) else None,
        "semester": int(row["Semester"]) if not pd.isna(row.get("Semester")) else None,
        "status": _clean_value(row.get("Status", "")),
    }

    # Attach latest academic metrics if available in cgpa_risk dataset
    try:
        risk_df = load_dataset("cgpa_risk").copy()
        risk_df["Student_ID"] = risk_df["Student_ID"].astype(str).str.upper().str.strip()
        student_risk = risk_df[risk_df["Student_ID"] == sid].sort_values(by=["Year", "Semester"])
        if not student_risk.empty:
            latest = student_risk.iloc[-1]
            profile["academic_metrics"] = {
                "cgpa": round(float(latest["CGPA"]), 2),
                "average_marks": round(float(latest["Average_Marks"]), 2),
                "attendance_percentage": round(float(latest["Attendance_Percentage"]), 2),
                "academic_risk_score": round(float(latest["Academic_Risk_Score"]), 2),
                "risk_level": _risk_level(float(latest["Academic_Risk_Score"])),
                "backlog_count": int(latest["Backlog_Count"]),
            }
    except Exception:
        profile["academic_metrics"] = None

    return profile


def get_faculty_analytics(department: Optional[str] = None) -> Dict[str, Any]:
    students = get_faculty_students(department=department, limit=10000)

    if not students:
        return {
            "class_avg_gpa": 0.0,
            "at_risk_count": 0,
            "total_students": 0,
            "avg_attendance": 0.0,
        }

    gpas = [s["gpa"] for s in students if s["gpa"] is not None]
    attendance_values = [s["attendance"] for s in students if s["attendance"] is not None]
    at_risk_count = sum(1 for s in students if s["risk"] in {"High", "Critical"})

    return {
        "class_avg_gpa": round(sum(gpas) / len(gpas), 2) if gpas else 0.0,
        "at_risk_count": at_risk_count,
        "total_students": len(students),
        "avg_attendance": round(sum(attendance_values) / len(attendance_values), 2) if attendance_values else 0.0,
    }


def get_admin_dashboard_metrics() -> Dict[str, Any]:
    master_df = load_dataset("student_master")
    latest_students = master_df[master_df["Status"].astype(str).str.lower() == "active"]

    return {
        "departments": int(latest_students["Department"].nunique()),
        "total_students": int(len(latest_students)),
    }


def get_dataset_rows(dataset_key: str, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
    df = load_dataset(dataset_key)
    total_rows = len(df)

    page = df.iloc[offset : offset + limit]
    records = [
        {col: _clean_value(row[col]) for col in page.columns}
        for _, row in page.iterrows()
    ]

    return {
        "dataset": dataset_key,
        "total_rows": int(total_rows),
        "limit": int(limit),
        "offset": int(offset),
        "rows": records,
    }


def get_students_master_data(department: Optional[str] = None) -> List[Dict[str, Any]]:
    df = load_dataset("student_master")
    if department:
        df = df[df["Department"].astype(str).str.strip().str.lower() == department.strip().lower()]
    records = []
    for _, row in df.iterrows():
        records.append({col.lower(): _clean_value(val) for col, val in row.items()})
    return records

def get_students_performance_data(department: Optional[str] = None) -> List[Dict[str, Any]]:
    df = load_dataset("enriched")
    if department:
        df = df[df["Department"].astype(str).str.strip().str.lower() == department.strip().lower()]
    records = []
    for _, row in df.iterrows():
        # Ensure we construct performance data correctly for frontend
        rec = {col.lower(): _clean_value(val) for col, val in row.items()}
        rec["name"] = f"{rec.get('first_name', '')} {rec.get('last_name', '')}".strip()
        rec["devops_status"] = rec.get("devops_engineering_status")
        rec["project_status"] = rec.get("project_phase_ii_status")
        rec["risk_level"] = _risk_level(50) # default fake risk, actual logic requires marks
        # Let's compute a simple risk based on previous_sem_sgpa and attendance
        sgpa = rec.get("previous_sem_sgpa", 10)
        att = rec.get("attendance_percentage", 100)
        marks_str = str(rec.get("current_subject_marks", ""))
        current_sgpa = 0.0
        if marks_str:
            marks = [int(m) for m in marks_str.split("|") if m.strip().isdigit()]
            if marks:
                current_sgpa = round(((sum(marks)/len(marks)) / 10) * 0.9 + 1, 2)
        rec["current_sem_sgpa"] = current_sgpa
        risk = 0
        if sgpa and sgpa < 5: risk += 50
        elif sgpa and sgpa < 6: risk += 20
        if att and att < 75: risk += 30
        rec["risk_level"] = _risk_level(risk)
        records.append(rec)
    return records
