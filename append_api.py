import sys

with open("backend/api/faculty.py", "r") as f: 
    content = f.read()

content = content.replace(
    "from services.dataset_service import get_faculty_analytics, get_faculty_students, get_student_detail", 
    "from services.dataset_service import get_faculty_analytics, get_faculty_students, get_student_detail, get_students_master_data, get_students_performance_data"
)

new_routes = """
@router.get("/students-master")
def get_students_master_route(department: Optional[str] = None):
    return get_students_master_data(department=department)

@router.get("/students-performance")
def get_students_performance_route(department: Optional[str] = None):
    return get_students_performance_data(department=department)

@router.post("/attendance")
def save_attendance(data: dict):
    return {"message": "Attendance saved"}
"""

if "get_students_master_route" not in content:
    with open("backend/api/faculty.py", "w") as f: 
        f.write(content + "\n" + new_routes)
