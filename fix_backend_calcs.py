import sys

with open("backend/services/dataset_service.py", "r") as f:
    text = f.read()

old_blk = """        sgpa = rec.get("previous_sem_sgpa", 10)
        att = rec.get("attendance_percentage", 100)"""

new_blk = """        sgpa = rec.get("previous_sem_sgpa", 10)
        att = rec.get("attendance_percentage", 100)
        marks_str = str(rec.get("current_subject_marks", ""))
        current_sgpa = 0.0
        if marks_str and marks_str != "nan":
            marks = [int(m) for m in marks_str.split("|") if m.strip().isdigit()]
            if marks:
                current_sgpa = round(((sum(marks)/len(marks)) / 10) * 0.9 + 1, 2)
        rec["current_sem_sgpa"] = current_sgpa"""

if old_blk in text:
    text = text.replace(old_blk, new_blk)
    with open("backend/services/dataset_service.py", "w") as f:
        f.write(text)
    print("Replaced block successfully.")
else:
    print("Block not found!")
