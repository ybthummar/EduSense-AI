"""Column normalisation and safe-access helpers for heterogeneous CSV datasets."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

import pandas as pd


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Return a *copy* with snake_case column names."""
    def _snake(name: str) -> str:
        s = re.sub(r"[\s\-\.]+", "_", str(name).strip())
        s = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s)
        return s.lower().rstrip("_")

    df = df.copy()
    df.columns = [_snake(c) for c in df.columns]
    return df


# ---------------------------------------------------------------------------
# Canonical column aliases – map the *normalised* name to a list of
# alternatives that may appear across datasets.
# ---------------------------------------------------------------------------
_ALIASES: Dict[str, List[str]] = {
    "student_id": ["student_id", "studentid", "enrollment_number", "enroll_id"],
    "department": ["department", "dept", "branch"],
    "department_code": ["department_code", "dept_code"],
    "current_year": ["current_year", "year"],
    "semester": ["semester", "sem"],
    "attendance_percentage": [
        "attendance_percentage",
        "attendance",
        "attendance_%",
        "attendance_pct",
    ],
    "previous_sem_sgpa": ["previous_sem_sgpa", "prev_sgpa", "previous_sgpa"],
    "cgpa": ["cgpa", "current_cgpa", "cumulative_gpa"],
    "backlog_count": ["backlog_count", "backlogs", "active_backlogs"],
    "academic_risk_score": ["academic_risk_score", "risk_score"],
    "backlog_risk_probability": [
        "backlog_risk_probability",
        "risk_probability",
        "risk_prob",
    ],
    "stress_level": ["stress_level"],
    "career_path": ["career_path", "predicted_career"],
    "placement_preparedness": [
        "placement_preparedness",
        "placement_score",
        "preparedness",
    ],
    "career_goal_clarity": ["career_goal_clarity", "goal_clarity"],
    "subject_type": ["subject_type", "type"],
    "subject_name": ["subject_name", "course_name", "name"],
    "subject_code": ["subject_code", "course_code", "code"],
}


def resolve_column(df: pd.DataFrame, canonical: str) -> Optional[str]:
    """Return the actual column name in *df* that matches *canonical*, or None."""
    cols_lower = {c.lower(): c for c in df.columns}
    for alias in _ALIASES.get(canonical, [canonical]):
        if alias in cols_lower:
            return cols_lower[alias]
    return None


def safe_get(row: Any, canonical: str, df: pd.DataFrame, default: Any = None) -> Any:
    """Safely get a value from a row using canonical column name."""
    col = resolve_column(df, canonical)
    if col is None:
        return default
    val = row.get(col, default) if isinstance(row, dict) else getattr(row, col, default)
    if pd.isna(val):
        return default
    return val


def has_column(df: pd.DataFrame, canonical: str) -> bool:
    return resolve_column(df, canonical) is not None
