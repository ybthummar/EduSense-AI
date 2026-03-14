#!/usr/bin/env python
"""Test script for dataset service functions"""

from services.dataset_service import (
    get_faculty_students, 
    get_student_detail, 
    get_student_dashboard, 
    get_student_academic_history
)
import json

# Test 1: get_faculty_students
students = get_faculty_students(limit=2)
print('=== FACULTY STUDENTS (2) ===')
print(json.dumps(students, indent=2))
print()

# Test 2: get_student_detail
detail = get_student_detail('23AIML001')
print('=== STUDENT DETAIL ===')
print(json.dumps(detail, indent=2))
print()

# Test 3: get_student_dashboard
dash = get_student_dashboard('STU000001')
print('=== STUDENT DASHBOARD ===')
print(json.dumps(dash, indent=2))
print()

# Test 4: get_student_academic_history
hist = get_student_academic_history('STU000001')
print('=== ACADEMIC HISTORY ===')
print(json.dumps(hist, indent=2))
