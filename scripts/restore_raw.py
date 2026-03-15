"""Restore raw CSV files from bronze (strips metadata columns)."""
import pandas as pd
import os

bronze_dir = "data/bronze"
raw_dir = "data/raw"
os.makedirs(raw_dir, exist_ok=True)

mapping = {
    "bronze_student_master.csv":   "engineering_student_master_data.csv",
    "bronze_student_academic.csv": "enriched_engineering_student_academic_dataset.csv",
    "bronze_curriculum.csv":       "engineering_college_curriculum_dataset.csv",
    "bronze_cgpa_risk.csv":        "student_cgpa_risk_synthetic_dataset_100k.csv",
    "bronze_career_path.csv":      "student_future_career_path_synthetic_dataset_100k.csv",
}

for bronze_file, raw_file in mapping.items():
    src = os.path.join(bronze_dir, bronze_file)
    dst = os.path.join(raw_dir, raw_file)
    df = pd.read_csv(src)
    meta_cols = [c for c in df.columns if c.startswith("_")]
    df = df.drop(columns=meta_cols, errors="ignore")
    df.to_csv(dst, index=False)
    print(f"OK {raw_file}  ({len(df)} rows x {len(df.columns)} cols)")

print("\nAll raw files restored!")
