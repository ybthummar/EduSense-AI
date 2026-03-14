import sys

with open('backend/api/faculty.py', 'r') as f:
    text = f.read()

text = text.replace('from services.dataset_service import get_faculty_analytics, get_faculty_students\\n, get_student_detail', 'from services.dataset_service import get_faculty_analytics, get_faculty_students, get_student_detail')

if 'get_students_master_data' not in text:
    text = text.replace(
        'from services.dataset_service import',
        'from services.dataset_service import get_students_master_data, get_students_performance_data,\\n'
    )

new_routes = '''

@router.get("/students-master")
def get_students_master_route(department: Optional[str] = None):
    return get_students_master_data(department=department)

@router.get("/students-performance")
def get_students_performance_route(department: Optional[str] = None):
    return get_students_performance_data(department=department)

@router.post("/attendance")
def save_attendance(data: dict):
    return {"message": "Attendance saved"}
'''

if 'get_students_master_route' not in text:
    with open('backend/api/faculty.py', 'w') as f:
        f.write(text + new_routes)
        print("Updated faculty.py successfully!")
else:
    print("Routes already exist.")
