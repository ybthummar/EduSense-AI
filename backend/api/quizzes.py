"""Quiz API — CRUD, attempt, and scoring endpoints."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.firebase import get_firestore, next_sequence

router = APIRouter()


# ---- Schemas ----

class QuestionSchema(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str  # "A" | "B" | "C" | "D"


class QuizCreateSchema(BaseModel):
    title: str
    subject: str
    faculty_id: Optional[str] = None
    faculty_name: Optional[str] = None
    scheduled_date: Optional[str] = None
    duration_minutes: Optional[int] = 30
    status: Optional[str] = "scheduled"
    questions: List[QuestionSchema]


class AnswerSchema(BaseModel):
    question_id: int
    selected_option: str


class QuizAttemptSchema(BaseModel):
    quiz_id: int
    student_id: str
    answers: List[AnswerSchema]


# ---- Endpoints ----

@router.post("/create")
def create_quiz(data: QuizCreateSchema):
    """Faculty creates a quiz with questions."""
    db = get_firestore()
    quiz_id = next_sequence("quiz_id")
    quiz_ref = db.collection("quizzes").document(str(quiz_id))

    quiz_ref.set(
        {
            "id": quiz_id,
            "title": data.title,
            "subject": data.subject,
            "faculty_id": data.faculty_id or "",
            "faculty_name": data.faculty_name or "",
            "scheduled_date": data.scheduled_date or "",
            "duration_minutes": data.duration_minutes or 30,
            "status": data.status or "scheduled",
            "created_at": datetime.utcnow().isoformat(),
            "question_count": len(data.questions),
        }
    )

    for idx, q in enumerate(data.questions, start=1):
        quiz_ref.collection("questions").document(str(idx)).set(
            {
                "id": idx,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "correct_option": q.correct_option.upper(),
            }
        )

    return {"message": "Quiz created", "quiz_id": quiz_id}


@router.get("/list")
def list_quizzes(subject: Optional[str] = None):
    """List all available quizzes."""
    db = get_firestore()
    quizzes = [doc.to_dict() for doc in db.collection("quizzes").stream()]
    if subject:
        needle = subject.lower()
        quizzes = [q for q in quizzes if needle in q.get("subject", "").lower()]

    quizzes.sort(key=lambda q: q.get("id", 0))
    return quizzes


@router.get("/results")
def get_all_results():
    """Get all quiz attempt results (for faculty dashboard)."""
    db = get_firestore()
    attempts = [doc.to_dict() for doc in db.collection("quiz_attempts").stream()]
    attempts.sort(key=lambda a: a.get("submitted_at", ""), reverse=True)
    return attempts


@router.get("/{quiz_id}")
def get_quiz(quiz_id: int):
    """Get quiz details with questions (correct answers hidden)."""
    db = get_firestore()
    quiz_doc = db.collection("quizzes").document(str(quiz_id)).get()
    if not quiz_doc.exists:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz = quiz_doc.to_dict()
    questions = [q.to_dict() for q in quiz_doc.reference.collection("questions").stream()]
    questions.sort(key=lambda q: q.get("id", 0))

    return {
        "id": quiz.get("id", quiz_id),
        "title": quiz.get("title"),
        "subject": quiz.get("subject"),
        "faculty_name": quiz.get("faculty_name", ""),
        "scheduled_date": quiz.get("scheduled_date", ""),
        "duration_minutes": quiz.get("duration_minutes", 30),
        "status": quiz.get("status", "scheduled"),
        "questions": [
            {
                "id": q.get("id"),
                "question_text": q.get("question_text"),
                "option_a": q.get("option_a"),
                "option_b": q.get("option_b"),
                "option_c": q.get("option_c"),
                "option_d": q.get("option_d"),
            }
            for q in questions
        ],
    }


@router.post("/submit")
def submit_quiz(attempt: QuizAttemptSchema):
    """Student submits answers; auto-scored."""
    db = get_firestore()
    quiz_doc = db.collection("quizzes").document(str(attempt.quiz_id)).get()
    if not quiz_doc.exists:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz_data = quiz_doc.to_dict()
    questions = [q.to_dict() for q in quiz_doc.reference.collection("questions").stream()]
    question_map = {int(q.get("id")): q.get("correct_option") for q in questions}
    total = len(question_map)
    correct = 0

    for ans in attempt.answers:
        if ans.question_id in question_map:
            if ans.selected_option.upper() == question_map[ans.question_id]:
                correct += 1

    score = round((correct / total) * 100, 2) if total > 0 else 0

    db.collection("quiz_attempts").add(
        {
            "quiz_id": attempt.quiz_id,
            "quiz_title": quiz_data.get("title", ""),
            "subject": quiz_data.get("subject", ""),
            "student_id": attempt.student_id,
            "score": score,
            "total_questions": total,
            "correct_answers": correct,
            "submitted_at": datetime.utcnow().isoformat(),
        }
    )

    return {
        "score": score,
        "correct": correct,
        "total": total,
        "message": f"You scored {correct}/{total} ({score}%)",
    }


@router.get("/attempts/{student_id}")
def get_student_attempts(student_id: str):
    """Get all quiz attempts for a student."""
    db = get_firestore()
    attempts = [
        doc.to_dict()
        for doc in db.collection("quiz_attempts").where("student_id", "==", student_id).stream()
    ]
    attempts.sort(key=lambda a: a.get("submitted_at", ""), reverse=True)
    return attempts


@router.post("/seed")
def seed_quizzes():
    """Seed 8-9 dummy quizzes with questions for demo purposes."""
    db = get_firestore()

    dummy_quizzes = [
        {
            "title": "Data Structures Fundamentals",
            "subject": "Data Structures",
            "faculty_name": "Dr. Raghav Mehta",
            "scheduled_date": "2026-03-18",
            "duration_minutes": 30,
            "status": "scheduled",
            "questions": [
                {"question_text": "Which data structure uses LIFO principle?", "option_a": "Queue", "option_b": "Stack", "option_c": "Array", "option_d": "Linked List", "correct_option": "B"},
                {"question_text": "What is the time complexity of binary search?", "option_a": "O(n)", "option_b": "O(n log n)", "option_c": "O(log n)", "option_d": "O(1)", "correct_option": "C"},
                {"question_text": "Which traversal visits root first?", "option_a": "Inorder", "option_b": "Postorder", "option_c": "Preorder", "option_d": "Level order", "correct_option": "C"},
                {"question_text": "A queue follows which principle?", "option_a": "LIFO", "option_b": "FIFO", "option_c": "Random", "option_d": "Priority", "correct_option": "B"},
                {"question_text": "Hash table average lookup time?", "option_a": "O(n)", "option_b": "O(log n)", "option_c": "O(1)", "option_d": "O(n^2)", "correct_option": "C"},
            ],
        },
        {
            "title": "Operating Systems Quiz 1",
            "subject": "Operating Systems",
            "faculty_name": "Prof. Sunita Verma",
            "scheduled_date": "2026-03-20",
            "duration_minutes": 25,
            "status": "scheduled",
            "questions": [
                {"question_text": "Which scheduling algorithm is non-preemptive?", "option_a": "Round Robin", "option_b": "FCFS", "option_c": "SJF Preemptive", "option_d": "Priority Preemptive", "correct_option": "B"},
                {"question_text": "What is a deadlock?", "option_a": "Fast execution", "option_b": "Circular wait among processes", "option_c": "Memory leak", "option_d": "CPU overload", "correct_option": "B"},
                {"question_text": "Virtual memory uses which technique?", "option_a": "Caching", "option_b": "Paging", "option_c": "Buffering", "option_d": "Spooling", "correct_option": "B"},
                {"question_text": "Which is NOT a process state?", "option_a": "Running", "option_b": "Waiting", "option_c": "Compiling", "option_d": "Ready", "correct_option": "C"},
            ],
        },
        {
            "title": "DBMS Concepts",
            "subject": "Database Management",
            "faculty_name": "Dr. Amit Patel",
            "scheduled_date": "2026-03-22",
            "duration_minutes": 20,
            "status": "scheduled",
            "questions": [
                {"question_text": "Which normal form removes partial dependency?", "option_a": "1NF", "option_b": "2NF", "option_c": "3NF", "option_d": "BCNF", "correct_option": "B"},
                {"question_text": "SQL stands for?", "option_a": "Structured Query Language", "option_b": "Simple Query Logic", "option_c": "Standard Question Language", "option_d": "System Query Language", "correct_option": "A"},
                {"question_text": "Which join returns all rows from both tables?", "option_a": "Inner Join", "option_b": "Left Join", "option_c": "Full Outer Join", "option_d": "Cross Join", "correct_option": "C"},
                {"question_text": "ACID stands for?", "option_a": "Atomicity, Consistency, Isolation, Durability", "option_b": "Access, Control, Integrity, Data", "option_c": "Atomic, Concurrent, Isolated, Durable", "option_d": "None of these", "correct_option": "A"},
                {"question_text": "Primary key constraint ensures?", "option_a": "Null values", "option_b": "Duplicate values", "option_c": "Unique and not null", "option_d": "Foreign reference", "correct_option": "C"},
            ],
        },
        {
            "title": "Machine Learning Basics",
            "subject": "Machine Learning",
            "faculty_name": "Dr. Priya Sharma",
            "scheduled_date": "2026-03-15",
            "duration_minutes": 35,
            "status": "active",
            "questions": [
                {"question_text": "Which is a supervised learning algorithm?", "option_a": "K-Means", "option_b": "Linear Regression", "option_c": "PCA", "option_d": "DBSCAN", "correct_option": "B"},
                {"question_text": "Overfitting means?", "option_a": "Model is too simple", "option_b": "Model memorizes training data", "option_c": "Model underfits", "option_d": "Model generalizes well", "correct_option": "B"},
                {"question_text": "What does CNN stand for?", "option_a": "Central Neural Network", "option_b": "Convolutional Neural Network", "option_c": "Connected Node Network", "option_d": "Computed Neural Net", "correct_option": "B"},
                {"question_text": "Which metric is used for classification?", "option_a": "MSE", "option_b": "RMSE", "option_c": "F1-Score", "option_d": "MAE", "correct_option": "C"},
                {"question_text": "Gradient descent is used to?", "option_a": "Increase loss", "option_b": "Find maximum", "option_c": "Minimize cost function", "option_d": "Normalize data", "correct_option": "C"},
            ],
        },
        {
            "title": "Computer Networks Mid-Term",
            "subject": "Computer Networks",
            "faculty_name": "Prof. Karan Singh",
            "scheduled_date": "2026-03-12",
            "duration_minutes": 30,
            "status": "completed",
            "questions": [
                {"question_text": "OSI model has how many layers?", "option_a": "5", "option_b": "6", "option_c": "7", "option_d": "4", "correct_option": "C"},
                {"question_text": "TCP is a ___ protocol?", "option_a": "Connectionless", "option_b": "Connection-oriented", "option_c": "Stateless", "option_d": "Broadcast", "correct_option": "B"},
                {"question_text": "Which layer handles routing?", "option_a": "Transport", "option_b": "Network", "option_c": "Data Link", "option_d": "Session", "correct_option": "B"},
                {"question_text": "HTTP uses which port?", "option_a": "21", "option_b": "22", "option_c": "80", "option_d": "443", "correct_option": "C"},
            ],
        },
        {
            "title": "Python Programming Quiz",
            "subject": "Python Programming",
            "faculty_name": "Dr. Raghav Mehta",
            "scheduled_date": "2026-03-10",
            "duration_minutes": 20,
            "status": "completed",
            "questions": [
                {"question_text": "Python is which type of language?", "option_a": "Compiled", "option_b": "Interpreted", "option_c": "Assembly", "option_d": "Machine", "correct_option": "B"},
                {"question_text": "Which keyword defines a function?", "option_a": "func", "option_b": "define", "option_c": "def", "option_d": "function", "correct_option": "C"},
                {"question_text": "List is mutable in Python?", "option_a": "True", "option_b": "False", "option_c": "Depends", "option_d": "Only tuples", "correct_option": "A"},
                {"question_text": "Which is used for package management?", "option_a": "npm", "option_b": "pip", "option_c": "brew", "option_d": "gem", "correct_option": "B"},
                {"question_text": "What does len() return?", "option_a": "Type", "option_b": "Size in bytes", "option_c": "Number of elements", "option_d": "Memory address", "correct_option": "C"},
            ],
        },
        {
            "title": "Discrete Mathematics",
            "subject": "Discrete Mathematics",
            "faculty_name": "Prof. Sunita Verma",
            "scheduled_date": "2026-03-08",
            "duration_minutes": 25,
            "status": "completed",
            "questions": [
                {"question_text": "A set with no elements is called?", "option_a": "Universal set", "option_b": "Empty set", "option_c": "Subset", "option_d": "Power set", "correct_option": "B"},
                {"question_text": "De Morgan's law applies to?", "option_a": "Calculus", "option_b": "Set theory and logic", "option_c": "Number theory", "option_d": "Geometry", "correct_option": "B"},
                {"question_text": "A graph with no cycles is called?", "option_a": "Complete graph", "option_b": "Tree", "option_c": "Bipartite graph", "option_d": "Multigraph", "correct_option": "B"},
                {"question_text": "n! means?", "option_a": "n squared", "option_b": "n factorial", "option_c": "n cubed", "option_d": "n prime", "correct_option": "B"},
            ],
        },
        {
            "title": "Software Engineering Principles",
            "subject": "Software Engineering",
            "faculty_name": "Dr. Amit Patel",
            "scheduled_date": "2026-03-25",
            "duration_minutes": 20,
            "status": "scheduled",
            "questions": [
                {"question_text": "Which is NOT an SDLC model?", "option_a": "Waterfall", "option_b": "Agile", "option_c": "Spiral", "option_d": "Binary", "correct_option": "D"},
                {"question_text": "Unit testing tests?", "option_a": "Entire system", "option_b": "Individual components", "option_c": "User interface", "option_d": "Database", "correct_option": "B"},
                {"question_text": "UML stands for?", "option_a": "Unified Modeling Language", "option_b": "Universal Machine Language", "option_c": "Unified Machine Logic", "option_d": "None", "correct_option": "A"},
                {"question_text": "Scrum is a type of?", "option_a": "Waterfall", "option_b": "Agile framework", "option_c": "Testing tool", "option_d": "Database", "correct_option": "B"},
                {"question_text": "Code review is part of?", "option_a": "Deployment", "option_b": "Quality assurance", "option_c": "Requirements gathering", "option_d": "Maintenance", "correct_option": "B"},
            ],
        },
        {
            "title": "AI & Deep Learning Assessment",
            "subject": "Artificial Intelligence",
            "faculty_name": "Dr. Priya Sharma",
            "scheduled_date": "2026-03-28",
            "duration_minutes": 30,
            "status": "scheduled",
            "questions": [
                {"question_text": "What is the Turing Test?", "option_a": "Speed test", "option_b": "Test if machine exhibits intelligent behavior", "option_c": "Memory test", "option_d": "Network test", "correct_option": "B"},
                {"question_text": "ReLU is an?", "option_a": "Optimizer", "option_b": "Loss function", "option_c": "Activation function", "option_d": "Layer type", "correct_option": "C"},
                {"question_text": "Backpropagation is used for?", "option_a": "Data preprocessing", "option_b": "Weight updates in neural networks", "option_c": "Feature extraction", "option_d": "Clustering", "correct_option": "B"},
                {"question_text": "Which is an unsupervised algorithm?", "option_a": "SVM", "option_b": "Random Forest", "option_c": "K-Means", "option_d": "Logistic Regression", "correct_option": "C"},
            ],
        },
    ]

    # Seed dummy attempts for completed quizzes
    dummy_attempts = [
        {"student_id": "23AIML001", "score": 80.0, "correct_answers": 4, "total_questions": 5},
        {"student_id": "23AIML003", "score": 60.0, "correct_answers": 3, "total_questions": 5},
        {"student_id": "23CE005", "score": 100.0, "correct_answers": 4, "total_questions": 4},
        {"student_id": "23AIML001", "score": 75.0, "correct_answers": 3, "total_questions": 4},
        {"student_id": "23CE010", "score": 40.0, "correct_answers": 2, "total_questions": 5},
        {"student_id": "24IT002", "score": 80.0, "correct_answers": 4, "total_questions": 5},
        {"student_id": "23AIML003", "score": 50.0, "correct_answers": 2, "total_questions": 4},
        {"student_id": "23CE005", "score": 75.0, "correct_answers": 3, "total_questions": 4},
    ]

    created_ids = []
    completed_quiz_ids = []

    for q_data in dummy_quizzes:
        quiz_id = next_sequence("quiz_id")
        quiz_ref = db.collection("quizzes").document(str(quiz_id))
        quiz_ref.set({
            "id": quiz_id,
            "title": q_data["title"],
            "subject": q_data["subject"],
            "faculty_id": "",
            "faculty_name": q_data["faculty_name"],
            "scheduled_date": q_data["scheduled_date"],
            "duration_minutes": q_data["duration_minutes"],
            "status": q_data["status"],
            "created_at": datetime.utcnow().isoformat(),
            "question_count": len(q_data["questions"]),
        })
        for idx, ques in enumerate(q_data["questions"], start=1):
            quiz_ref.collection("questions").document(str(idx)).set({
                "id": idx,
                "question_text": ques["question_text"],
                "option_a": ques["option_a"],
                "option_b": ques["option_b"],
                "option_c": ques["option_c"],
                "option_d": ques["option_d"],
                "correct_option": ques["correct_option"],
            })
        created_ids.append(quiz_id)
        if q_data["status"] == "completed":
            completed_quiz_ids.append((quiz_id, q_data["title"], q_data["subject"]))

    # Add dummy attempts on completed quizzes
    attempt_idx = 0
    for quiz_id, title, subject in completed_quiz_ids:
        for _ in range(3):
            if attempt_idx >= len(dummy_attempts):
                break
            att = dummy_attempts[attempt_idx]
            db.collection("quiz_attempts").add({
                "quiz_id": quiz_id,
                "quiz_title": title,
                "subject": subject,
                "student_id": att["student_id"],
                "score": att["score"],
                "total_questions": att["total_questions"],
                "correct_answers": att["correct_answers"],
                "submitted_at": datetime.utcnow().isoformat(),
            })
            attempt_idx += 1

    return {"message": f"Seeded {len(created_ids)} quizzes with dummy attempts", "quiz_ids": created_ids}
