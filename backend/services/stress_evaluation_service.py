"""
Stress Evaluation Engine
========================
Computes a 0-100 stress score for every student in the enriched academic
dataset by combining five weighted factors:

    0.35 × Academic Pressure
  + 0.25 × Attendance Stress
  + 0.20 × Workload Stress
  + 0.20 × Career Uncertainty Stress
  + CGPA Risk Bonus

Each factor is itself 0-100; the final score is clamped to [0, 100].

Design goals
------------
* Pure pandas – no database dependency at import time.
* All column look-ups go through ``utils.column_mapper`` so that minor
  schema drift across dataset versions is handled gracefully.
* Every scoring method can be used standalone or as part of the full
  pipeline via ``run_full_analysis()``.
* The service exposes ``evaluate_student()`` for single-student API
  calls and ``run_full_analysis()`` for batch processing.
"""

from __future__ import annotations

import logging
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from utils.column_mapper import (
    has_column,
    normalize_columns,
    resolve_column,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_SILVER_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "silver"
_GOLD_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "gold"
_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "outputs"

_WEIGHT_ACADEMIC = 0.35
_WEIGHT_ATTENDANCE = 0.25
_WEIGHT_WORKLOAD = 0.20
_WEIGHT_CAREER = 0.20

# Career-path → minimum competitive CGPA for that role
_CAREER_CGPA_THRESHOLDS: Dict[str, float] = {
    "Data Scientist": 8.0,
    "AI Engineer": 8.0,
    "Researcher": 8.5,
    "Software Engineer": 7.0,
    "Cloud Engineer": 7.0,
    "Cybersecurity Analyst": 7.0,
    "Product Manager": 7.5,
    "Robotics Engineer": 7.5,
    "Entrepreneur": 6.5,
    "Core Mechanical Engineer": 6.5,
    "Electrical Engineer": 6.5,
    "Civil Engineer": 6.5,
}
_DEFAULT_CAREER_CGPA = 7.0

# Highly competitive paths that get an extra penalty at low GPA
_COMPETITIVE_PATHS = {"Data Scientist", "AI Engineer", "Researcher", "Product Manager"}

# Subject-name patterns that signal heavy project/practical load
_HEAVY_SUBJECT_PATTERNS = [
    "project", "internship", "capstone", "major project",
    "devops", "industry", "dissertation",
]

# Intervention recommendations per stress category
_INTERVENTIONS = {
    "Low Stress": "Routine monitoring",
    "Moderate Stress": "Faculty check-in recommended",
    "High Stress": "Mentor counseling and academic support needed",
    "Critical Stress": (
        "Immediate intervention, counseling, and performance recovery plan"
    ),
}


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return float(np.clip(value, lo, hi))


# ===================================================================
# Dataset loading helpers
# ===================================================================

def _load_csv(filename: str, data_dir: Path = _SILVER_DIR, **kwargs) -> pd.DataFrame:
    path = data_dir / filename
    if not path.exists():
        logger.warning("Dataset not found: %s", path)
        return pd.DataFrame()
    df = pd.read_csv(path, **kwargs)
    return normalize_columns(df)


def load_datasets(
    data_dir: Optional[Path] = None,
) -> Dict[str, pd.DataFrame]:
    """Load and normalise all source datasets from silver/gold layers.
    Returns a dict keyed by short name."""
    sd = data_dir or _SILVER_DIR
    return {
        "master": _load_csv("silver_student_profile.csv", sd),
        "enriched": _load_csv("silver_student_profile.csv", sd),
        "curriculum": _load_csv("silver_curriculum.csv", sd),
        "cgpa_risk": _load_csv("silver_academic_history.csv", sd),
        "career": _load_csv("silver_career_activity.csv", sd),
    }


# ===================================================================
# Factor 1 – Academic Pressure  (0-100)
# ===================================================================

def calculate_academic_pressure(
    current_sgpa: Optional[float],
    current_cgpa: Optional[float],
    previous_sgpa: Optional[float] = None,
    backlog_count: int = 0,
    avg_marks: Optional[float] = None,
) -> Tuple[float, float]:
    """Return (academic_pressure_score, sgpa_drop).

    ``sgpa_drop`` is how much the SGPA declined vs. previous semester
    (0 if unavailable or not declining).
    """
    gpa = current_sgpa if current_sgpa is not None else current_cgpa
    if gpa is None:
        gpa = 5.0  # safe fallback

    # Base pressure from GPA bracket
    if gpa >= 8.5:
        base = 10.0
    elif gpa >= 7.0:
        base = 30.0
    elif gpa >= 6.0:
        base = 60.0
    elif gpa >= 5.0:
        base = 80.0
    else:
        base = 95.0

    # Trend penalty
    sgpa_drop = 0.0
    if previous_sgpa is not None and current_sgpa is not None:
        sgpa_drop = max(previous_sgpa - current_sgpa, 0.0)
        if sgpa_drop > 1.0:
            base += 15
        elif sgpa_drop > 0.5:
            base += 8

    # Backlog penalty
    if backlog_count >= 3:
        base += 25
    elif backlog_count == 2:
        base += 15
    elif backlog_count == 1:
        base += 8

    # Low marks penalty
    if avg_marks is not None:
        if avg_marks < 40:
            base += 20
        elif avg_marks < 50:
            base += 10

    return _clamp(base), round(sgpa_drop, 2)


# ===================================================================
# Factor 2 – Attendance Stress  (0-100)
# ===================================================================

def calculate_attendance_stress(
    attendance: Optional[float],
    current_sgpa: Optional[float] = None,
) -> float:
    if attendance is None:
        return 50.0  # neutral default

    if attendance >= 85:
        base = 10.0
    elif attendance >= 70:
        base = 40.0
    elif attendance >= 60:
        base = 65.0
    else:
        base = 90.0

    # Combined penalty
    if attendance < 75 and (current_sgpa or 10) < 6.5:
        base += 10

    return _clamp(base)


# ===================================================================
# Factor 3 – Curriculum Workload Stress  (0-100)
# ===================================================================

def calculate_workload_stress(
    num_subjects: int = 6,
    num_labs: int = 0,
    num_electives: int = 0,
    has_heavy_project: bool = False,
    has_devops_or_heavy_lab: bool = False,
) -> Tuple[float, float]:
    """Return (workload_stress, raw_workload_value)."""
    workload_value = num_subjects + (num_labs * 1.5) + (num_electives * 0.5)

    if workload_value >= 10:
        base = 90.0
    elif workload_value >= 8:
        base = 70.0
    elif workload_value >= 6:
        base = 40.0
    else:
        base = 20.0

    if has_heavy_project:
        base += 10
    if has_devops_or_heavy_lab:
        base += 5

    return _clamp(base), round(workload_value, 2)


def _resolve_workload_from_curriculum(
    curriculum_df: pd.DataFrame,
    department: Optional[str],
    semester: Optional[int],
    year: Optional[int],
) -> Tuple[float, float, bool, bool]:
    """Look up the curriculum to determine workload metrics.

    Returns (num_subjects, num_labs, has_heavy_project, has_devops_or_heavy_lab).
    """
    if curriculum_df.empty or department is None:
        return 6, 0, False, False

    dept_col = resolve_column(curriculum_df, "department") or "department"
    sem_col = resolve_column(curriculum_df, "semester") or "semester"
    year_col = resolve_column(curriculum_df, "current_year") or "year"
    type_col = resolve_column(curriculum_df, "subject_type") or "subject_type"
    name_col = resolve_column(curriculum_df, "subject_name") or "subject_name"

    mask = curriculum_df[dept_col].str.lower() == department.lower()
    if sem_col in curriculum_df.columns and semester is not None:
        mask &= curriculum_df[sem_col] == semester
    elif year_col in curriculum_df.columns and year is not None:
        mask &= curriculum_df[year_col] == year

    subset = curriculum_df.loc[mask]
    if subset.empty:
        return 6, 0, False, False

    num_subjects = len(subset)
    num_labs = 0
    if type_col in subset.columns:
        num_labs = int((subset[type_col].str.lower() == "lab").sum())

    has_heavy = False
    has_devops = False
    if name_col in subset.columns:
        names_lower = subset[name_col].str.lower()
        for pat in _HEAVY_SUBJECT_PATTERNS:
            if names_lower.str.contains(pat, na=False).any():
                if pat == "devops":
                    has_devops = True
                else:
                    has_heavy = True

    return num_subjects, num_labs, has_heavy, has_devops


# ===================================================================
# Factor 4 – Career Uncertainty Stress  (0-100)
# ===================================================================

def calculate_career_stress(
    current_cgpa: Optional[float],
    career_path: Optional[str] = None,
    placement_preparedness: Optional[float] = None,
    career_goal_clarity: Optional[str] = None,
) -> Tuple[float, float]:
    """Return (career_stress, required_cgpa)."""
    if current_cgpa is None:
        current_cgpa = 5.0

    required = _CAREER_CGPA_THRESHOLDS.get(career_path or "", _DEFAULT_CAREER_CGPA)
    gap = required - current_cgpa

    if gap <= 0:
        base = 10.0
    elif gap <= 1:
        base = 40.0
    elif gap <= 2:
        base = 70.0
    else:
        base = 90.0

    # Extra penalty for competitive path + weak GPA
    if isinstance(career_path, str) and career_path in _COMPETITIVE_PATHS and current_cgpa < required:
        base += 10

    # Unclear career adds uncertainty
    if career_goal_clarity and isinstance(career_goal_clarity, str) and career_goal_clarity.lower() == "low":
        base += 5

    return _clamp(base), round(required, 2)


# ===================================================================
# Factor 5 – CGPA Risk Bonus  (0-30)
# ===================================================================

def calculate_risk_bonus(
    academic_risk_score: Optional[float] = None,
    backlog_risk_probability: Optional[float] = None,
    stress_level: Optional[str] = None,
) -> float:
    """Return an additive bonus (0-30) based on risk indicators."""
    bonus = 0.0

    # Label-based bonus
    if stress_level and isinstance(stress_level, str):
        label = stress_level.strip().lower()
        if label == "high":
            bonus = 30.0
        elif label == "medium":
            bonus = 15.0
        else:
            bonus = 5.0
    elif backlog_risk_probability is not None:
        bonus = min(backlog_risk_probability * 60, 30.0)  # scale [0-0.5]→[0-30]
    elif academic_risk_score is not None:
        bonus = min(academic_risk_score / 100 * 30, 30.0)

    return round(_clamp(bonus, 0, 30), 2)


# ===================================================================
# Stress label + reason generation
# ===================================================================

def classify_stress(score: float) -> str:
    if score <= 25:
        return "Low Stress"
    elif score <= 50:
        return "Moderate Stress"
    elif score <= 75:
        return "High Stress"
    else:
        return "Critical Stress"


def generate_stress_reason(
    academic: float,
    attendance: float,
    workload: float,
    career: float,
    risk_bonus: float,
    attendance_pct: Optional[float] = None,
    sgpa_drop: float = 0.0,
    backlog_count: int = 0,
) -> Tuple[str, List[str]]:
    """Return (human_readable_reason, ranked_contributor_list)."""
    factors = {
        "academic": academic,
        "attendance": attendance,
        "workload": workload,
        "career": career,
    }
    ranked = sorted(factors, key=factors.get, reverse=True)

    parts: List[str] = []
    if academic >= 60:
        detail = "declining SGPA" if sgpa_drop > 0.5 else "low GPA"
        if backlog_count:
            detail += f" with {backlog_count} backlog(s)"
        parts.append(detail)
    if attendance >= 50:
        if attendance_pct is not None:
            parts.append(f"attendance at {attendance_pct:.0f}%")
        else:
            parts.append("low attendance")
    if workload >= 60:
        parts.append("workload-heavy semester")
    if career >= 50:
        parts.append("career readiness gap")
    if risk_bonus >= 20:
        parts.append("high CGPA risk")

    final_label = classify_stress(
        _WEIGHT_ACADEMIC * academic
        + _WEIGHT_ATTENDANCE * attendance
        + _WEIGHT_WORKLOAD * workload
        + _WEIGHT_CAREER * career
        + risk_bonus,
    )
    severity = final_label.split()[0]  # "Low" / "Moderate" / "High" / "Critical"

    if parts:
        reason = f"{severity} stress driven mainly by {', '.join(parts[:-1])}" \
                 + (f" and {parts[-1]}" if len(parts) > 1 else f" {parts[0]}") + "."
    else:
        reason = f"{severity} stress — academic indicators are within healthy range."

    return reason, ranked


def intervention_suggestion(stress_level: str) -> str:
    return _INTERVENTIONS.get(stress_level, "Routine monitoring")


def alert_flag(stress_score: float) -> bool:
    """Flag students at or above Critical threshold."""
    return stress_score > 75


# ===================================================================
# Main Service Class
# ===================================================================

class StressEvaluationService:
    """Stateful wrapper that loads datasets once and exposes both
    single-student and batch evaluation methods."""

    def __init__(self, data_dir: Optional[Path] = None):
        self._data_dir = data_dir or _SILVER_DIR
        self._datasets: Dict[str, pd.DataFrame] = {}
        self._merged: Optional[pd.DataFrame] = None
        self._results: Optional[pd.DataFrame] = None

    # ---- lifecycle ------------------------------------------------

    def load_datasets(self) -> None:
        self._datasets = load_datasets(self._data_dir)
        for name, df in self._datasets.items():
            if df.empty:
                logger.warning("Dataset '%s' is empty or missing.", name)
            else:
                logger.info("Loaded %s: %d rows, %d cols", name, len(df), len(df.columns))

    def _ensure_loaded(self) -> None:
        if not self._datasets:
            self.load_datasets()

    # ---- data prep ------------------------------------------------

    def preprocess(self) -> None:
        self._ensure_loaded()
        # nothing heavy for now — normalisation already done in loader

    def merge_student_data(self) -> pd.DataFrame:
        """Build a single student-level frame from enriched + risk + career.

        The enriched dataset is the primary source (real student IDs like
        23CE001).  CGPA-risk and career datasets use synthetic STU… IDs so
        they are joined by (department, year) to enrich with aggregate risk
        and career info.
        """
        self._ensure_loaded()
        enriched = self._datasets["enriched"].copy()
        if enriched.empty:
            logger.error("Enriched dataset is empty — cannot evaluate stress.")
            return enriched

        # --- parse pipe-delimited subject marks into avg_marks ---------
        marks_col = resolve_column(enriched, "current_subject_marks") or next(
            (c for c in enriched.columns if "marks" in c.lower()), None
        )
        if marks_col:
            def _avg_marks(val):
                if pd.isna(val):
                    return None
                try:
                    nums = [float(x) for x in str(val).split("|") if x.strip()]
                    return round(sum(nums) / len(nums), 2) if nums else None
                except ValueError:
                    return None
            enriched["avg_marks"] = enriched[marks_col].apply(_avg_marks)

        # --- merge risk data (latest semester per student by dept) ------
        risk_df = self._datasets["cgpa_risk"]
        if not risk_df.empty:
            # Take the latest row per student in the risk dataset
            risk_sort = resolve_column(risk_df, "semester") or "semester"
            risk_latest = (
                risk_df.sort_values(risk_sort, ascending=False)
                .drop_duplicates(subset=[resolve_column(risk_df, "student_id") or "student_id"])
            )
            # Since ID spaces differ, join on (department, year)
            dept_r = resolve_column(risk_latest, "department") or "department"
            year_r = resolve_column(risk_latest, "current_year") or "year"
            dept_e = resolve_column(enriched, "department") or "department"
            year_e = resolve_column(enriched, "current_year") or "current_year"

            risk_agg = (
                risk_latest.groupby([dept_r, year_r])
                .agg(
                    risk_academic_risk_score=(
                        resolve_column(risk_latest, "academic_risk_score") or "academic_risk_score",
                        "mean",
                    ),
                    risk_backlog_risk_probability=(
                        resolve_column(risk_latest, "backlog_risk_probability") or "backlog_risk_probability",
                        "mean",
                    ),
                    risk_backlog_count=(
                        resolve_column(risk_latest, "backlog_count") or "backlog_count",
                        "mean",
                    ),
                    risk_stress_level=(
                        resolve_column(risk_latest, "stress_level") or "stress_level",
                        lambda x: x.mode().iloc[0] if len(x) else "Low",
                    ),
                    risk_cgpa=(
                        resolve_column(risk_latest, "cgpa") or "cgpa",
                        "mean",
                    ),
                )
                .reset_index()
            )
            risk_agg.rename(columns={dept_r: "_dept", year_r: "_year"}, inplace=True)

            enriched = enriched.merge(
                risk_agg,
                left_on=[dept_e, year_e],
                right_on=["_dept", "_year"],
                how="left",
            )
            enriched.drop(columns=["_dept", "_year"], errors="ignore", inplace=True)

        # --- merge career data (aggregate by dept+year) ----------------
        career_df = self._datasets["career"]
        if not career_df.empty:
            dept_c = resolve_column(career_df, "department") or "department"
            year_c = resolve_column(career_df, "current_year") or "year"
            cgpa_c = resolve_column(career_df, "cgpa") or "cgpa"
            career_col = resolve_column(career_df, "career_path") or "career_path"
            prep_col = resolve_column(career_df, "placement_preparedness") or "placement_preparedness"
            clarity_col = resolve_column(career_df, "career_goal_clarity") or "career_goal_clarity"

            career_agg = (
                career_df.groupby([dept_c, year_c])
                .agg(
                    career_path=(career_col, lambda x: x.mode().iloc[0] if len(x) else None),
                    career_placement_preparedness=(prep_col, "mean"),
                    career_goal_clarity=(clarity_col, lambda x: x.mode().iloc[0] if len(x) else "Medium"),
                    career_cgpa=(cgpa_c, "mean"),
                )
                .reset_index()
            )
            career_agg.rename(columns={dept_c: "_dept", year_c: "_year"}, inplace=True)

            dept_e = resolve_column(enriched, "department") or "department"
            year_e = resolve_column(enriched, "current_year") or "current_year"

            enriched = enriched.merge(
                career_agg,
                left_on=[dept_e, year_e],
                right_on=["_dept", "_year"],
                how="left",
            )
            enriched.drop(columns=["_dept", "_year"], errors="ignore", inplace=True)

        self._merged = enriched
        return enriched

    # ---- single-student evaluation --------------------------------

    def evaluate_student(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Score one student given a flat dict of their merged data.

        Returns a dict with all factor scores, final score, label, reason,
        and intervention fields.
        """
        self._ensure_loaded()
        curriculum_df = self._datasets.get("curriculum", pd.DataFrame())

        # --- extract values with safe defaults -------------------------
        student_id = row.get("student_id", "")
        first_name = row.get("first_name", "")
        last_name = row.get("last_name", "")
        department = row.get("department", "")
        current_year = _safe_int(row.get("current_year"))
        semester = _safe_int(row.get("semester"))

        prev_sgpa = _safe_float(row.get("previous_sem_sgpa"))
        # Compute current SGPA from avg marks if not directly available
        avg_marks = _safe_float(row.get("avg_marks"))
        current_sgpa = prev_sgpa  # best proxy from enriched dataset
        current_cgpa = _safe_float(row.get("risk_cgpa")) or _safe_float(row.get("cgpa"))
        if current_cgpa is None and avg_marks is not None:
            current_cgpa = round(avg_marks / 10, 2)  # rough approx

        attendance = _safe_float(row.get("attendance_percentage"))
        backlog_count = _safe_int(row.get("risk_backlog_count")) or 0

        # --- Factor 1: Academic Pressure -------------------------------
        academic_pressure, sgpa_drop = calculate_academic_pressure(
            current_sgpa=current_sgpa,
            current_cgpa=current_cgpa,
            previous_sgpa=prev_sgpa,
            backlog_count=backlog_count,
            avg_marks=avg_marks,
        )

        # --- Factor 2: Attendance Stress --------------------------------
        attendance_stress = calculate_attendance_stress(attendance, current_sgpa)

        # --- Factor 3: Workload Stress ----------------------------------
        n_subj, n_labs, heavy, devops = _resolve_workload_from_curriculum(
            curriculum_df, department, semester, current_year,
        )
        workload_stress, workload_value = calculate_workload_stress(
            num_subjects=n_subj,
            num_labs=n_labs,
            has_heavy_project=heavy,
            has_devops_or_heavy_lab=devops,
        )

        # --- Factor 4: Career Stress ------------------------------------
        career_path = row.get("career_path")
        placement_prep = _safe_float(row.get("career_placement_preparedness"))
        goal_clarity = row.get("career_goal_clarity")
        career_stress, required_cgpa = calculate_career_stress(
            current_cgpa=current_cgpa,
            career_path=career_path,
            placement_preparedness=placement_prep,
            career_goal_clarity=goal_clarity,
        )

        # --- Factor 5: Risk Bonus ----------------------------------------
        risk_bonus = calculate_risk_bonus(
            academic_risk_score=_safe_float(row.get("risk_academic_risk_score")),
            backlog_risk_probability=_safe_float(row.get("risk_backlog_risk_probability")),
            stress_level=row.get("risk_stress_level"),
        )

        # --- Final score --------------------------------------------------
        final_score = _clamp(
            _WEIGHT_ACADEMIC * academic_pressure
            + _WEIGHT_ATTENDANCE * attendance_stress
            + _WEIGHT_WORKLOAD * workload_stress
            + _WEIGHT_CAREER * career_stress
            + risk_bonus
        )
        stress_level = classify_stress(final_score)
        reason, contributors = generate_stress_reason(
            academic_pressure, attendance_stress, workload_stress,
            career_stress, risk_bonus,
            attendance_pct=attendance,
            sgpa_drop=sgpa_drop,
            backlog_count=backlog_count,
        )

        return {
            "student_id": student_id,
            "first_name": first_name,
            "last_name": last_name,
            "department": department,
            "current_year": current_year,
            "semester": semester,
            "current_cgpa": current_cgpa,
            "current_sgpa": current_sgpa,
            "attendance": attendance,
            "academic_pressure_score": round(academic_pressure, 2),
            "attendance_stress_score": round(attendance_stress, 2),
            "workload_stress_score": round(workload_stress, 2),
            "career_stress_score": round(career_stress, 2),
            "cgpa_risk_bonus": risk_bonus,
            "final_stress_score": round(final_score, 2),
            "stress_level": stress_level,
            "stress_reason": reason,
            "top_contributors": contributors,
            "backlog_count": backlog_count,
            "sgpa_drop": sgpa_drop,
            "workload_value": workload_value,
            "required_cgpa": required_cgpa,
            "career_path": career_path,
            "intervention": intervention_suggestion(stress_level),
            "alert_flag": alert_flag(final_score),
        }

    # ---- batch pipeline --------------------------------------------

    def run_full_analysis(self) -> pd.DataFrame:
        """End-to-end: load → merge → score every student → DataFrame."""
        if self._merged is None:
            self.preprocess()
            self.merge_student_data()

        if self._merged is None or self._merged.empty:
            logger.error("No merged data available for analysis.")
            self._results = pd.DataFrame()
            return self._results

        records: List[Dict[str, Any]] = []
        for _, row in self._merged.iterrows():
            records.append(self.evaluate_student(row.to_dict()))

        self._results = pd.DataFrame(records)
        return self._results

    def export_results(self, path: Optional[Path] = None) -> Path:
        """Write results CSV. Returns the path written to."""
        if self._results is None:
            self.run_full_analysis()
        out = path or (_OUTPUT_DIR / "stress_evaluation_results.csv")
        out.parent.mkdir(parents=True, exist_ok=True)
        self._results.to_csv(out, index=False)
        logger.info("Exported %d rows to %s", len(self._results), out)
        return out

    # ---- convenience accessors ------------------------------------

    @property
    def results(self) -> Optional[pd.DataFrame]:
        return self._results

    def get_student_result(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Look up a single student from cached results (or evaluate on the
        fly if the batch has already been merged)."""
        if self._results is not None:
            match = self._results[self._results["student_id"] == student_id]
            if not match.empty:
                return match.iloc[0].to_dict()

        # Fall back to live evaluation from merged data
        if self._merged is not None:
            sid_col = resolve_column(self._merged, "student_id") or "student_id"
            match = self._merged[self._merged[sid_col] == student_id]
            if not match.empty:
                return self.evaluate_student(match.iloc[0].to_dict())

        return None


# ===================================================================
# Helpers
# ===================================================================

def _safe_float(val: Any) -> Optional[float]:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def _safe_int(val: Any) -> Optional[int]:
    if val is None:
        return None
    try:
        return int(float(val))
    except (TypeError, ValueError):
        return None


# ===================================================================
# CLI entry-point for standalone testing
# ===================================================================

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    svc = StressEvaluationService()
    svc.load_datasets()
    svc.preprocess()
    svc.merge_student_data()
    results = svc.run_full_analysis()

    print(f"\n{'='*70}")
    print(f"  Stress Evaluation Complete — {len(results)} students analysed")
    print(f"{'='*70}")
    print(results[["student_id", "department", "final_stress_score", "stress_level"]].to_string(index=False))
    print()
    print("Distribution:")
    print(results["stress_level"].value_counts().to_string())
    print()

    out = svc.export_results()
    print(f"Results exported to: {out}")
