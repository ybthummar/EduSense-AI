"""Generate faculty-subject mapping raw dataset."""
import os
import random
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd

random.seed(42)

curriculum = pd.read_csv("data/silver/silver_curriculum.csv")

dept_codes = {
    "Computer Engineering": "CE",
    "Information Technology": "IT",
    "Mechanical Engineering": "ME",
    "Civil Engineering": "CIV",
    "Electrical Engineering": "EE",
    "Electronics and Communication Engineering": "ECE",
    "Artificial Intelligence and Data Science": "AIDS",
}

first_names = [
    "Amit", "Priya", "Rajesh", "Sunita", "Vikram", "Neha", "Suresh", "Kavita",
    "Manoj", "Anita", "Deepak", "Pooja", "Arun", "Rekha", "Sanjay", "Nisha",
    "Ramesh", "Meena", "Kiran", "Swati", "Ashok", "Ritu", "Vivek", "Seema",
    "Pankaj", "Jyoti", "Nitin", "Komal", "Rakesh", "Shweta", "Gaurav", "Preeti",
    "Rohit", "Manju", "Dinesh", "Sapna", "Ajay", "Bhavna", "Mohit", "Aarti",
    "Harish", "Divya", "Tushar", "Pallavi", "Yogesh", "Rashmi", "Manish", "Geeta",
    "Mukesh", "Uma", "Pramod", "Lata", "Naveen", "Radha", "Sachin", "Savita",
    "Vinod", "Archana", "Satish", "Renuka", "Hemant", "Padma", "Girish", "Chitra",
    "Lalit", "Asha", "Tarun", "Beena", "Kapil", "Madhuri",
]

last_names = [
    "Sharma", "Patel", "Mehta", "Desai", "Shah", "Joshi", "Verma", "Gupta",
    "Singh", "Kumar", "Rao", "Reddy", "Nair", "Pillai", "Iyer", "Menon",
    "Chauhan", "Thakur", "Pandey", "Mishra", "Tiwari", "Dubey", "Bhatt", "Dave",
    "Trivedi", "Parekh", "Kothari", "Soni", "Agarwal", "Bansal", "Saxena", "Khanna",
    "Malhotra", "Kapoor", "Bhatia", "Chopra", "Sethi", "Bajaj", "Arora", "Dutta",
    "Ghosh", "Bose", "Chatterjee", "Sen", "Das", "Roy", "Mukerjee", "Choudhury",
    "Naik", "Kulkarni", "Patil", "Jadhav", "More", "Shinde", "Gaikwad", "Sawant",
    "Hegde", "Shetty", "Kamath", "Bhat", "Rathod", "Solanki", "Parmar", "Raval",
    "Modi", "Vyas", "Rana", "Chawla", "Dhawan", "Mahajan",
]

qualifications = ["M.Tech", "Ph.D", "M.E.", "Ph.D", "M.Tech", "Ph.D", "M.E.", "Ph.D", "M.Tech", "Ph.D"]
designations = ["Assistant Professor", "Associate Professor", "Professor", "Assistant Professor", "Assistant Professor", "Associate Professor", "Assistant Professor"]

specializations_map = {
    "CE": ["Data Structures", "Machine Learning", "Computer Networks", "DBMS", "Software Engineering", "Operating Systems", "Cyber Security", "Cloud Computing"],
    "IT": ["Web Technologies", "Information Security", "Data Analytics", "IoT", "Software Testing", "Mobile Computing", "Network Administration", "ERP Systems"],
    "ME": ["Thermodynamics", "Manufacturing", "Fluid Mechanics", "Machine Design", "Robotics", "CAD/CAM", "Heat Transfer", "Industrial Engineering"],
    "CIV": ["Structural Engineering", "Geotechnical", "Transportation", "Environmental Engg", "Surveying", "Construction Management", "Water Resources", "Concrete Technology"],
    "EE": ["Power Systems", "Control Systems", "Power Electronics", "Electrical Machines", "Instrumentation", "Renewable Energy", "High Voltage Engg", "Signal Processing"],
    "ECE": ["VLSI Design", "Communication Systems", "Embedded Systems", "Signal Processing", "Microprocessors", "Antenna Design", "Wireless Networks", "Digital Electronics"],
    "AIDS": ["Deep Learning", "NLP", "Computer Vision", "Data Science", "Big Data", "Reinforcement Learning", "Statistical Learning", "AI Ethics"],
}

rows = []
faculty_id_counter = 1

for dept, dept_code in dept_codes.items():
    dept_subjects = curriculum[curriculum["department"] == dept].sort_values(["year", "semester"]).reset_index(drop=True)
    num_faculty = 10

    dept_faculty = []
    used_names = set()
    for i in range(num_faculty):
        while True:
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            if (fn, ln) not in used_names:
                used_names.add((fn, ln))
                break

        fid = f"FAC{dept_code}{faculty_id_counter:03d}"
        faculty_id_counter += 1

        qual = random.choice(qualifications)
        desig = random.choice(designations)
        exp = random.randint(3, 25)
        if qual == "Ph.D":
            exp = max(exp, 8)
        if desig == "Professor":
            exp = max(exp, 15)
            qual = "Ph.D"
        elif desig == "Associate Professor":
            exp = max(exp, 10)

        spec = random.choice(specializations_map[dept_code])
        join_year = 2024 - exp
        email = f"{fn.lower()}.{ln.lower()}@edusense.edu.in"
        phone = f"98{random.randint(10000000, 99999999)}"

        dept_faculty.append({
            "faculty_id": fid,
            "first_name": fn,
            "last_name": ln,
            "email": email,
            "phone": phone,
            "department": dept,
            "department_code": dept_code,
            "qualification": qual,
            "designation": desig,
            "specialization": spec,
            "experience_years": exp,
            "joining_year": join_year,
        })

    for idx, (_, subj_row) in enumerate(dept_subjects.iterrows()):
        fac = dept_faculty[idx % num_faculty]
        rows.append({
            "faculty_id": fac["faculty_id"],
            "first_name": fac["first_name"],
            "last_name": fac["last_name"],
            "email": fac["email"],
            "phone": fac["phone"],
            "department": fac["department"],
            "department_code": fac["department_code"],
            "qualification": fac["qualification"],
            "designation": fac["designation"],
            "specialization": fac["specialization"],
            "experience_years": fac["experience_years"],
            "joining_year": fac["joining_year"],
            "subject_code": subj_row["subject_code"],
            "subject_name": subj_row["subject_name"],
            "subject_type": subj_row["subject_type"],
            "year": subj_row["year"],
            "semester": subj_row["semester"],
        })

df = pd.DataFrame(rows)
os.makedirs("data/raw", exist_ok=True)
df.to_csv("data/raw/faculty_subject_mapping.csv", index=False)
print(f"Generated {len(df)} rows, {df['faculty_id'].nunique()} unique faculty")
print(f"Columns: {df.columns.tolist()}")
print(f"\nSample:")
print(df.head(5).to_string())
print(f"\nFaculty per dept:")
print(df.groupby("department")["faculty_id"].nunique())
print(f"\nSubjects per faculty (avg): {len(df) / df['faculty_id'].nunique():.1f}")
