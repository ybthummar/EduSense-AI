"""
Silver → Gold  (Star Schema – Dimensional Model)
─────────────────────────────────────────────────
Reads cleaned Silver tables and produces a Star-Schema dimensional model
in data/gold/ with 4 dimension tables and 3 fact tables.

Dimension tables
  • dim_student    – student demographic attributes
  • dim_subject    – curriculum/subject attributes
  • dim_faculty    – faculty attributes
  • dim_semester   – semester/time dimension

Fact tables
  • fact_student_performance  – per-student, per-subject performance metrics
  • fact_student_attendance   – per-student attendance metrics
  • fact_career_activity      – per-student career readiness indicators
"""

from pathlib import Path

import numpy as np
import pandas as pd

from etl.utils import (
    GOLD_DIR,
    SILVER_DIR,
    ensure_dir,
    get_logger,
    read_csv_safe,
    save_csv,
)

log = get_logger("silver_to_gold")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _safe_numeric(ser: pd.Series) -> pd.Series:
    return pd.to_numeric(ser, errors="coerce")


def _make_semester_id(semester) -> str | None:
    if pd.isna(semester):
        return None
    return f"SEM-{int(semester)}"


# ═══════════════════════════════════════════════════════════════════════════════
#  Dimension table builders
# ═══════════════════════════════════════════════════════════════════════════════

def build_dim_student(silver_dir: Path) -> pd.DataFrame:
    """
    dim_student
    ───────────
    One row per student with demographic attributes.
    Source: silver_student_profile
    PK: student_id
    """
    profile = read_csv_safe(silver_dir / "silver_student_profile.csv")
    if profile.empty:
        return pd.DataFrame()

    cols = [
        "student_id", "first_name", "last_name", "gender", "city", "state",
        "department", "department_code", "admission_type", "enrollment_year",
        "current_year", "status",
    ]
    available = [c for c in cols if c in profile.columns]
    dim = profile[available].copy()
    dim = dim.drop_duplicates(subset=["student_id"]).reset_index(drop=True)

    log.info("dim_student: %d students", len(dim))
    return dim


def build_dim_subject(silver_dir: Path) -> pd.DataFrame:
    """
    dim_subject
    ───────────
    One row per subject in the curriculum.
    Source: silver_curriculum
    PK: subject_id (= subject_code)
    """
    curriculum = read_csv_safe(silver_dir / "silver_curriculum.csv")
    if curriculum.empty:
        return pd.DataFrame()

    dim = curriculum.copy()
    dim = dim.rename(columns={"subject_code": "subject_id"})

    if "credits" not in dim.columns:
        dim["credits"] = dim["subject_type"].apply(
            lambda x: 3 if str(x).lower() in ("elective", "open_elective") else 4
        )

    out_cols = ["subject_id", "subject_name", "department", "semester", "credits", "subject_type"]
    available = [c for c in out_cols if c in dim.columns]
    dim = dim[available].drop_duplicates(subset=["subject_id"]).reset_index(drop=True)

    log.info("dim_subject: %d subjects", len(dim))
    return dim


def build_dim_faculty(silver_dir: Path) -> pd.DataFrame:
    """
    dim_faculty
    ───────────
    One row per faculty member.
    Source: silver_faculty_subject (deduplicated by faculty_id)
    PK: faculty_id
    """
    fac = read_csv_safe(silver_dir / "silver_faculty_subject.csv")
    if fac.empty:
        return pd.DataFrame()

    if "full_name" in fac.columns:
        fac["faculty_name"] = fac["full_name"]
    else:
        fac["faculty_name"] = (
            fac.get("first_name", pd.Series(dtype=str)).astype(str)
            + " "
            + fac.get("last_name", pd.Series(dtype=str)).astype(str)
        ).str.strip()

    cols = ["faculty_id", "faculty_name", "department", "designation", "experience_years"]
    available = [c for c in cols if c in fac.columns]
    dim = fac[available].drop_duplicates(subset=["faculty_id"]).reset_index(drop=True)

    if "experience_years" in dim.columns:
        dim["experience_years"] = _safe_numeric(dim["experience_years"])

    log.info("dim_faculty: %d faculty members", len(dim))
    return dim


