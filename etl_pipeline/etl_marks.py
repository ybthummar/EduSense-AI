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
    ETL for Marks and Attendance fact tables
    """
    print(f"Extracting marks and attendance from {csv_path}...")
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print("Dataset not found. Exiting pipeline.")
        return
        
    # Transform
    # Pivot subject columns if they are wide, handle missing scores
    marks_df = df.melt(id_vars=['student_id'], value_vars=['DSA', 'DBMS', 'OS', 'CN', 'SE'], var_name='subject', value_name='score')
    marks_df.dropna(inplace=True)
    
    # Load
    print("Loading marks into database...")
    try:
        marks_df.to_sql('marks', engine, if_exists='append', index=False)
        print("Extracted and Loaded Marks Successfully")
    except Exception as e:
        print(f"Loading failed: {str(e)}")

if __name__ == "__main__":
    run_pipeline("../data/datasets/marks.csv")
