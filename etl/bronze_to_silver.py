"""
Bronze → Silver  (Cleaned Data Layer)
──────────────────────────────────────
Reads bronze CSVs, cleans / standardises them, and outputs well-structured
student-centric tables into data/silver/.

Transformations
  • Normalise column names (lowercase + underscores)
  • Standardise department names via alias map
  • Parse & convert types (dates, numerics)
  • Remove exact-duplicate rows
  • Handle missing values (fill or flag)
  • Join datasets on student_id where useful
"""

import ast
from pathlib import Path

import numpy as np
import pandas as pd

from etl.utils import (
    BRONZE_DIR,
    SILVER_DIR,
    ensure_dir,
    get_logger,
    normalize_columns,
    normalize_department,
    read_csv_safe,
    save_csv,
)

log = get_logger("bronze_to_silver")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _drop_metadata_cols(df: pd.DataFrame) -> pd.DataFrame:
    """Remove bronze ingestion metadata columns."""
    return df.drop(columns=[c for c in df.columns if c.startswith("_")], errors="ignore")


def _safe_numeric(series: pd.Series) -> pd.Series:
    """Coerce a series to numeric, turning unparseable values to NaN."""
    return pd.to_numeric(series, errors="coerce")


def _parse_list_column(series: pd.Series) -> pd.Series:
    """Parse a string representation of a list into an actual list.
    Handles pipe-delimited (a|b|c), comma-delimited, and Python list literals.
    """
    def _parse(val):
        if pd.isna(val):
            return []
        if isinstance(val, list):
            return val
        s = str(val).strip()
        # Pipe-delimited (most common in this dataset)
        if "|" in s:
            return [x.strip() for x in s.split("|") if x.strip()]
        # Python list literal
        try:
            result = ast.literal_eval(s)
            return result if isinstance(result, list) else [result]
        except (ValueError, SyntaxError):
            pass
        # Comma-delimited fallback
        return [x.strip() for x in s.split(",") if x.strip()]
    return series.apply(_parse)


# ═══════════════════════════════════════════════════════════════════════════════
#  Silver table builders
# ═══════════════════════════════════════════════════════════════════════════════

def build_silver_student_profile(bronze_dir: Path) -> pd.DataFrame:
    """
    silver_student_profile
    ─────────────────────
    Core demographic & enrolment info for every student.
    Source: bronze_student_master + bronze_student_academic
    """
    master = read_csv_safe(bronze_dir / "bronze_student_master.csv")
    academic = read_csv_safe(bronze_dir / "bronze_student_academic.csv")

    for df in (master, academic):
        if df.empty:
            continue
        df.rename(columns=lambda c: c.strip().lower().replace(" ", "_"), inplace=True)

    master = normalize_columns(_drop_metadata_cols(master))
    academic = normalize_columns(_drop_metadata_cols(academic))

    # Start from master, enrich with academic fields if present
    if master.empty and academic.empty:
        log.warning("No source data for silver_student_profile")
        return pd.DataFrame()

    if master.empty:
        profile = academic.copy()
    elif academic.empty:
        profile = master.copy()
    else:
        # Merge on student_id; academic has extra columns we want
        extra_cols = [c for c in academic.columns if c not in master.columns]
        if extra_cols:
            profile = master.merge(
                academic[["student_id"] + extra_cols],
                on="student_id",
                how="left",
            )
        else:
            profile = master.copy()

    # Standardise departments
    if "department" in profile.columns:
        profile["department"] = profile["department"].apply(normalize_department)

    # Type conversions
    for col in ("enrollment_year", "current_year", "semester"):
        if col in profile.columns:
            profile[col] = _safe_numeric(profile[col]).astype("Int64")

    # De-duplicate
    profile.drop_duplicates(subset=["student_id"], keep="last", inplace=True)
    profile.reset_index(drop=True, inplace=True)

    log.info("silver_student_profile: %d students", len(profile))
    return profile


