from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[2]
SILVER_DIR = ROOT_DIR / "data" / "silver"
GOLD_DIR = ROOT_DIR / "data" / "gold"

# Maps logical dataset keys to (layer, filename) tuples.
# "student_master" and "enriched" both resolve to silver_student_profile
# because the silver ETL merged both raw sources into one table.
DATASET_FILES: Dict[str, Tuple[str, str]] = {
    # Silver layer (cleaned source tables)
    "student_master":      ("silver", "silver_student_profile.csv"),
    "enriched":            ("silver", "silver_student_profile.csv"),
    "cgpa_risk":           ("silver", "silver_academic_history.csv"),
    "curriculum":          ("silver", "silver_curriculum.csv"),
    "career_path":         ("silver", "silver_career_activity.csv"),
    "subject_performance": ("silver", "silver_subject_performance.csv"),
    "attendance_daily":    ("silver", "silver_attendance_daily.csv"),
    # Gold layer — Star Schema Dimensions
    "dim_student":         ("gold", "dim_student.csv"),
    "dim_subject":         ("gold", "dim_subject.csv"),
    "dim_faculty":         ("gold", "dim_faculty.csv"),
    "dim_semester":        ("gold", "dim_semester.csv"),
    # Gold layer — Star Schema Facts
    "fact_performance":    ("gold", "fact_student_performance.csv"),
    "fact_attendance":     ("gold", "fact_student_attendance.csv"),
    "fact_career":         ("gold", "fact_career_activity.csv"),
}

_DIR_MAP = {"silver": SILVER_DIR, "gold": GOLD_DIR}


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

    layer, filename = DATASET_FILES[dataset_key]
    file_path = _DIR_MAP[layer] / filename
    if not file_path.exists():
        raise DatasetNotFoundError(f"Dataset file not found: {file_path}")

    df = pd.read_csv(file_path, sep=None, engine="python")
    df.columns = [str(col).strip() for col in df.columns]
    return df


def get_dataset_status() -> Dict[str, Any]:
    status = {}
    for key, (layer, filename) in DATASET_FILES.items():
        path = _DIR_MAP[layer] / filename
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
    subject_codes = [code.strip() for code in str(row.get("current_subject_codes", "")).split("|") if code.strip()]
    subject_marks_raw = str(row.get("current_subject_marks", "")).split("|")
    subject_marks = []
    for m in subject_marks_raw:
        try:
            subject_marks.append(int(m.strip()))
        except ValueError:
            subject_marks.append(0)

    # Get curriculum for subject names (silver_curriculum)
    curriculum_df = load_dataset("curriculum")
    dept = str(row["department"]).strip()
    year = int(row["current_year"])
    sem = int(row["semester"])

    curriculum_rows = curriculum_df[
        (curriculum_df["department"].astype(str).str.strip() == dept)
        & (curriculum_df["year"] == year)
        & (curriculum_df["semester"] == sem)
    ]

    subject_name_map = {
        str(r["subject_code"]): str(r["subject_name"])
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
    previous_sgpa = float(row["previous_sem_sgpa"]) if not pd.isna(row.get("previous_sem_sgpa")) else 0
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
    attendance_pct = float(row["attendance_percentage"]) if not pd.isna(row.get("attendance_percentage")) else 0
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
        "name": f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
        "email": _clean_value(row.get("email", "")),
        "department": dept,
        "department_code": _clean_value(row.get("department_code", "")),
        "year": year,
        "semester": sem,
        "enrollment_year": int(row["enrollment_year"]) if not pd.isna(row.get("enrollment_year")) else None,
        "city": _clean_value(row.get("city", "")),
        "state": _clean_value(row.get("state", "")),
        "sgpa_trend": sgpa_trend,
        "subject_performance": subject_performance,
        "attendance": attendance,
        "latest_metrics": {
            "cgpa": round(previous_sgpa, 2),
            "previous_cgpa": round(previous_sgpa - 0.2, 2) if previous_sgpa > 0.2 else None,
            "average_marks": avg_marks,
            "attendance_percentage": round(attendance_pct, 2),
            "devops_status": _clean_value(row.get("devops_engineering_status", "")),
            "project_status": _clean_value(row.get("project_phase_ii_status", "")),
            "internship": _clean_value(row.get("internship", "")),
            "extracurricular_level": _clean_value(row.get("extracurricular_level", "")),
            "academic_risk_score": round(risk_score, 2),
            "risk_level": _risk_level(risk_score),
        },
    }