def build_dim_semester(silver_dir: Path) -> pd.DataFrame:
    """
    dim_semester
    ────────────
    One row per (year, semester) combination.
    Derived from silver_academic_history.
    PK: semester_id (e.g., "SEM-1")
    """
    hist = read_csv_safe(silver_dir / "silver_academic_history.csv")
    if hist.empty:
        return pd.DataFrame()

    combos = hist[["year", "semester"]].drop_duplicates().copy()
    combos["year"] = _safe_numeric(combos["year"]).astype(int)
    combos["semester"] = _safe_numeric(combos["semester"]).astype(int)
    combos = combos.sort_values(["year", "semester"]).reset_index(drop=True)

    dim = pd.DataFrame({
        "semester_id": combos["semester"].apply(_make_semester_id),
        "semester_number": combos["semester"],
        "academic_year": combos["year"].apply(lambda y: f"Year {y}"),
        "term": combos["semester"].apply(lambda s: "Odd" if s % 2 == 1 else "Even"),
    })

    log.info("dim_semester: %d semesters", len(dim))
    return dim


# ═══════════════════════════════════════════════════════════════════════════════
#  Fact table builders
# ═══════════════════════════════════════════════════════════════════════════════

def build_fact_student_performance(silver_dir: Path) -> pd.DataFrame:
    """
    fact_student_performance
    ────────────────────────
    One row per (student, subject, semester) with performance metrics.
    Sources: silver_subject_performance + silver_academic_history + silver_faculty_subject
    """
    subj = read_csv_safe(silver_dir / "silver_subject_performance.csv")
    hist = read_csv_safe(silver_dir / "silver_academic_history.csv")
    fac = read_csv_safe(silver_dir / "silver_faculty_subject.csv")

    if subj.empty:
        return pd.DataFrame()

    subj["marks"] = _safe_numeric(subj["marks"])
    fact = subj.rename(columns={"subject_code": "subject_id"}).copy()

    # Join faculty_id from faculty-subject mapping (on subject_id + department)
    if not fac.empty and "subject_code" in fac.columns:
        fac_map = fac[["subject_code", "department", "faculty_id"]].drop_duplicates(
            subset=["subject_code", "department"],
        )
        fac_map = fac_map.rename(columns={"subject_code": "subject_id"})
        fact = fact.merge(fac_map, on=["subject_id", "department"], how="left")
    else:
        fact["faculty_id"] = None

    # Generate semester_id
    fact["semester_id"] = fact["semester"].apply(_make_semester_id)

    # Join semester-level metrics from academic_history
    if not hist.empty:
        for c in ("internal_exam_score", "attendance_percentage", "cgpa"):
            if c in hist.columns:
                hist[c] = _safe_numeric(hist[c])

        hist_cols = ["student_id", "semester"]
        for c in ("internal_exam_score", "attendance_percentage", "cgpa"):
            if c in hist.columns:
                hist_cols.append(c)

        hist_dedup = hist[hist_cols].drop_duplicates(subset=["student_id", "semester"])
        fact = fact.merge(hist_dedup, on=["student_id", "semester"], how="left")

    # Build final columns
    fact["total_marks"] = fact["marks"]
    fact["internal_marks"] = fact.get("internal_exam_score", pd.Series(dtype=float))
    fact["external_marks"] = (fact["total_marks"] - fact["internal_marks"].fillna(0)).clip(lower=0)
    fact["attendance_percent"] = fact.get("attendance_percentage", pd.Series(dtype=float))
    fact["sgpa"] = fact.get("cgpa", pd.Series(dtype=float))
    fact["result_status"] = fact["total_marks"].apply(
        lambda m: "Pass" if pd.notna(m) and m >= 40 else ("Fail" if pd.notna(m) else None)
    )

    output_cols = [
        "student_id", "subject_id", "faculty_id", "semester_id",
        "internal_marks", "external_marks", "total_marks",
        "attendance_percent", "sgpa", "result_status",
    ]
    available = [c for c in output_cols if c in fact.columns]
    fact = fact[available].round(2)

    log.info("fact_student_performance: %d rows", len(fact))
    return fact


