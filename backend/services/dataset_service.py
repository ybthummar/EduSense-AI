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


def get_student_dashboard(student_id: Optional[str] = None) -> Dict[str, Any]:
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
            "average_marks": avg_marks,
            "attendance_percentage": round(float(latest["Attendance_Percentage"]), 2),
            "academic_risk_score": round(float(latest["Academic_Risk_Score"]), 2),
            "risk_level": _risk_level(float(latest["Academic_Risk_Score"])),
        },
    }


def get_student_recommendations(student_id: Optional[str] = None) -> List[Dict[str, Any]]:
    dashboard = get_student_dashboard(student_id)
    metrics = dashboard["latest_metrics"]

    recommendations: List[Dict[str, Any]] = []

    if metrics["attendance_percentage"] < 75:
        recommendations.append(
            {
                "title": "Improve attendance consistency",
                "priority": "high",
                "topic": "Attendance",
                "description": "Your attendance is below 75%. Focus on regular lecture participation.",
            }
        )

    if metrics["average_marks"] < 55:
        recommendations.append(
            {
                "title": "Focus on core subject fundamentals",
                "priority": "high",
                "topic": "Core Concepts",
                "description": "Your average marks are low. Revise current semester core subjects with daily practice.",
            }
        )

    if metrics["cgpa"] < 6.5:
        recommendations.append(
            {
                "title": "Raise CGPA with weekly study goals",
                "priority": "medium",
                "topic": "CGPA Improvement",
                "description": "Target weak subjects first and set weekly improvement goals.",
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "title": "Maintain your current progress",
                "priority": "low",
                "topic": "Performance",
                "description": "Your recent metrics are healthy. Keep consistent effort and attempt advanced practice sets.",
            }
        )

    return recommendations


def get_faculty_students(department: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    master_df = load_dataset("student_master").copy()
    risk_df = load_dataset("cgpa_risk").copy()

    master_df["Student_ID"] = master_df["Student_ID"].astype(str).str.upper().str.strip()
    risk_df["Student_ID"] = risk_df["Student_ID"].astype(str).str.upper().str.strip()

    latest_risk = (
        risk_df.sort_values(by=["Student_ID", "Year", "Semester"])
        .groupby("Student_ID", as_index=False)
        .tail(1)
    )

    merged = master_df.merge(
        latest_risk[["Student_ID", "CGPA", "Attendance_Percentage", "Academic_Risk_Score", "Semester"]],
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
        risk_score = float(row["Academic_Risk_Score"]) if not pd.isna(row["Academic_Risk_Score"]) else 0.0
        rows.append(
            {
                "id": str(row["Student_ID"]),
                "name": f"{row.get('First_Name', '')} {row.get('Last_Name', '')}".strip(),
                "semester": int(row["Semester_risk"] if "Semester_risk" in row and not pd.isna(row["Semester_risk"]) else row["Semester"]),
                "department": str(row["Department"]),
                "attendance": round(float(row["Attendance_Percentage"]), 2) if not pd.isna(row["Attendance_Percentage"]) else None,
                "gpa": round(float(row["CGPA"]), 2) if not pd.isna(row["CGPA"]) else None,
                "risk": _risk_level(risk_score),
            }
        )

    return rows


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
