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
    Extract students from CSV, Clean missing values, Load into Postgres
    """
    # 1. Extract
    print(f"Extracting data from {csv_path}...")
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print("Dataset not found. Exiting pipeline.")
        return
        
    # 2. Transform/Clean
    print("Transforming data...")
    df.fillna({'semester': 1, 'attendance': 100}, inplace=True)
    
    # Standardize column names to match DB
    column_mapping = {
        'Student_ID': 'student_id',
        'Name': 'name',
        'Email': 'email',
        'Dept': 'department',
        'Sem': 'semester',
        'Faculty': 'faculty_id'
    }
    df.rename(columns=column_mapping, inplace=True)
    
    # Map attributes to DB logic
    users_df = df[['email', 'name']].copy()
    users_df['password'] = "default_hash"
    users_df['role'] = "student"
    
    students_df = df[['student_id', 'department', 'semester', 'faculty_id']].copy()
    # In real app, we need to map user_id after user insertion.
    
    # 3. Load
    print("Loading into database...")
    try:
        students_df.to_sql('students', engine, if_exists='append', index=False)
        print("Extracted and Loaded Successfully")
    except Exception as e:
        print(f"Loading failed: {str(e)}")

if __name__ == "__main__":
    run_pipeline("../data/datasets/students.csv")
