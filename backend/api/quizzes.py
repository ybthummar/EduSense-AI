"""Quiz API — CRUD, attempt, and scoring endpoints."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
import database.models as models

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
def create_quiz(data: QuizCreateSchema, db: Session = Depends(get_db)):
    """Faculty creates a quiz with questions."""
    quiz = models.Quiz(
        title=data.title,
        subject=data.subject,
        created_at=datetime.utcnow().isoformat(),
    )
    db.add(quiz)
    db.flush()

    for q in data.questions:
        question = models.QuizQuestion(
            quiz_id=quiz.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_option=q.correct_option.upper(),
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)
    return {"message": "Quiz created", "quiz_id": quiz.id}


@router.get("/list")
def list_quizzes(subject: Optional[str] = None, db: Session = Depends(get_db)):
    """List all available quizzes."""
    query = db.query(models.Quiz)
    if subject:
        query = query.filter(models.Quiz.subject.ilike(f"%{subject}%"))
    quizzes = query.all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "subject": q.subject,
            "question_count": len(q.questions),
            "created_at": q.created_at,
        }
        for q in quizzes
    ]


@router.get("/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Get quiz details with questions (correct answers hidden)."""
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return {
        "id": quiz.id,
        "title": quiz.title,
        "subject": quiz.subject,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
            }
            for q in quiz.questions
        ],
    }


@router.post("/submit")
def submit_quiz(attempt: QuizAttemptSchema, db: Session = Depends(get_db)):
    """Student submits answers; auto-scored."""
    quiz = db.query(models.Quiz).filter(models.Quiz.id == attempt.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    question_map = {q.id: q.correct_option for q in quiz.questions}
    total = len(question_map)
    correct = 0

    for ans in attempt.answers:
        if ans.question_id in question_map:
            if ans.selected_option.upper() == question_map[ans.question_id]:
                correct += 1

    score = round((correct / total) * 100, 2) if total > 0 else 0

    record = models.QuizAttempt(
        quiz_id=attempt.quiz_id,
        student_id=attempt.student_id,
        score=score,
        total_questions=total,
        correct_answers=correct,
        submitted_at=datetime.utcnow().isoformat(),
    )
    db.add(record)
    db.commit()

    return {
        "score": score,
        "correct": correct,
        "total": total,
        "message": f"You scored {correct}/{total} ({score}%)",
    }


@router.get("/attempts/{student_id}")
def get_student_attempts(student_id: str, db: Session = Depends(get_db)):
    """Get all quiz attempts for a student."""
    attempts = (
        db.query(models.QuizAttempt)
        .filter(models.QuizAttempt.student_id == student_id)
        .all()
    )
    return [
        {
            "quiz_id": a.quiz_id,
            "score": a.score,
            "total_questions": a.total_questions,
            "correct_answers": a.correct_answers,
            "submitted_at": a.submitted_at,
        }
        for a in attempts
    ]