def build_silver_academic_history(bronze_dir: Path) -> pd.DataFrame:
    """
    silver_academic_history
    ──────────────────────
    Per-student CGPA / SGPA / marks / backlog history from the large
    synthetic cgpa-risk dataset.
    """
    df = read_csv_safe(bronze_dir / "bronze_cgpa_risk.csv")
    if df.empty:
        return df
    df = normalize_columns(_drop_metadata_cols(df))

    # Standardise department names
    if "department" in df.columns:
        df["department"] = df["department"].apply(normalize_department)

    # Numeric coercions
    numeric_cols = [
        "year", "semester", "average_marks", "attendance_percentage",
        "study_hours_per_day", "assignment_score", "internal_exam_score",
        "sleep_hours", "internet_usage_hours", "previous_cgpa",
        "backlog_count", "backlog_risk_probability", "academic_risk_score", "cgpa",
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = _safe_numeric(df[col])

    # Remove exact duplicates
    df.drop_duplicates(inplace=True)
    df.reset_index(drop=True, inplace=True)

    log.info("silver_academic_history: %d records", len(df))
    return df


def build_silver_subject_performance(bronze_dir: Path) -> pd.DataFrame:
    """
    silver_subject_performance
    ─────────────────────────
    One row per (student, subject) combining curriculum metadata with marks.
    Explodes the list-encoded subject_codes / marks from the academic dataset.
    """
    academic = read_csv_safe(bronze_dir / "bronze_student_academic.csv")
    curriculum = read_csv_safe(bronze_dir / "bronze_curriculum.csv")

    if academic.empty:
        return pd.DataFrame()

    academic = normalize_columns(_drop_metadata_cols(academic))
    curriculum = normalize_columns(_drop_metadata_cols(curriculum)) if not curriculum.empty else curriculum

    # Explode subject_codes × marks
    if "current_subject_codes" not in academic.columns or "current_subject_marks" not in academic.columns:
        log.warning("Missing subject columns in academic dataset")
        return pd.DataFrame()

    academic["subject_codes_list"] = _parse_list_column(academic["current_subject_codes"])
    academic["subject_marks_list"] = _parse_list_column(academic["current_subject_marks"])

    rows = []
    for _, r in academic.iterrows():
        codes = r["subject_codes_list"]
        marks = r["subject_marks_list"]
        for i, code in enumerate(codes):
            mark = float(marks[i]) if i < len(marks) else np.nan
            rows.append({
                "student_id": r.get("student_id"),
                "department": normalize_department(str(r.get("department", ""))),
                "semester": r.get("semester"),
                "subject_code": str(code).strip(),
                "marks": mark,
            })

    subj_df = pd.DataFrame(rows)

    # Enrich with curriculum (subject name, type)
    if not curriculum.empty and "subject_code" in curriculum.columns:
        subj_df = subj_df.merge(
            curriculum[["subject_code", "subject_name", "subject_type"]].drop_duplicates(),
            on="subject_code",
            how="left",
        )

    subj_df.drop_duplicates(inplace=True)
    subj_df.reset_index(drop=True, inplace=True)

    log.info("silver_subject_performance: %d records", len(subj_df))
    return subj_df


def build_silver_attendance_summary(bronze_dir: Path) -> pd.DataFrame:
    """
    silver_attendance_summary
    ────────────────────────
    Per-student attendance percentages merged from the academic and
    cgpa-risk datasets.
    """
    academic = read_csv_safe(bronze_dir / "bronze_student_academic.csv")
    risk = read_csv_safe(bronze_dir / "bronze_cgpa_risk.csv")

    academic = normalize_columns(_drop_metadata_cols(academic)) if not academic.empty else academic
    risk = normalize_columns(_drop_metadata_cols(risk)) if not risk.empty else risk

    frames = []

    # From enriched academic (real students, single attendance %)
    if not academic.empty and "attendance_percentage" in academic.columns:
        att_real = academic[["student_id", "department", "semester", "attendance_percentage"]].copy()
        att_real["attendance_percentage"] = _safe_numeric(att_real["attendance_percentage"])
        att_real["source"] = "academic"
        if "department" in att_real.columns:
            att_real["department"] = att_real["department"].apply(normalize_department)
        frames.append(att_real)

    # From cgpa-risk (synthetic, per-semester)
    if not risk.empty and "attendance_percentage" in risk.columns:
        att_syn = risk[["student_id", "department", "semester", "attendance_percentage"]].copy()
        att_syn["attendance_percentage"] = _safe_numeric(att_syn["attendance_percentage"])
        att_syn["source"] = "cgpa_risk"
        if "department" in att_syn.columns:
            att_syn["department"] = att_syn["department"].apply(normalize_department)
        frames.append(att_syn)

    if not frames:
        return pd.DataFrame()

    result = pd.concat(frames, ignore_index=True)
    result.drop_duplicates(inplace=True)
    result.reset_index(drop=True, inplace=True)

    log.info("silver_attendance_summary: %d records", len(result))
    return result


def build_silver_career_activity(bronze_dir: Path) -> pd.DataFrame:
    """
    silver_career_activity
    ─────────────────────
    Per-student career readiness indicators from the synthetic career-path
    dataset.
    """
    df = read_csv_safe(bronze_dir / "bronze_career_path.csv")
    if df.empty:
        return df

    df = normalize_columns(_drop_metadata_cols(df))

    if "department" in df.columns:
        df["department"] = df["department"].apply(normalize_department)

    numeric_cols = [
        "year", "cgpa", "programming_skill_level", "core_engineering_skill_level",
        "communication_skill_level", "project_count", "internship_count",
        "hackathon_participation", "research_paper_count", "leadership_activities",
        "study_hours_per_day", "technical_certifications",
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = _safe_numeric(df[col])

    df.drop_duplicates(inplace=True)
    df.reset_index(drop=True, inplace=True)

    log.info("silver_career_activity: %d records", len(df))
    return df


# ── Attendance Daily (per-class records) ─────────────────────────────────────

def build_silver_attendance_daily(bronze_dir: Path) -> pd.DataFrame:
    """
    silver_attendance_daily
    ───────────────────────
    One row per (student, subject, date) attendance record.
    Cleaned & standardised from the raw daily attendance log.
    Source: bronze_attendance_daily
    """
    df = read_csv_safe(bronze_dir / "bronze_attendance_daily.csv")
    if df.empty:
        return df

    df = normalize_columns(_drop_metadata_cols(df))

    # Standardise IDs
    for col in ("student_id", "subject_id", "faculty_id"):
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.upper()

    # Validate status
    if "status" in df.columns:
        df["status"] = df["status"].str.strip().str.lower()
        df = df[df["status"].isin(("present", "absent"))]

    # Parse date
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date.astype(str)
        df = df.dropna(subset=["date"])

    df.drop_duplicates(inplace=True)
    df.reset_index(drop=True, inplace=True)

    log.info("silver_attendance_daily: %d records", len(df))
    return df


# ── Faculty–Subject Mapping ─────────────────────────────────────────────────────

def build_silver_faculty_subject(bronze_dir: Path) -> pd.DataFrame:
    """
    silver_faculty_subject
    ──────────────────────
    One row per faculty–subject assignment.
    Cleaned columns: faculty_id, first_name, last_name, full_name, email, phone,
    department, department_code, qualification, designation, specialization,
    experience_years, joining_year, subject_code, subject_name, subject_type,
    year, semester.
    """
    df = read_csv_safe(bronze_dir / "bronze_faculty_subject.csv")
    if df.empty:
        return df

    df = _drop_metadata_cols(df)
    df = normalize_columns(df)
    df = df.drop_duplicates()

    # Normalise department names
    if "department" in df.columns:
        df["department"] = df["department"].apply(normalize_department)

    # Ensure numeric types
    for col in ("experience_years", "joining_year", "year", "semester"):
        if col in df.columns:
            df[col] = _safe_numeric(df[col])

    # Build a full_name column
    if "first_name" in df.columns and "last_name" in df.columns:
        df["full_name"] = (df["first_name"].str.strip() + " " + df["last_name"].str.strip()).str.strip()

    # Standardise string columns
    for col in ("qualification", "designation", "specialization"):
        if col in df.columns:
            df[col] = df[col].str.strip()

    log.info("silver_faculty_subject: %d rows, %d unique faculty", len(df), df["faculty_id"].nunique())
    return df


# ═══════════════════════════════════════════════════════════════════════════════
#  Orchestrator
# ═══════════════════════════════════════════════════════════════════════════════

def transform_all(bronze_dir: Path | None = None, silver_dir: Path | None = None) -> dict[str, Path]:
    """
    Run all Bronze → Silver transforms and save results.

    Returns a dict of {table_name: output_path}.
    """
    bronze_dir = bronze_dir or BRONZE_DIR
    silver_dir = silver_dir or SILVER_DIR
    ensure_dir(silver_dir)

    builders = {
        "silver_student_profile":      build_silver_student_profile,
        "silver_academic_history":     build_silver_academic_history,
        "silver_subject_performance":  build_silver_subject_performance,
        "silver_attendance_summary":   build_silver_attendance_summary,
        "silver_attendance_daily":     build_silver_attendance_daily,
        "silver_career_activity":      build_silver_career_activity,
        "silver_faculty_subject":      build_silver_faculty_subject,
    }

    outputs: dict[str, Path] = {}
    for name, builder_fn in builders.items():
        df = builder_fn(bronze_dir)
        if df.empty:
            log.warning("Skipping %s — no data produced", name)
            continue
        out = save_csv(df, silver_dir / f"{name}.csv")
        outputs[name] = out

    log.info("Silver transformation complete — %d tables produced", len(outputs))
    return outputs


# ── CLI entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    transform_all()
