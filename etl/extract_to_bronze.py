"""
Extract to Bronze  (Raw → Bronze)
─────────────────────────────────
Reads raw CSV files from data/datasets/ and copies them into data/bronze/
with minimal transformation — only ingestion metadata is added.

This preserves the original schema so any downstream debugging can trace
back to the raw source.
"""

from pathlib import Path

from etl.utils import (
    RAW_DATA_DIR,
    BRONZE_DIR,
    add_metadata,
    ensure_dir,
    get_logger,
    read_csv_safe,
    save_csv,
)

log = get_logger("extract_to_bronze")

# ── Source file → Bronze table mapping ─────────────────────────────────────────
# Each entry maps a logical name to the raw CSV filename.
SOURCE_MAP: dict[str, str] = {
    "student_master":     "engineering_student_master_data.csv",
    "student_academic":   "enriched_engineering_student_academic_dataset.csv",
    "curriculum":         "engineering_college_curriculum_dataset.csv",
    "cgpa_risk":          "student_cgpa_risk_synthetic_dataset_100k.csv",
    "career_path":        "student_future_career_path_synthetic_dataset_100k.csv",
    "faculty_subject":    "faculty_subject_mapping.csv",
    "attendance_daily":   "attendance_daily.csv",
}


def extract_all(raw_dir: Path | None = None, bronze_dir: Path | None = None) -> dict[str, Path]:
    """
    Ingest every raw CSV into the Bronze layer.

    Returns a dict of {table_name: output_path}.
    """
    raw_dir = raw_dir or RAW_DATA_DIR
    bronze_dir = bronze_dir or BRONZE_DIR
    ensure_dir(bronze_dir)

    outputs: dict[str, Path] = {}

    for table_name, filename in SOURCE_MAP.items():
        src = raw_dir / filename
        df = read_csv_safe(src)
        if df.empty:
            log.warning("Skipping %s — source file missing or empty", table_name)
            continue

        # Add ingestion metadata (timestamp, source filename)
        df = add_metadata(df, source_file=filename)

        out_path = bronze_dir / f"bronze_{table_name}.csv"
        save_csv(df, out_path)
        outputs[table_name] = out_path

    log.info("Bronze extraction complete — %d tables ingested", len(outputs))
    return outputs


# ── CLI entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    extract_all()
