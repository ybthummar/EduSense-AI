"""Student context service with full academic analysis for personalized AI responses."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from services.dataset_service import (
    get_student_academic_history,
    get_student_dashboard,
    get_student_recommendations,
)


def _to_float(value: Any, default: Optional[float] = None) -> Optional[float]:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _trend(values: List[float], tolerance: float) -> str:
    if len(values) < 2:
        return "insufficient_data"

    delta = values[-1] - values[0]
    if delta > tolerance:
        return "improving"
    if delta < -tolerance:
        return "declining"
    return "stable"


def _subject_bands(subject_performance: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    weak: List[str] = []
    strong: List[str] = []

    for item in subject_performance:
        subject = str(item.get("subject", "")).strip()
        marks = _to_float(item.get("marks"))
        if not subject or marks is None:
            continue

        if marks < 55:
            weak.append(subject)
        elif marks >= 75:
            strong.append(subject)

    if not weak and subject_performance:
        sorted_subjects = sorted(
            subject_performance,
            key=lambda x: _to_float(x.get("marks"), 100.0),
        )
        fallback = str(sorted_subjects[0].get("subject", "")).strip()
        if fallback:
            weak = [fallback]

    return {
        "weak": weak,
        "strong": strong,
    }


def _build_risk_factors(metrics: Dict[str, Any]) -> List[str]:
    factors: List[str] = []

    attendance = _to_float(metrics.get("attendance_percentage"))
    cgpa = _to_float(metrics.get("cgpa"))
    marks = _to_float(metrics.get("average_marks"))
    backlog_count = int(metrics.get("backlog_count") or 0)
    stress = str(metrics.get("stress_level") or "").strip().lower()

    if attendance is not None and attendance < 75:
        factors.append("low attendance")
    if cgpa is not None and cgpa < 6.5:
        factors.append("below-target CGPA")
    if marks is not None and marks < 55:
        factors.append("low average marks")
    if backlog_count > 0:
        factors.append(f"{backlog_count} active backlog(s)")
    if stress in {"high", "very high", "severe"}:
        factors.append("elevated stress level")

    return factors


def _build_insights(
    metrics: Dict[str, Any],
    trends: Dict[str, str],
    weak_subjects: List[str],
) -> List[str]:
    insights: List[str] = []

    cgpa = _to_float(metrics.get("cgpa"))
    attendance = _to_float(metrics.get("attendance_percentage"))
    risk_level = str(metrics.get("risk_level") or "Unknown")

    if cgpa is not None:
        insights.append(f"Current CGPA is {cgpa:.2f} with an overall {trends['cgpa']} trend.")
    if attendance is not None:
        insights.append(
            f"Attendance is {attendance:.1f}% and trend is {trends['attendance']}."
        )

    if weak_subjects:
        insights.append(
            "Priority subjects for improvement: " + ", ".join(weak_subjects[:3]) + "."
        )

    insights.append(f"Current academic risk level is {risk_level}.")
    return insights


def get_student_context(student_id: Optional[str] = None) -> Dict[str, Any]:
    """Build rich student context to personalize AI answers."""
    context: Dict[str, Any] = {
        "student_id": student_id,
        "department": None,
        "year": None,
        "cgpa": None,
        "attendance": None,
        "average_marks": None,
        "risk_level": None,
        "risk_score": None,
        "weak_subjects": [],
        "strong_subjects": [],
        "risk_factors": [],
        "trends": {
            "cgpa": "insufficient_data",
            "attendance": "insufficient_data",
            "marks": "insufficient_data",
        },
        "latest_metrics": {},
        "insights": [],
        "recommendations": [],
    }

    if not student_id:
        return context

    try:
        dashboard = get_student_dashboard(student_id=student_id)
        history = get_student_academic_history(student_id=student_id)
        recommendations = get_student_recommendations(student_id=student_id)
    except (ValueError, Exception):
        return context

    metrics = dashboard.get("latest_metrics", {})
    subject_performance = dashboard.get("subject_performance", [])
    semesters = history.get("semesters", [])

    cgpa_values = [_to_float(s.get("cgpa"), 0.0) for s in semesters if s.get("cgpa") is not None]
    attendance_values = [
        _to_float(s.get("attendance_percentage"), 0.0)
        for s in semesters
        if s.get("attendance_percentage") is not None
    ]
    marks_values = [
        _to_float(s.get("average_marks"), 0.0)
        for s in semesters
        if s.get("average_marks") is not None
    ]

    trends = {
        "cgpa": _trend(cgpa_values, tolerance=0.2),
        "attendance": _trend(attendance_values, tolerance=2.0),
        "marks": _trend(marks_values, tolerance=2.0),
    }

    bands = _subject_bands(subject_performance)
    risk_factors = _build_risk_factors(metrics)

    context.update(
        {
            "student_id": dashboard.get("student_id") or student_id,
            "department": dashboard.get("department"),
            "year": dashboard.get("year"),
            "cgpa": _to_float(metrics.get("cgpa")),
            "attendance": _to_float(metrics.get("attendance_percentage")),
            "average_marks": _to_float(metrics.get("average_marks")),
            "risk_level": metrics.get("risk_level"),
            "risk_score": _to_float(metrics.get("academic_risk_score")),
            "weak_subjects": bands["weak"],
            "strong_subjects": bands["strong"],
            "risk_factors": risk_factors,
            "trends": trends,
            "latest_metrics": metrics,
            "recommendations": recommendations[:5],
            "insights": _build_insights(metrics, trends, bands["weak"]),
        }
    )

    return context


def build_context_prompt(context: Dict[str, Any], topic: str) -> str:
    """Build a prompt segment describing the student's academic situation."""
    if not context or not context.get("student_id"):
        return ""

    lines: List[str] = ["--- Student Academic Context ---"]
    lines.append(f"Student ID: {context.get('student_id')}")

    if context.get("department"):
        lines.append(f"Department: {context['department']}")
    if context.get("year"):
        lines.append(f"Year: {context['year']}")
    if context.get("cgpa") is not None:
        lines.append(f"CGPA: {context['cgpa']:.2f}")
    if context.get("attendance") is not None:
        lines.append(f"Attendance: {context['attendance']:.1f}%")
    if context.get("average_marks") is not None:
        lines.append(f"Average Marks: {context['average_marks']:.1f}")
    if context.get("risk_level"):
        lines.append(f"Risk Level: {context['risk_level']}")

    trends = context.get("trends", {})
    lines.append(
        "Trends -> "
        f"CGPA: {trends.get('cgpa', 'n/a')}, "
        f"Attendance: {trends.get('attendance', 'n/a')}, "
        f"Marks: {trends.get('marks', 'n/a')}"
    )

    if context.get("weak_subjects"):
        lines.append("Weak Subjects: " + ", ".join(context["weak_subjects"][:4]))
    if context.get("strong_subjects"):
        lines.append("Strong Subjects: " + ", ".join(context["strong_subjects"][:4]))
    if context.get("risk_factors"):
        lines.append("Risk Factors: " + ", ".join(context["risk_factors"][:4]))

    if context.get("insights"):
        lines.append("Insights:")
        for insight in context["insights"][:4]:
            lines.append(f"- {insight}")

    topic_clean = (topic or "").strip().lower()
    if topic_clean and context.get("weak_subjects"):
        for subj in context["weak_subjects"]:
            subj_lower = str(subj).lower()
            if subj_lower in topic_clean or topic_clean in subj_lower:
                lines.append(
                    f"Important: Topic '{topic}' is related to weak subject '{subj}'. "
                    "Give extra clarity, examples, and practice steps."
                )
                break

    return "\n".join(lines)


def build_personalized_recommendation(context: Dict[str, Any], topic: str = "") -> Optional[str]:
    """Return one short personalized recommendation for the chat UI."""
    if not context or not context.get("student_id"):
        return None

    weak_subjects = context.get("weak_subjects", [])
    risk_factors = context.get("risk_factors", [])
    recommendations = context.get("recommendations", [])

    if weak_subjects and topic:
        topic_lower = topic.lower()
        for subject in weak_subjects:
            subject_lower = str(subject).lower()
            if subject_lower in topic_lower or topic_lower in subject_lower:
                return (
                    f"'{subject}' is currently a weak area. Spend 30-40 focused minutes daily on it "
                    "and attempt one short practice set after each study session."
                )

    if recommendations:
        top = recommendations[0]
        return f"{top.get('title')}: {top.get('description')}"

    if risk_factors:
        return "Key focus areas for you now: " + ", ".join(risk_factors[:3]) + "."

    return "Your profile is stable. Keep consistent revision and weekly progress tracking."

