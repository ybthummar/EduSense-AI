import sys

with open('backend/api/faculty.py', 'r') as f:
    text = f.read()

text = text.replace('get_student_detail   from typing', 'get_student_detail\nfrom typing')

with open('backend/api/faculty.py', 'w') as f:
    f.write(text)
