"""
Attendance Service
──────────────────
Handles live attendance marking by faculty.
  - Saves attendance records to PostgreSQL (live_attendance table)
  - Triggers ETL pipeline update so gold layer reflects new data
  - Provides queries for today's attendance per student

Default faculty: FACCE001 (Sanjay Desai) / password: faculty123
"""

from __future__ import annotations

import logging
import os
import sys
import threading
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

_log = logging.getLogger(__name__)

# Ensure project root on path for etl imports
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

load_dotenv(ROOT_DIR / "backend" / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing in .env")

_engine = create_engine(DATABASE_URL, pool_recycle=300, pool_size=3)

# Default faculty credentials (for demo)
DEFAULT_FACULTY = {
    "faculty_id": "FACCE001",
    "faculty_name": "Sanjay Desai",
    "password": "faculty123",
    "department": "Computer Engineering",
}


def get_engine():
    return _engine


def save_attendance(
    faculty_id: str,
    subject_id: Optional[str],
    records: List[Dict[str, str]],
    attendance_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Save attendance records to PostgreSQL.

    Parameters
    ----------
    faculty_id : str
    subject_id : str or None
    records : list of {"student_id": str, "status": "present"|"absent"}
    attendance_date : str (YYYY-MM-DD) or None for today

    Returns
    -------
    dict with saved count and pipeline_log
    """
    att_date = attendance_date or date.today().isoformat()

    # Build batch params — single round-trip to DB
    now = datetime.now(timezone.utc)
    fid = faculty_id.strip().upper()
    batch_params = []
    for rec in records:
        status = rec["status"].strip().lower()
        if status not in ("present", "absent"):
            continue
        batch_params.append({
            "fid": fid,
            "sid": rec["student_id"].strip().upper(),
            "subj": subject_id,
            "dt": att_date,
            "status": status,
            "ts": now,
        })

    saved = len(batch_params)
    if saved:
        with _engine.connect() as conn:
            conn.execute(
                text("""
                    INSERT INTO live_attendance (faculty_id, student_id, subject_id, date, status, marked_at)
                    VALUES (:fid, :sid, :subj, :dt, :status, :ts)
                    ON CONFLICT (student_id, date, subject_id)
                    DO UPDATE SET status = EXCLUDED.status, faculty_id = EXCLUDED.faculty_id, marked_at = EXCLUDED.marked_at
                """),
                batch_params,
            )
            conn.commit()

    # All heavy work (gold CSV update, ETL, notifications) runs in background
    threading.Thread(
        target=_background_pipeline,
        args=(faculty_id, subject_id, records, att_date),
        daemon=True,
    ).start()

    return {
        "saved": saved,
        "date": att_date,
        "pipeline_log": ["DB saved", "ETL pipeline dispatched (background)"],
    }


def _background_pipeline(
    faculty_id: str,
    subject_id: Optional[str],
    records: List[Dict[str, str]],
    att_date: str,
) -> None:
    """Run gold update + full ETL + notifications in a background thread."""
    try:
        _update_gold_attendance(att_date)
    except Exception as exc:
        _log.error("Background gold update failed: %s", exc)
    try:
        _append_raw_and_run_pipeline(faculty_id, subject_id, records, att_date)
    except Exception as exc:
        _log.error("Background ETL failed: %s", exc)
    try:
        _create_attendance_notifications(records, subject_id, att_date)
    except Exception as exc:
        _log.error("Background notifications failed: %s", exc)


def get_attendance_by_date(
    attendance_date: Optional[str] = None,
    student_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Fetch attendance records from PostgreSQL for a given date."""
    att_date = attendance_date or date.today().isoformat()

    query = "SELECT student_id, subject_id, status, faculty_id, marked_at FROM live_attendance WHERE date = :dt"
    params: dict = {"dt": att_date}

    if student_id:
        query += " AND student_id = :sid"
        params["sid"] = student_id.strip().upper()

    query += " ORDER BY student_id"

    with _engine.connect() as conn:
        result = conn.execute(text(query), params)
        rows = [
            {
                "student_id": r[0],
                "subject_id": r[1],
                "status": r[2],
                "faculty_id": r[3],
                "marked_at": r[4].isoformat() if r[4] else None,
            }
            for r in result
        ]
    return rows


def get_student_today_attendance(student_id: str) -> Dict[str, Any]:
    """Get today's attendance for a specific student."""
    today = date.today().isoformat()
    records = get_attendance_by_date(attendance_date=today, student_id=student_id)

    present_count = sum(1 for r in records if r["status"] == "present")
    absent_count = sum(1 for r in records if r["status"] == "absent")
    total = present_count + absent_count

    return {
        "student_id": student_id.strip().upper(),
        "date": today,
        "records": records,
        "present_count": present_count,
        "absent_count": absent_count,
        "total_classes": total,
        "today_percentage": round(present_count / total * 100, 1) if total > 0 else None,
    }


def get_attendance_history(
    student_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Fetch attendance history from the silver_attendance_daily dataset (CSV-based)."""
    from services.dataset_service import load_dataset

    try:
        df = load_dataset("attendance_daily")
    except Exception:
        return []

    if df.empty:
        return []

    if student_id:
        df = df[df["student_id"].str.upper() == student_id.strip().upper()]
    if subject_id:
        df = df[df["subject_id"].str.upper() == subject_id.strip().upper()]
    if start_date:
        df = df[df["date"] >= start_date]
    if end_date:
        df = df[df["date"] <= end_date]

    df = df.sort_values("date", ascending=False)

    return df.head(500).to_dict(orient="records")


def get_attendance_summary(
    department: Optional[str] = None,
    subject_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns aggregated attendance stats from gold fact_student_attendance.
    Filters by department/subject if provided.
    """
    from services.dataset_service import load_dataset

    try:
        att = load_dataset("fact_attendance")
        students = load_dataset("dim_student")
    except Exception:
        return {"total_students": 0, "avg_attendance": 0, "students": []}

    # Focus on daily-tracked rows (subject_id not null)
    daily = att[att["subject_id"].notna()].copy()
    if daily.empty:
        daily = att.copy()

    # Join department info
    if not students.empty and "department" in students.columns:
        stu_dept = students[["student_id", "department"]].drop_duplicates("student_id")
        daily = daily.merge(stu_dept, on="student_id", how="left")
    else:
        daily["department"] = None

    if department:
        daily = daily[daily["department"].str.contains(department, case=False, na=False)]
    if subject_id:
        daily = daily[daily["subject_id"].str.upper() == subject_id.strip().upper()]

    if daily.empty:
        return {"total_students": 0, "avg_attendance": 0, "students": []}

    # Per-student summary
    stu_summary = (
        daily.groupby("student_id")
        .agg(
            avg_attendance=("attendance_percent", "mean"),
            total_classes=("total_classes", "sum"),
            classes_attended=("classes_attended", "sum"),
            subjects_tracked=("subject_id", "nunique"),
        )
        .reset_index()
    )
    stu_summary["avg_attendance"] = stu_summary["avg_attendance"].round(1)

    # Merge name & department
    if not students.empty:
        name_cols = ["student_id"]
        for c in ("first_name", "last_name", "department", "department_code"):
            if c in students.columns:
                name_cols.append(c)
        stu_summary = stu_summary.merge(
            students[name_cols].drop_duplicates("student_id"),
            on="student_id", how="left",
        )

    # Risk categorisation
    stu_summary["risk"] = stu_summary["avg_attendance"].apply(
        lambda x: "critical" if x < 60 else ("low" if x < 75 else "safe")
    )

    overall_avg = round(float(stu_summary["avg_attendance"].mean()), 1) if len(stu_summary) else 0
    below_75 = int((stu_summary["avg_attendance"] < 75).sum())
    below_60 = int((stu_summary["avg_attendance"] < 60).sum())

    return {
        "total_students": int(len(stu_summary)),
        "avg_attendance": overall_avg,
        "below_75_count": below_75,
        "below_60_count": below_60,
        "students": stu_summary.to_dict(orient="records"),
    }


def _update_gold_attendance(att_date: str) -> List[str]:
    """
    After live attendance is saved, append/update fact_student_attendance
    in the gold layer so dashboards show fresh data.
    """
    log: List[str] = []

    try:
        from etl.utils import GOLD_DIR, read_csv_safe, save_csv

        # Read current gold attendance
        gold_path = GOLD_DIR / "fact_student_attendance.csv"
        gold_df = read_csv_safe(gold_path)
        log.append("1. Loaded current fact_student_attendance")

        # Fetch today's live records from PostgreSQL
        live_records = get_attendance_by_date(attendance_date=att_date)
        if not live_records:
            log.append("2. No live records to merge — skipped")
            return log

        # Build DataFrame from live records
        live_df = pd.DataFrame(live_records)
        live_df["attendance_percent"] = live_df["status"].apply(
            lambda s: 100 if s == "present" else 0
        )
        live_df["total_classes"] = 1
        live_df["classes_attended"] = live_df["status"].apply(
            lambda s: 1 if s == "present" else 0
        )
        live_df["semester_id"] = f"LIVE-{att_date}"

        live_gold = live_df[["student_id", "subject_id", "semester_id",
                             "attendance_percent", "total_classes", "classes_attended"]]
        log.append(f"2. Built {len(live_gold)} live attendance rows")

        # Remove any previous live rows for this date
        date_tag = f"LIVE-{att_date}"
        if not gold_df.empty and "semester_id" in gold_df.columns:
            gold_df = gold_df[gold_df["semester_id"] != date_tag]

        # Append live rows
        updated = pd.concat([gold_df, live_gold], ignore_index=True)
        save_csv(updated, gold_path)
        log.append(f"3. Gold fact_student_attendance updated ({len(updated)} total rows)")

        # Clear dataset cache so API serves fresh data
        from services.dataset_service import load_dataset
        load_dataset.cache_clear()
        log.append("4. Dataset cache cleared")

    except Exception as exc:
        log.append(f"ERROR: {exc}")

    return log


def _append_raw_and_run_pipeline(
    faculty_id: str,
    subject_id: Optional[str],
    records: List[Dict[str, str]],
    att_date: str,
) -> List[str]:
    """
    Append new attendance records to the raw CSV and re-run the full
    ETL pipeline (raw → bronze → silver → gold) so all layers stay in sync.
    """
    log: List[str] = []
    try:
        from etl.utils import RAW_DATA_DIR, read_csv_safe, save_csv

        raw_path = RAW_DATA_DIR / "attendance_daily.csv"
        raw_df = read_csv_safe(raw_path)

        new_rows = []
        for rec in records:
            sid = rec["student_id"].strip().upper()
            status = rec["status"].strip().lower()
            if status not in ("present", "absent"):
                continue
            new_rows.append({
                "student_id": sid,
                "subject_id": subject_id or "",
                "faculty_id": faculty_id.strip().upper(),
                "date": att_date,
                "status": status,
            })

        if not new_rows:
            log.append("ETL: No valid records to append")
            return log

        new_df = pd.DataFrame(new_rows)

        # Remove duplicates for this (student, subject, date) - keep new
        if not raw_df.empty:
            merge_key = ["student_id", "subject_id", "date"]
            existing_keys = set(raw_df[merge_key].apply(tuple, axis=1))
            new_keys = set(new_df[merge_key].apply(tuple, axis=1))
            # Remove old rows for the same keys
            mask = ~raw_df[merge_key].apply(tuple, axis=1).isin(new_keys)
            raw_df = raw_df[mask]

        updated = pd.concat([raw_df, new_df], ignore_index=True)
        save_csv(updated, raw_path)
        log.append(f"ETL: Raw CSV updated ({len(updated)} total rows)")

        # ── Fast attendance-only ETL (skip unrelated tables) ──────────
        from etl.utils import BRONZE_DIR, SILVER_DIR, GOLD_DIR, add_metadata, ensure_dir

        # 1. Bronze: ingest only attendance_daily
        ensure_dir(BRONZE_DIR)
        bronze_df = add_metadata(updated.copy(), source_file="attendance_daily.csv")
        save_csv(bronze_df, BRONZE_DIR / "bronze_attendance_daily.csv")
        log.append("ETL: Bronze attendance updated")

        # 2. Silver: build only attendance_daily + attendance_summary
        ensure_dir(SILVER_DIR)
        from etl.bronze_to_silver import build_silver_attendance_daily, build_silver_attendance_summary
        silver_daily = build_silver_attendance_daily(BRONZE_DIR)
        if not silver_daily.empty:
            save_csv(silver_daily, SILVER_DIR / "silver_attendance_daily.csv")
        silver_summary = build_silver_attendance_summary(BRONZE_DIR)
        if not silver_summary.empty:
            save_csv(silver_summary, SILVER_DIR / "silver_attendance_summary.csv")
        log.append("ETL: Silver attendance updated")

        # 3. Gold: rebuild only fact_student_attendance
        ensure_dir(GOLD_DIR)
        from etl.silver_to_gold import build_fact_student_attendance
        gold_att = build_fact_student_attendance(SILVER_DIR)
        if not gold_att.empty:
            save_csv(gold_att, GOLD_DIR / "fact_student_attendance.csv")
        log.append("ETL: Gold attendance updated")

        # Clear dataset cache
        from services.dataset_service import load_dataset
        load_dataset.cache_clear()
        log.append("ETL: Full pipeline complete, cache cleared")

    except Exception as exc:
        log.append(f"ETL ERROR: {exc}")

    return log


def _create_attendance_notifications(
    records: List[Dict[str, str]],
    subject_id: Optional[str],
    att_date: str,
) -> List[str]:
    """Create a notification for each student after attendance is marked."""
    log: List[str] = []
    try:
        subject_label = subject_id or "General"
        notif_rows = []
        for rec in records:
            sid = rec["student_id"].strip().upper()
            status = rec["status"].strip().lower()
            if status == "present":
                title = f"Marked Present — {subject_label}"
                message = f"You were marked present for {subject_label} on {att_date}."
            else:
                title = f"Marked Absent — {subject_label}"
                message = f"You were marked absent for {subject_label} on {att_date}. Contact your faculty if this is incorrect."
            notif_rows.append({
                "sid": sid,
                "title": title,
                "message": message,
            })

        with _engine.connect() as conn:
            for n in notif_rows:
                conn.execute(
                    text("""
                        INSERT INTO notifications (student_id, title, message, type)
                        VALUES (:sid, :title, :message, 'attendance')
                    """),
                    {"sid": n["sid"], "title": n["title"], "message": n["message"]},
                )
            conn.commit()

        log.append(f"Notifications: {len(notif_rows)} student notifications created")
    except Exception as exc:
        log.append(f"Notification ERROR: {exc}")

    return log


def get_student_notifications(student_id: str) -> List[Dict[str, Any]]:
    """Fetch notifications for a specific student."""
    sid = student_id.strip().upper()
    with _engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT id, title, message, type, is_read, created_at
                FROM notifications
                WHERE student_id = :sid
                ORDER BY created_at DESC
                LIMIT 50
            """),
            {"sid": sid},
        )
        return [
            {
                "id": r[0],
                "title": r[1],
                "message": r[2],
                "type": r[3],
                "is_read": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
            }
            for r in result
        ]


def mark_notification_read(notification_id: int) -> bool:
    """Mark a notification as read."""
    with _engine.connect() as conn:
        conn.execute(
            text("UPDATE notifications SET is_read = TRUE WHERE id = :nid"),
            {"nid": notification_id},
        )
        conn.commit()
    return True


def mark_all_notifications_read(student_id: str) -> int:
    """Mark all notifications for a student as read."""
    sid = student_id.strip().upper()
    with _engine.connect() as conn:
        result = conn.execute(
            text("UPDATE notifications SET is_read = TRUE WHERE student_id = :sid AND is_read = FALSE"),
            {"sid": sid},
        )
        conn.commit()
        return result.rowcount
