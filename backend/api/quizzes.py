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
