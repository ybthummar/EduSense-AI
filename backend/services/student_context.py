"""Student context service — fetches academic data to enrich AI responses."""

from typing import Any, Dict, List, Optional

from services.dataset_service import get_student_dashboard, load_dataset


def get_student_context(student_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Build a context dict with CGPA, attendance, weak subjects, quiz scores etc.
    This is injected into the RAG prompt to personalise answers.
    """
    context: Dict[str, Any] = {
        "cgpa": None,
        "attendance": None,
        "weak_subjects": [],
        "risk_level": None,
        "average_marks": None,
    }

    if not student_id:
        return context

    try:
        dashboard = get_student_dashboard(student_id=student_id)
    except (ValueError, Exception):
        return context

    metrics = dashboard.get("latest_metrics", {})
    context["cgpa"] = metrics.get("cgpa")
    context["attendance"] = metrics.get("attendance_percentage")
    context["average_marks"] = metrics.get("average_marks")
    context["risk_level"] = metrics.get("risk_level")

    # Determine weak subjects (marks < 50 or lowest-performing)
    subject_performance = dashboard.get("subject_performance", [])
    weak = [s["subject"] for s in subject_performance if s.get("marks", 100) < 50]
    if not weak and subject_performance:
        sorted_subjects = sorted(subject_performance, key=lambda s: s.get("marks", 100))
        weak = [sorted_subjects[0]["subject"]] if sorted_subjects else []
    context["weak_subjects"] = weak

    return context


def build_context_prompt(context: Dict[str, Any], topic: str) -> str:
    """Build a prompt segment describing the student's academic situation."""
    parts: List[str] = []

    if context.get("cgpa") is not None:
        parts.append(f"Student CGPA: {context['cgpa']}")
    if context.get("attendance") is not None:
        parts.append(f"Attendance: {context['attendance']}%")
    if context.get("average_marks") is not None:
        parts.append(f"Average marks: {context['average_marks']}")
    if context.get("risk_level"):
        parts.append(f"Academic risk level: {context['risk_level']}")
    if context.get("weak_subjects"):
        parts.append(f"Weak subjects: {', '.join(context['weak_subjects'])}")

    if not parts:
        return ""

    header = "--- Student Academic Context ---"
    body = "\n".join(parts)

    recommendation = ""
    weak = context.get("weak_subjects", [])
    if weak and topic:
        topic_lower = topic.lower()
        for subj in weak:
            if subj.lower() in topic_lower or topic_lower in subj.lower():
                recommendation = (
                    f"\nNote: The student is weak in {subj}. "
                    "Provide extra clarity, recommend practice resources, and suggest the playlist."
                )
                break

    return f"{header}\n{body}{recommendation}\n"
