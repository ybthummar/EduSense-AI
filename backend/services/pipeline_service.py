"""
Pipeline Service
────────────────
Handles data edits that flow through the full medallion pipeline:
  Raw → Bronze → Silver → Gold

When a user edits a record from the frontend, this service:
  1. Updates the raw CSV (source of truth)
  2. Re-runs the ETL pipeline (bronze → silver → gold)
  3. Clears the dataset cache so the backend serves fresh data
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict

import pandas as pd

# Ensure project root on path for etl imports
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

RAW_DIR = ROOT_DIR / "data" / "raw"

# Raw file mapping — logical table → raw CSV filename
RAW_FILES = {
    "student_master":   "engineering_student_master_data.csv",
    "student_academic": "enriched_engineering_student_academic_dataset.csv",
    "curriculum":       "engineering_college_curriculum_dataset.csv",
    "faculty_subject":  "faculty_subject_mapping.csv",
}


class PipelineError(Exception):
    pass


def update_raw_record(
    table: str,
    key_column: str,
    key_value: str,
    updates: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Update a single record in a raw CSV, then re-run the full pipeline.

    Parameters
    ----------
    table : str
        Logical table name (e.g. "student_master")
    key_column : str
        Column used to identify the row (e.g. "Student_ID")
    key_value : str
        Value of the key column for the target row
    updates : dict
        Column→value pairs to update

    Returns
    -------
    dict with pipeline_log (list of stage messages) and updated_record (dict)
    """
    if table not in RAW_FILES:
        raise PipelineError(f"Unknown table '{table}'. Available: {list(RAW_FILES.keys())}")

    raw_path = RAW_DIR / RAW_FILES[table]
    if not raw_path.exists():
        raise PipelineError(f"Raw file not found: {raw_path}")

    # ── Step 1: Update raw CSV ──────────────────────────────────────────────
    df = pd.read_csv(raw_path)

    # Find the matching row (case-insensitive for IDs)
    mask = df[key_column].astype(str).str.strip().str.upper() == str(key_value).strip().upper()
    if mask.sum() == 0:
        raise PipelineError(
            f"No record found with {key_column}='{key_value}' in {RAW_FILES[table]}"
        )
    if mask.sum() > 1:
        raise PipelineError(
            f"Multiple records match {key_column}='{key_value}' — expected exactly 1"
        )

    row_idx = mask.idxmax()

    # Apply updates
    for col, val in updates.items():
        if col not in df.columns:
            raise PipelineError(f"Column '{col}' does not exist in {RAW_FILES[table]}")
        df.at[row_idx, col] = val

    df.to_csv(raw_path, index=False)

    pipeline_log = [f"1. Raw updated: {RAW_FILES[table]} (row {key_column}={key_value})"]

    # ── Step 2: Re-run ETL pipeline ─────────────────────────────────────────
    from etl.extract_to_bronze import extract_all
    from etl.bronze_to_silver import transform_all
    from etl.silver_to_gold import aggregate_all

    extract_all()
    pipeline_log.append("2. Bronze extracted (Raw → Bronze)")

    transform_all()
    pipeline_log.append("3. Silver transformed (Bronze → Silver)")

    aggregate_all()
    pipeline_log.append("4. Gold aggregated (Silver → Gold)")

    # ── Step 3: Clear dataset cache ─────────────────────────────────────────
    from services.dataset_service import load_dataset
    load_dataset.cache_clear()
    pipeline_log.append("5. Dataset cache cleared — fresh data served")

    # Return the updated record
    updated_row = df.loc[row_idx].to_dict()
    # Clean NaN values
    updated_row = {k: (None if pd.isna(v) else v) for k, v in updated_row.items()}

    return {
        "pipeline_log": pipeline_log,
        "updated_record": updated_row,
    }


def get_raw_tables() -> Dict[str, Dict[str, Any]]:
    """Return metadata about all raw tables for the pipeline showcase."""
    result = {}
    for table, filename in RAW_FILES.items():
        path = RAW_DIR / filename
        info: Dict[str, Any] = {"filename": filename, "exists": path.exists()}
        if path.exists():
            df = pd.read_csv(path)
            info["rows"] = len(df)
            info["columns"] = df.columns.tolist()
        result[table] = info
    return result
