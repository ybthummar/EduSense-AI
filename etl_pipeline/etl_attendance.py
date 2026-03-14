"""ETL pipeline for attendance data."""

import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "edusense")

engine = create_engine(f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")


def run_pipeline(csv_path: str):
    """
    ETL for attendance records.
    Steps: extract CSV → clean/transform → load into PostgreSQL.
    """
    print(f"Extracting attendance data from {csv_path}...")
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print("Attendance dataset not found. Exiting pipeline.")
        return

    # Standardise column names
    column_mapping = {
        "Student_ID": "student_id",
        "Total_Classes": "total_classes",
        "Attended_Classes": "attended_classes",
        "Attendance_Percentage": "percentage",
    }
    df.rename(columns=column_mapping, inplace=True)

    # Ensure required columns exist
    required = ["student_id", "total_classes", "attended_classes"]
    for col in required:
        if col not in df.columns:
            print(f"Missing required column: {col}")
            return

    # Derive percentage if not present
    if "percentage" not in df.columns:
        df["percentage"] = round(
            (df["attended_classes"] / df["total_classes"]) * 100, 2
        )

    # Clean
    df.dropna(subset=["student_id"], inplace=True)
    df["student_id"] = df["student_id"].astype(str).str.strip().str.upper()
    df.fillna({"total_classes": 0, "attended_classes": 0, "percentage": 0}, inplace=True)

    # Load
    print("Loading attendance into database...")
    try:
        df[["student_id", "total_classes", "attended_classes", "percentage"]].to_sql(
            "attendance", engine, if_exists="append", index=False
        )
        print("Attendance ETL completed successfully.")
    except Exception as e:
        print(f"Loading failed: {e}")


if __name__ == "__main__":
    run_pipeline("../data/datasets/attendance.csv")
