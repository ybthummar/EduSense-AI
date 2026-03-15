"""
RAG Document Builder
────────────────────
Converts gold-layer CSV analytics into natural-language documents
that can be embedded and searched via FAISS.

Entity types produced:
  • student_profile        – per-student summary (risk, GPA, attendance)
  • subject_analytics      – per-subject difficulty / pass-rate summary
  • faculty_summary        – per-faculty teaching load & performance
  • department_overview    – department-level aggregates
  • career_readiness       – per-student career metrics
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

GOLD_DIR = Path(__file__).resolve().parents[3] / "data" / "gold"


def _safe_read(filename: str) -> pd.DataFrame:
    path = GOLD_DIR / filename
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


# ─── Document Generators ───────────────────────────────────────

def _build_student_profiles() -> List[Dict[str, Any]]:
    """One document per student: demographics + performance + attendance + risk."""
    students = _safe_read("dim_student.csv")
    perf = _safe_read("fact_student_performance.csv")
    att = _safe_read("fact_student_attendance.csv")

    if students.empty:
        return []

    docs = []
    for _, s in students.iterrows():
        sid = s["student_id"]
        name = f"{s.get('first_name', '')} {s.get('last_name', '')}".strip()
        dept = s.get("department", "Unknown")
        dept_code = s.get("department_code", "")
        year = s.get("current_year", "?")
        status = s.get("status", "Active")

        # Performance stats
        sp = perf[perf["student_id"] == sid] if not perf.empty else pd.DataFrame()
        avg_marks = round(sp["total_marks"].mean(), 1) if not sp.empty and "total_marks" in sp.columns else None
        sgpa = round(sp["sgpa"].dropna().mean(), 2) if not sp.empty and "sgpa" in sp.columns and not sp["sgpa"].dropna().empty else None
        subjects_taken = len(sp) if not sp.empty else 0
        pass_rate = round((sp["result_status"].str.lower() == "pass").mean() * 100, 1) if not sp.empty and "result_status" in sp.columns else None

        # Attendance stats
        sa = att[att["student_id"] == sid] if not att.empty else pd.DataFrame()
        avg_att = round(sa["attendance_percent"].mean(), 1) if not sa.empty and "attendance_percent" in sa.columns and not sa["attendance_percent"].dropna().empty else None

        # Risk calculation
        risk_score = 0
        if avg_marks is not None:
            if avg_marks < 40: risk_score += 50
            elif avg_marks < 50: risk_score += 30
            elif avg_marks < 60: risk_score += 15
        if avg_att is not None:
            if avg_att < 75: risk_score += 30
            elif avg_att < 85: risk_score += 10
        risk_level = "Critical" if risk_score >= 75 else "High" if risk_score >= 60 else "Medium" if risk_score >= 40 else "Low"

        lines = [
            f"Student {sid} ({name}) — {dept} ({dept_code}), Year {year}, Status: {status}.",
        ]
        if avg_marks is not None:
            lines.append(f"Average marks: {avg_marks}/100 across {subjects_taken} subjects.")
        if sgpa is not None:
            lines.append(f"Average SGPA: {sgpa}.")
        if pass_rate is not None:
            lines.append(f"Subject pass rate: {pass_rate}%.")
        if avg_att is not None:
            lines.append(f"Average attendance: {avg_att}%.")
        lines.append(f"Academic risk level: {risk_level} (score {risk_score}).")

        # Weak subjects
        if not sp.empty and "total_marks" in sp.columns and "subject_id" in sp.columns:
            weak = sp[sp["total_marks"] < 50][["subject_id", "total_marks"]].values.tolist()
            if weak:
                weak_str = ", ".join(f"{sub} ({marks})" for sub, marks in weak[:5])
                lines.append(f"Weak subjects: {weak_str}.")

        docs.append({
            "document_id": f"student_{sid}",
            "entity_type": "student_profile",
            "entity_id": sid,
            "title": f"Student Profile: {sid} — {name}",
            "content": " ".join(lines),
            "metadata": {"department": dept, "risk_level": risk_level, "year": year},
            "source_table": "dim_student + fact_student_performance + fact_student_attendance",
        })

    return docs


def _build_subject_analytics() -> List[Dict[str, Any]]:
    """One document per subject: difficulty, avg marks, pass rate."""
    subjects = _safe_read("dim_subject.csv")
    perf = _safe_read("fact_student_performance.csv")

    if subjects.empty:
        return []

    docs = []
    for _, sub in subjects.iterrows():
        subj_id = sub["subject_id"]
        subj_name = sub.get("subject_name", subj_id)
        dept = sub.get("department", "Unknown")
        sem = sub.get("semester", "?")
        credits = sub.get("credits", "?")

        sp = perf[perf["subject_id"] == subj_id] if not perf.empty else pd.DataFrame()
        num_students = len(sp)
        avg_marks = round(sp["total_marks"].mean(), 1) if not sp.empty and "total_marks" in sp.columns and not sp["total_marks"].dropna().empty else None
        pass_rate = round((sp["result_status"].str.lower() == "pass").mean() * 100, 1) if not sp.empty and "result_status" in sp.columns else None

        difficulty = "Easy"
        if avg_marks is not None:
            if avg_marks < 45:
                difficulty = "Hard"
            elif avg_marks < 60:
                difficulty = "Moderate"

        lines = [
            f"Subject {subj_id} ({subj_name}) — Department: {dept}, Semester {sem}, Credits: {credits}.",
            f"Enrolled students: {num_students}.",
        ]
        if avg_marks is not None:
            lines.append(f"Class average marks: {avg_marks}/100.")
        if pass_rate is not None:
            lines.append(f"Pass rate: {pass_rate}%.")
        lines.append(f"Difficulty rating: {difficulty}.")

        docs.append({
            "document_id": f"subject_{subj_id}",
            "entity_type": "subject_analytics",
            "entity_id": subj_id,
            "title": f"Subject Analytics: {subj_id} — {subj_name}",
            "content": " ".join(lines),
            "metadata": {"department": dept, "semester": sem, "difficulty": difficulty},
            "source_table": "dim_subject + fact_student_performance",
        })

    return docs


def _build_faculty_summaries() -> List[Dict[str, Any]]:
    """One document per faculty member."""
    faculty = _safe_read("dim_faculty.csv")
    perf = _safe_read("fact_student_performance.csv")

    if faculty.empty:
        return []

    docs = []
    for _, f in faculty.iterrows():
        fid = f["faculty_id"]
        fname = f.get("faculty_name", fid)
        dept = f.get("department", "Unknown")
        designation = f.get("designation", "")
        exp = f.get("experience_years", "?")

        fp = perf[perf["faculty_id"] == fid] if not perf.empty and "faculty_id" in perf.columns else pd.DataFrame()
        subjects_taught = fp["subject_id"].nunique() if not fp.empty and "subject_id" in fp.columns else 0
        students_taught = fp["student_id"].nunique() if not fp.empty and "student_id" in fp.columns else 0
        class_avg = round(fp["total_marks"].mean(), 1) if not fp.empty and "total_marks" in fp.columns and not fp["total_marks"].dropna().empty else None
        pass_rate = round((fp["result_status"].str.lower() == "pass").mean() * 100, 1) if not fp.empty and "result_status" in fp.columns else None

        lines = [
            f"Faculty {fid} ({fname}) — {dept}, {designation}, {exp} years experience.",
            f"Subjects taught: {subjects_taught}. Students taught: {students_taught}.",
        ]
        if class_avg is not None:
            lines.append(f"Class average marks: {class_avg}/100.")
        if pass_rate is not None:
            lines.append(f"Student pass rate: {pass_rate}%.")

        docs.append({
            "document_id": f"faculty_{fid}",
            "entity_type": "faculty_summary",
            "entity_id": fid,
            "title": f"Faculty Summary: {fid} — {fname}",
            "content": " ".join(lines),
            "metadata": {"department": dept, "designation": designation},
            "source_table": "dim_faculty + fact_student_performance",
        })

    return docs


def _build_department_overviews() -> List[Dict[str, Any]]:
    """One document per department: aggregated metrics."""
    students = _safe_read("dim_student.csv")
    perf = _safe_read("fact_student_performance.csv")
    att = _safe_read("fact_student_attendance.csv")

    if students.empty:
        return []

    docs = []
    for dept_code, grp in students.groupby("department_code"):
        dept_name = grp["department"].iloc[0] if "department" in grp.columns else dept_code
        count = len(grp)
        sids = grp["student_id"].tolist()

        dp = perf[perf["student_id"].isin(sids)] if not perf.empty else pd.DataFrame()
        da = att[att["student_id"].isin(sids)] if not att.empty else pd.DataFrame()

        avg_marks = round(dp["total_marks"].mean(), 1) if not dp.empty and "total_marks" in dp.columns and not dp["total_marks"].dropna().empty else None
        avg_att = round(da["attendance_percent"].mean(), 1) if not da.empty and "attendance_percent" in da.columns and not da["attendance_percent"].dropna().empty else None
        pass_rate = round((dp["result_status"].str.lower() == "pass").mean() * 100, 1) if not dp.empty and "result_status" in dp.columns else None

        lines = [
            f"Department: {dept_name} ({dept_code}). Total students: {count}.",
        ]
        if avg_marks is not None:
            lines.append(f"Department average marks: {avg_marks}/100.")
        if avg_att is not None:
            lines.append(f"Department average attendance: {avg_att}%.")
        if pass_rate is not None:
            lines.append(f"Department pass rate: {pass_rate}%.")

        docs.append({
            "document_id": f"dept_{dept_code}",
            "entity_type": "department_overview",
            "entity_id": dept_code,
            "title": f"Department Overview: {dept_name} ({dept_code})",
            "content": " ".join(lines),
            "metadata": {"department": dept_name, "student_count": count},
            "source_table": "dim_student + fact_student_performance + fact_student_attendance",
        })

    return docs


def _build_career_readiness() -> List[Dict[str, Any]]:
    """One document per student: career metrics."""
    career = _safe_read("fact_career_activity.csv")
    students = _safe_read("dim_student.csv")

    if career.empty:
        return []

    # career fact uses different IDs — map what we can
    student_names = {}
    if not students.empty:
        student_names = dict(zip(students["student_id"], students["first_name"] + " " + students["last_name"]))

    docs = []
    for sid, grp in career.groupby("student_id"):
        name = student_names.get(sid, sid)
        internships = int(grp["internship_completed"].sum()) if "internship_completed" in grp.columns else 0
        project = round(grp["project_phase_ii_score"].mean(), 1) if "project_phase_ii_score" in grp.columns and not grp["project_phase_ii_score"].dropna().empty else None
        devops = round(grp["devops_engineering_score"].mean(), 1) if "devops_engineering_score" in grp.columns and not grp["devops_engineering_score"].dropna().empty else None
        extra = round(grp["extracurricular_score"].mean(), 1) if "extracurricular_score" in grp.columns and not grp["extracurricular_score"].dropna().empty else None
        certs = int(grp["certification_count"].sum()) if "certification_count" in grp.columns else 0

        lines = [
            f"Career readiness for student {sid} ({name}).",
            f"Internships completed: {internships}. Certifications: {certs}.",
        ]
        if project is not None:
            lines.append(f"Project Phase II score: {project}.")
        if devops is not None:
            lines.append(f"DevOps Engineering score: {devops}.")
        if extra is not None:
            lines.append(f"Extracurricular score: {extra}.")

        docs.append({
            "document_id": f"career_{sid}",
            "entity_type": "career_readiness",
            "entity_id": sid,
            "title": f"Career Readiness: {sid}",
            "content": " ".join(lines),
            "metadata": {"internships": internships, "certifications": certs},
            "source_table": "fact_career_activity",
        })

    return docs


# ─── Public API ────────────────────────────────────────────────

def build_all_documents() -> List[Dict[str, Any]]:
    """Build every document type and return the combined list."""
    all_docs: List[Dict[str, Any]] = []
    builders = [
        ("student_profile", _build_student_profiles),
        ("subject_analytics", _build_subject_analytics),
        ("faculty_summary", _build_faculty_summaries),
        ("department_overview", _build_department_overviews),
        ("career_readiness", _build_career_readiness),
    ]
    for label, fn in builders:
        try:
            docs = fn()
            all_docs.extend(docs)
            print(f"  ✓ {label}: {len(docs)} documents")
        except Exception as e:
            print(f"  ✗ {label}: {e}")
    print(f"Total RAG documents: {len(all_docs)}")
    return all_docs
