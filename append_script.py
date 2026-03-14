import sys
with open('backend/services/dataset_service.py', 'a') as f:
    f.write('''

def get_students_master_data(department: Optional[str] = None) -> List[Dict[str, Any]]:
    df = load_dataset("student_master")
    if department:
        df = df[df["Department"].astype(str).str.strip().str.lower() == department.strip().lower()]
    records = []
    for _, row in df.iterrows():
        records.append({col.lower(): _clean_value(val) for col, val in row.items()})
    return records

def get_students_performance_data(department: Optional[str] = None) -> List[Dict[str, Any]]:
    df = load_dataset("enriched")
    if department:
        df = df[df["Department"].astype(str).str.strip().str.lower() == department.strip().lower()]
    records = []
    for _, row in df.iterrows():
        # Ensure we construct performance data correctly for frontend
        rec = {col.lower(): _clean_value(val) for col, val in row.items()}
        rec["name"] = f"{rec.get('first_name', '')} {rec.get('last_name', '')}".strip()
        rec["devops_status"] = rec.get("devops_engineering_status")
        rec["project_status"] = rec.get("project_phase_ii_status")
        rec["risk_level"] = _risk_level(50) # default fake risk, actual logic requires marks
        # Let's compute a simple risk based on previous_sem_sgpa and attendance
        sgpa = rec.get("previous_sem_sgpa", 10)
        att = rec.get("attendance_percentage", 100)
        risk = 0
        if sgpa and sgpa < 5: risk += 50
        elif sgpa and sgpa < 6: risk += 20
        if att and att < 75: risk += 30
        rec["risk_level"] = _risk_level(risk)
        records.append(rec)
    return records
''')
