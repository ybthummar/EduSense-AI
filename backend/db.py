import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

tables = [
    "raw_student_master",
    "raw_engineering_college_curriculum",
    "raw_enriched_engineering_student_academic",
    "raw_faculty_subject_mapping",
    "raw_student_cgpa_risk",
    "raw_student_future_career_path"
]

for table in tables:
    print("\n======================")
    print("TABLE:", table)

    df = pd.read_sql(f'SELECT * FROM "{table}" LIMIT 3;', engine)
    print(df)