def get_student_dashboard(student_id: Optional[str] = None) -> Dict[str, Any]:
    # First try to get data from enriched dataset (silver_student_profile)
    try:
        enriched_df = load_dataset("enriched").copy()
        enriched_df["student_id"] = enriched_df["student_id"].astype(str).str.upper().str.strip()

        if student_id:
            sid = _normalize_student_id(student_id)
            student_row = enriched_df[enriched_df["student_id"] == sid]
            if not student_row.empty:
                return _get_enriched_dashboard(student_row.iloc[0], sid)
    except (DatasetNotFoundError, Exception):
        pass  # Fall back to cgpa_risk dataset

    # Fall back to cgpa_risk dataset (silver_academic_history)
    risk_df = load_dataset("cgpa_risk").copy()
    risk_df["student_id"] = risk_df["student_id"].astype(str).str.upper().str.strip()

    if student_id:
        sid = _normalize_student_id(student_id)
        student_rows = risk_df[risk_df["student_id"] == sid].copy()
        if student_rows.empty:
            raise ValueError(f"Student '{student_id}' not found in dataset")
    else:
        sid = str(risk_df.iloc[0]["student_id"])
        student_rows = risk_df[risk_df["student_id"] == sid].copy()

    student_rows = student_rows.sort_values(by=["year", "semester"]).reset_index(drop=True)
    latest = student_rows.iloc[-1]

    sgpa_trend = [
        {
            "semester": f"Sem {int(row['semester'])}",
            "sgpa": round(float(row["cgpa"]), 2),
        }
        for _, row in student_rows.iterrows()
    ]

    attendance = [
        {
            "semester": f"Sem {int(row['semester'])}",
            "percentage": round(float(row["attendance_percentage"]), 2),
        }
        for _, row in student_rows.iterrows()
    ]

    subject_codes = [code.strip() for code in str(latest.get("subject_codes", "")).split("|") if code.strip()]
    curriculum_df = load_dataset("curriculum")
    curriculum_rows = curriculum_df[
        (curriculum_df["department"].astype(str).str.strip() == str(latest["department"]).strip())
        & (curriculum_df["year"] == latest["year"])
        & (curriculum_df["semester"] == latest["semester"])
    ]

    subject_name_map = {
        str(row["subject_code"]): str(row["subject_name"])
        for _, row in curriculum_rows.iterrows()
    }

    avg_marks = round(float(latest["average_marks"]), 2)
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
        "department": str(latest["department"]),
        "year": int(latest["year"]),
        "sgpa_trend": sgpa_trend,
        "subject_performance": subject_performance,
        "attendance": attendance,
        "latest_metrics": {
            "cgpa": round(float(latest["cgpa"]), 2),
            "previous_cgpa": round(float(latest["previous_cgpa"]), 2) if not pd.isna(latest.get("previous_cgpa")) else None,
            "average_marks": avg_marks,
            "attendance_percentage": round(float(latest["attendance_percentage"]), 2),
            "study_hours_per_day": round(float(latest["study_hours_per_day"]), 1) if not pd.isna(latest.get("study_hours_per_day")) else None,
            "assignment_score": round(float(latest["assignment_score"]), 2) if not pd.isna(latest.get("assignment_score")) else None,
            "internal_exam_score": round(float(latest["internal_exam_score"]), 2) if not pd.isna(latest.get("internal_exam_score")) else None,
            "stress_level": str(latest.get("stress_level", "")) if not pd.isna(latest.get("stress_level")) else None,
            "backlog_count": int(latest["backlog_count"]) if not pd.isna(latest.get("backlog_count")) else 0,
            "backlog_risk_probability": round(float(latest["backlog_risk_probability"]), 4) if not pd.isna(latest.get("backlog_risk_probability")) else None,
            "academic_risk_score": round(float(latest["academic_risk_score"]), 2),
            "risk_level": _risk_level(float(latest["academic_risk_score"])),
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
    """Complete semester-wise academic history for a student from silver_academic_history."""
    risk_df = load_dataset("cgpa_risk").copy()
    risk_df["student_id"] = risk_df["student_id"].astype(str).str.upper().str.strip()
    sid = _normalize_student_id(student_id)

    student_rows = risk_df[risk_df["student_id"] == sid].copy()
    if student_rows.empty:
        raise ValueError(f"Student '{student_id}' not found in academic dataset")

    student_rows = student_rows.sort_values(by=["year", "semester"]).reset_index(drop=True)
    curriculum_df = load_dataset("curriculum")

    semesters: List[Dict[str, Any]] = []
    for _, row in student_rows.iterrows():
        subject_codes = [c.strip() for c in str(row.get("subject_codes", "")).split("|") if c.strip()]

        # Map subject codes to names via curriculum (silver_curriculum)
        curr_rows = curriculum_df[
            (curriculum_df["department"].astype(str).str.strip() == str(row["department"]).strip())
            & (curriculum_df["year"] == row["year"])
            & (curriculum_df["semester"] == row["semester"])
        ]
        subject_name_map = {
            str(r["subject_code"]): str(r["subject_name"]) for _, r in curr_rows.iterrows()
        }

        subjects = [
            {"code": code, "name": subject_name_map.get(code, code)}
            for code in subject_codes
        ]

        semesters.append({
            "year": int(row["year"]),
            "semester": int(row["semester"]),
            "department": str(row["department"]),
            "subjects": subjects,
            "average_marks": round(float(row["average_marks"]), 2),
            "cgpa": round(float(row["cgpa"]), 2),
            "previous_cgpa": round(float(row["previous_cgpa"]), 2) if not pd.isna(row.get("previous_cgpa")) else None,
            "attendance_percentage": round(float(row["attendance_percentage"]), 2),
            "study_hours_per_day": round(float(row["study_hours_per_day"]), 1) if not pd.isna(row.get("study_hours_per_day")) else None,
            "assignment_score": round(float(row["assignment_score"]), 2) if not pd.isna(row.get("assignment_score")) else None,
            "internal_exam_score": round(float(row["internal_exam_score"]), 2) if not pd.isna(row.get("internal_exam_score")) else None,
            "sleep_hours": round(float(row["sleep_hours"]), 1) if not pd.isna(row.get("sleep_hours")) else None,
            "stress_level": str(row.get("stress_level", "")) if not pd.isna(row.get("stress_level")) else None,
            "internet_usage_hours": round(float(row["internet_usage_hours"]), 1) if not pd.isna(row.get("internet_usage_hours")) else None,
            "participation_in_activities": str(row.get("participation_in_activities", "")) if not pd.isna(row.get("participation_in_activities")) else None,
            "internship": str(row.get("internship", "")) if not pd.isna(row.get("internship")) else None,
            "part_time_job": str(row.get("part_time_job", "")) if not pd.isna(row.get("part_time_job")) else None,
            "family_income_level": str(row.get("family_income_level", "")) if not pd.isna(row.get("family_income_level")) else None,
            "backlog_count": int(row["backlog_count"]) if not pd.isna(row.get("backlog_count")) else 0,
            "backlog_risk_probability": round(float(row["backlog_risk_probability"]), 4) if not pd.isna(row.get("backlog_risk_probability")) else None,
            "academic_risk_score": round(float(row["academic_risk_score"]), 2),
            "risk_level": _risk_level(float(row["academic_risk_score"])),
        })

    latest = student_rows.iloc[-1]
    return {
        "student_id": sid,
        "department": str(latest["department"]),
        "total_semesters": len(semesters),
        "current_cgpa": round(float(latest["cgpa"]), 2),
        "current_risk_level": _risk_level(float(latest["academic_risk_score"])),
        "semesters": semesters,
    }


def get_faculty_students(department: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Return all students from silver_student_profile with academic metrics for faculty view."""
    # silver_student_profile has all demographic + enriched data in one table
    profile_df = load_dataset("student_master").copy()
    risk_df = load_dataset("cgpa_risk").copy()

    profile_df["student_id"] = profile_df["student_id"].astype(str).str.upper().str.strip()
    risk_df["student_id"] = risk_df["student_id"].astype(str).str.upper().str.strip()

    latest_risk = (
        risk_df.sort_values(by=["student_id", "year", "semester"])
        .groupby("student_id", as_index=False)
        .tail(1)
    )

    merged = profile_df.merge(
        latest_risk[["student_id", "cgpa", "academic_risk_score", "semester"]],
        on="student_id",
        how="left",
        suffixes=("", "_risk"),
    )

    if department:
        dept = department.strip().lower()
        merged = merged[merged["department"].astype(str).str.lower() == dept]

    merged = merged.head(limit)

    rows: List[Dict[str, Any]] = []
    for _, row in merged.iterrows():
        # Parse enriched metrics from the profile
        try:
            marks = [int(m) for m in str(row.get("current_subject_marks", "")).split("|") if m.strip()]
            avg_marks = round(sum(marks) / len(marks), 2) if marks else None
        except Exception:
            avg_marks = None

        current_sem_gpa = round(avg_marks / 10, 2) if avg_marks is not None else None
        gpa_value = None
        if not pd.isna(row.get("previous_sem_sgpa")):
            gpa_value = round(float(row["previous_sem_sgpa"]), 2)
        elif not pd.isna(row.get("cgpa")):
            gpa_value = round(float(row["cgpa"]), 2)

        attendance_value = None
        if not pd.isna(row.get("attendance_percentage")):
            attendance_value = round(float(row["attendance_percentage"]), 2)

        derived_risk_score = float(row["academic_risk_score"]) if not pd.isna(row.get("academic_risk_score")) else 0.0
        if avg_marks is not None and avg_marks < 40:
            derived_risk_score = max(derived_risk_score, 70)
        elif avg_marks is not None and avg_marks < 50:
            derived_risk_score = max(derived_risk_score, 50)

        rows.append(
            {
                "id": str(row["student_id"]),
                "first_name": _clean_value(row.get("first_name", "")),
                "last_name": _clean_value(row.get("last_name", "")),
                "name": f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
                "email": _clean_value(row.get("email", "")),
                "phone_number": str(_clean_value(row.get("phone_number", ""))),
                "gender": _clean_value(row.get("gender", "")),
                "date_of_birth": _clean_value(row.get("date_of_birth", "")),
                "city": _clean_value(row.get("city", "")),
                "state": _clean_value(row.get("state", "")),
                "enrollment_year": int(row["enrollment_year"]) if not pd.isna(row.get("enrollment_year")) else None,
                "department": str(row["department"]),
                "department_code": _clean_value(row.get("department_code", "")),
                "admission_type": _clean_value(row.get("admission_type", "")),
                "current_year": int(row["current_year"]) if not pd.isna(row.get("current_year")) else None,
                "semester": int(row["semester"] if not pd.isna(row.get("semester")) else row.get("semester_risk", 1)),
                "status": _clean_value(row.get("status", "")),
                "attendance": attendance_value,
                "gpa": gpa_value,
                "current_sem_gpa": current_sem_gpa,
                "average_marks": avg_marks,
                "risk": _risk_level(derived_risk_score),
            }
        )

    return rows


def get_student_detail(student_id: str) -> Dict[str, Any]:
    """Full profile for a single student: silver_student_profile + latest academic metrics."""
    master_df = load_dataset("student_master").copy()
    master_df["student_id"] = master_df["student_id"].astype(str).str.upper().str.strip()
    sid = _normalize_student_id(student_id)

    student_row = master_df[master_df["student_id"] == sid]
    if student_row.empty:
        raise ValueError(f"Student '{student_id}' not found in master data")

    row = student_row.iloc[0]
    profile: Dict[str, Any] = {
        "student_id": sid,
        "first_name": _clean_value(row.get("first_name", "")),
        "last_name": _clean_value(row.get("last_name", "")),
        "name": f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
        "email": _clean_value(row.get("email", "")),
        "phone_number": str(_clean_value(row.get("phone_number", ""))),
        "gender": _clean_value(row.get("gender", "")),
        "date_of_birth": _clean_value(row.get("date_of_birth", "")),
        "city": _clean_value(row.get("city", "")),
        "state": _clean_value(row.get("state", "")),
        "enrollment_year": int(row["enrollment_year"]) if not pd.isna(row.get("enrollment_year")) else None,
        "department": str(row["department"]),
        "department_code": _clean_value(row.get("department_code", "")),
        "admission_type": _clean_value(row.get("admission_type", "")),
        "current_year": int(row["current_year"]) if not pd.isna(row.get("current_year")) else None,
        "semester": int(row["semester"]) if not pd.isna(row.get("semester")) else None,
        "status": _clean_value(row.get("status", "")),
    }

    # Attach latest academic metrics from silver_academic_history
    try:
        risk_df = load_dataset("cgpa_risk").copy()
        risk_df["student_id"] = risk_df["student_id"].astype(str).str.upper().str.strip()
        student_risk = risk_df[risk_df["student_id"] == sid].sort_values(by=["year", "semester"])
        if not student_risk.empty:
            latest = student_risk.iloc[-1]
            profile["academic_metrics"] = {
                "cgpa": round(float(latest["cgpa"]), 2),
                "average_marks": round(float(latest["average_marks"]), 2),
                "attendance_percentage": round(float(latest["attendance_percentage"]), 2),
                "academic_risk_score": round(float(latest["academic_risk_score"]), 2),
                "risk_level": _risk_level(float(latest["academic_risk_score"])),
                "backlog_count": int(latest["backlog_count"]),
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
    latest_students = master_df[master_df["status"].astype(str).str.lower() == "active"]

    return {
        "departments": int(latest_students["department"].nunique()),
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
        df = df[df["department"].astype(str).str.strip().str.lower() == department.strip().lower()]
    records = []
    for _, row in df.iterrows():
        records.append({col: _clean_value(val) for col, val in row.items()})
    return records

def get_students_performance_data(department: Optional[str] = None) -> List[Dict[str, Any]]:
    df = load_dataset("enriched")
    if department:
        df = df[df["department"].astype(str).str.strip().str.lower() == department.strip().lower()]
    records = []
    for _, row in df.iterrows():
        rec = {col: _clean_value(val) for col, val in row.items()}
        rec["name"] = f"{rec.get('first_name', '')} {rec.get('last_name', '')}".strip()
        rec["devops_status"] = rec.get("devops_engineering_status")
        rec["project_status"] = rec.get("project_phase_ii_status")
        # Compute a simple risk based on previous_sem_sgpa and attendance
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