def build_fact_student_attendance(silver_dir: Path) -> pd.DataFrame:
    """
    fact_student_attendance
    ───────────────────────
    One row per (student, subject, semester) with attendance metrics.
    Sources: silver_attendance_daily (primary) + silver_attendance_summary (fallback)
    """
    daily = read_csv_safe(silver_dir / "silver_attendance_daily.csv")
    att = read_csv_safe(silver_dir / "silver_attendance_summary.csv")

    frames = []

    # ── Build from daily attendance records (preferred) ─────────────────────
    if not daily.empty:
        # Map students to semesters via dim_student
        dim_stu = read_csv_safe(silver_dir.parent / "gold" / "dim_student.csv")
        stu_sem_map = {}
        if not dim_stu.empty and "current_year" in dim_stu.columns:
            for _, r in dim_stu.iterrows():
                yr = _safe_numeric(pd.Series([r.get("current_year")])).iloc[0]
                if pd.notna(yr):
                    stu_sem_map[str(r["student_id"])] = f"SEM-{int(yr) * 2}"

        # Map subjects to semesters via dim_subject
        dim_subj = read_csv_safe(silver_dir.parent / "gold" / "dim_subject.csv")
        subj_sem_map = {}
        if not dim_subj.empty and "semester" in dim_subj.columns:
            for _, r in dim_subj.iterrows():
                sm = _safe_numeric(pd.Series([r.get("semester")])).iloc[0]
                if pd.notna(sm):
                    subj_sem_map[str(r["subject_id"])] = f"SEM-{int(sm)}"

        daily["student_id"] = daily["student_id"].astype(str).str.strip().str.upper()
        daily["subject_id"] = daily["subject_id"].astype(str).str.strip().str.upper()

        # Group by (student, subject) → calculate attendance
        grouped = daily.groupby(["student_id", "subject_id"]).agg(
            total_classes=("status", "count"),
            classes_attended=("status", lambda x: (x == "present").sum()),
        ).reset_index()

        grouped["attendance_percent"] = (
            grouped["classes_attended"] / grouped["total_classes"] * 100
        ).round(2)

        # Assign semester_id: prefer subject's semester, fallback to student's
        grouped["semester_id"] = grouped.apply(
            lambda r: subj_sem_map.get(r["subject_id"],
                      stu_sem_map.get(r["student_id"], "SEM-2")),
            axis=1,
        )

        frames.append(grouped[["student_id", "subject_id", "semester_id",
                                "attendance_percent", "total_classes", "classes_attended"]])

    # ── Fallback: aggregate attendance summary (legacy) ────────────────────
    if not att.empty:
        att["attendance_percentage"] = _safe_numeric(att["attendance_percentage"])
        att["semester"] = _safe_numeric(att["semester"])

        legacy = att.copy()
        legacy["semester_id"] = legacy["semester"].apply(_make_semester_id)
        legacy["attendance_percent"] = legacy["attendance_percentage"]
        legacy["total_classes"] = 45
        legacy["classes_attended"] = (
            legacy["attendance_percent"].fillna(0) / 100 * 45
        ).round(0).astype(int)
        legacy["subject_id"] = None

        frames.append(legacy[["student_id", "subject_id", "semester_id",
                               "attendance_percent", "total_classes", "classes_attended"]])

    if not frames:
        return pd.DataFrame()

    fact = pd.concat(frames, ignore_index=True)
    fact = fact.round(2)

    log.info("fact_student_attendance: %d rows", len(fact))
    return fact


