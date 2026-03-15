"""One-time script to create the live_attendance table in PostgreSQL."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing in .env")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS live_attendance (
            id          BIGSERIAL    PRIMARY KEY,
            faculty_id  VARCHAR(20)  NOT NULL,
            student_id  VARCHAR(20)  NOT NULL,
            subject_id  VARCHAR(20),
            date        DATE         NOT NULL DEFAULT CURRENT_DATE,
            status      VARCHAR(10)  NOT NULL CHECK (status IN ('present','absent')),
            marked_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            UNIQUE(student_id, date, subject_id)
        );
    """))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_live_att_date ON live_attendance(date);"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_live_att_student ON live_attendance(student_id);"))
    conn.commit()

    print("Table live_attendance created successfully.")
    result = conn.execute(text(
        "SELECT column_name, data_type FROM information_schema.columns "
        "WHERE table_name = 'live_attendance' ORDER BY ordinal_position;"
    ))
    for row in result:
        print(f"  {row[0]:15s} {row[1]}")