def build_fact_career_activity(silver_dir: Path) -> pd.DataFrame:
    """
    fact_career_activity
    ────────────────────
    One row per student with career readiness indicators.
    Sources: silver_career_activity + silver_student_profile
    """
    career = read_csv_safe(silver_dir / "silver_career_activity.csv")
    profile = read_csv_safe(silver_dir / "silver_student_profile.csv")

    if career.empty:
        return pd.DataFrame()

    career["year"] = _safe_numeric(career["year"])
    # Derive semester_id from year (use the last semester in that year: year * 2)
    career["semester"] = career["year"].apply(lambda y: int(y) * 2 if pd.notna(y) else None)
    career["semester_id"] = career["semester"].apply(_make_semester_id)

    # internship_completed from internship_count
    career["internship_completed"] = _safe_numeric(
        career.get("internship_count", pd.Series(dtype=float))
    ).fillna(0).astype(int)

    # certification_count from technical_certifications
    career["certification_count"] = _safe_numeric(
        career.get("technical_certifications", pd.Series(dtype=float))
    ).fillna(0).astype(int)

    # Status/level → numeric score mapping for profile-based columns
    status_score_map = {
        "completed": 100, "in progress": 60, "not started": 0,
        "yes": 100, "no": 0,
        "high": 90, "medium": 60, "low": 30,
    }

    # Join profile data for project/devops/extracurricular scores
    if not profile.empty:
        profile["student_id"] = profile["student_id"].astype(str).str.upper().str.strip()
        career["student_id"] = career["student_id"].astype(str).str.upper().str.strip()

        profile_cols = ["student_id"]
        score_mapping = {}
        if "project_phase_ii_status" in profile.columns:
            profile_cols.append("project_phase_ii_status")
            score_mapping["project_phase_ii_status"] = "project_phase_ii_score"
        if "devops_engineering_status" in profile.columns:
            profile_cols.append("devops_engineering_status")
            score_mapping["devops_engineering_status"] = "devops_engineering_score"
        if "extracurricular_level" in profile.columns:
            profile_cols.append("extracurricular_level")
            score_mapping["extracurricular_level"] = "extracurricular_score"

        if len(profile_cols) > 1:
            prof_dedup = profile[profile_cols].drop_duplicates(subset=["student_id"])
            career = career.merge(prof_dedup, on="student_id", how="left")

        for src_col, tgt_col in score_mapping.items():
            if src_col in career.columns:
                career[tgt_col] = (
                    career[src_col].astype(str).str.lower().str.strip()
                    .map(status_score_map).fillna(0)
                )

    output_cols = [
        "student_id", "semester_id",
        "internship_completed", "project_phase_ii_score",
        "devops_engineering_score", "extracurricular_score", "certification_count",
    ]
    available = [c for c in output_cols if c in career.columns]
    fact = career[available].round(2)

    log.info("fact_career_activity: %d rows", len(fact))
    return fact


# ═══════════════════════════════════════════════════════════════════════════════
#  Orchestrator
# ═══════════════════════════════════════════════════════════════════════════════

def aggregate_all(silver_dir: Path | None = None, gold_dir: Path | None = None) -> dict[str, Path]:
    """
    Run all Silver → Gold aggregations and save results.

    Returns a dict of {table_name: output_path}.
    """
    silver_dir = silver_dir or SILVER_DIR
    gold_dir = gold_dir or GOLD_DIR
    ensure_dir(gold_dir)

    builders = {
        # Dimensions
        "dim_student":               build_dim_student,
        "dim_subject":               build_dim_subject,
        "dim_faculty":               build_dim_faculty,
        "dim_semester":              build_dim_semester,
        # Facts
        "fact_student_performance":  build_fact_student_performance,
        "fact_student_attendance":   build_fact_student_attendance,
        "fact_career_activity":      build_fact_career_activity,
    }

    outputs: dict[str, Path] = {}
    for name, builder_fn in builders.items():
        df = builder_fn(silver_dir)
        if df.empty:
            log.warning("Skipping %s — no data produced", name)
            continue
        out = save_csv(df, gold_dir / f"{name}.csv")
        outputs[name] = out

    log.info("Gold aggregation complete — %d tables produced", len(outputs))
    return outputs


# ── CLI entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    aggregate_all()
