"""Agent-style orchestration for student-aware RAG chat responses."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from rag.rag_service import query_rag
from services.search_service import search_docs
from services.student_context import (
    build_context_prompt,
    build_personalized_recommendation,
    get_student_context,
)
from services.topic_extractor import extract_topic
from services.web_scraper import scrape_web_content


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log_step(name: str, status: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "step": name,
        "status": status,
        "details": details or {},
        "timestamp": _now_iso(),
    }


def _public_student_context(context: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "student_id": context.get("student_id"),
        "department": context.get("department"),
        "year": context.get("year"),
        "cgpa": context.get("cgpa"),
        "attendance": context.get("attendance"),
        "average_marks": context.get("average_marks"),
        "risk_level": context.get("risk_level"),
        "weak_subjects": context.get("weak_subjects", []),
        "strong_subjects": context.get("strong_subjects", []),
        "subject_performance": context.get("subject_performance", []),
        "trends": context.get("trends", {}),
        "risk_factors": context.get("risk_factors", []),
        "insights": context.get("insights", []),
    }


def _find_subject_by_name(subject_performance: List[Dict[str, Any]], query: str) -> Optional[Dict[str, Any]]:
    query_lower = (query or "").strip().lower()
    for sub in subject_performance or []:
        name = str(sub.get("subject", "")).lower()
        code = str(sub.get("subject_code", "")).lower()
        if query_lower in name or query_lower in code or name in query_lower or code in query_lower:
            return sub
    return None


def _dataset_direct_response(message: str, context: Dict[str, Any]) -> (Optional[str], bool):
    """Return (answer, handled). handled=True if this is a student-data question.

    If handled is True and answer is None, then it means data was requested but not available.
    """
    if not context or not context.get("student_id"):
        return None, False

    query = (message or "").lower()
    weak = context.get("weak_subjects", [])
    strong = context.get("strong_subjects", [])
    subj_perf = context.get("subject_performance", [])
    cgpa = context.get("cgpa")
    attendance = context.get("attendance")
    average_marks = context.get("average_marks")
    risk_level = context.get("risk_level")

    is_student_query = any(k in query for k in ["cgpa", "attendance", "average mark", "avg mark", "marks", "risk", "weak subject", "strong subject", "my subject", "subject" , "grade"])

    if "weak subject" in query or "weakest" in query or ("improve" in query and "subject" in query):
        if weak:
            return f"Your current weak subjects are: {', '.join(weak[:4])}. Focus on these to improve overall performance.", True
        return "No weak subject data is available right now.", True

    if "strong subject" in query or "best subject" in query:
        if strong:
            return f"Your strong subjects are: {', '.join(strong[:4])}. Keep practicing these to maintain your strength.", True
        return "No strong subject data is available right now.", True

    if "cgpa" in query:
        if cgpa is not None:
            return f"Your current CGPA is {cgpa:.2f}.", True
        return "CGPA details are not available in your profile yet.", True

    if "attendance" in query:
        if attendance is not None:
            return f"Your current attendance is {attendance:.1f}%. Aim for above 85% with regular class participation.", True
        return "Attendance details are not available in your profile yet.", True

    if ("average mark" in query or "avg mark" in query or ("average" in query and "marks" in query)):
        if average_marks is not None:
            return f"Your average marks are {average_marks:.2f}.", True
        return "Average marks are not available yet.", True

    if "risk" in query:
        if risk_level:
            return f"Your academic risk level is {risk_level}.", True
        return "Risk level is not determined yet from your data.", True

    # subject-specific grades query, e.g. "marks in data structures"
    for sub in subj_perf or []:
        subject_name = str(sub.get("subject", "")).lower()
        subject_code = str(sub.get("subject_code", "")).lower()
        if subject_name and (subject_name in query or query in subject_name or subject_code in query or query in subject_code):
            marks = sub.get("marks")
            if marks is not None:
                return f"Your latest recorded marks for {sub.get('subject')} are {marks}/100.", True
            return None, True

    if is_student_query:
        return "No matching academic profile data found for this query.", True

    return None, False


def _build_combined_knowledge(web_text: str, search_result: Dict[str, Any]) -> str:
    sections: List[str] = []

    if web_text:
        sections.append(f"Web Knowledge:\n{web_text[:1200]}")

    summary = (search_result.get("summary") or "").strip()
    snippets = search_result.get("snippets", []) or []

    if summary:
        sections.append(f"Search Summary:\n{summary}")

    if snippets:
        snippet_block = "\n".join(f"- {item}" for item in snippets[:5])
        sections.append(f"Search Snippets:\n{snippet_block}")

    return "\n\n".join(sections)


def run_student_agent_workflow(message: str, student_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Runs an agent-like sequence:
    1) topic extraction
    2) student profile analysis
    3) web/doc retrieval tools
    4) RAG response generation
    """
    workflow: List[Dict[str, Any]] = []

    topic = extract_topic(message)
    workflow.append(_log_step("extract_topic", "completed", {"topic": topic}))

    student_context = get_student_context(student_id)
    has_profile = bool(student_context.get("student_id"))
    workflow.append(
        _log_step(
            "analyze_student_profile",
            "completed" if has_profile else "skipped",
            {
                "student_found": has_profile,
                "risk_level": student_context.get("risk_level"),
                "weak_subjects": student_context.get("weak_subjects", []),
            },
        )
    )

    # First try dataset-driven response from student academic context before invoking external search/LLM.
    direct_answer, handled = _dataset_direct_response(message, student_context)
    if handled:
        workflow.append(_log_step("dataset_direct_answer", "completed", {"answer": direct_answer or "No matching academic profile data found."}))
        return {
            "topic": topic,
            "answer": direct_answer or "No matching academic profile data found in your profile.",
            "recommendation": build_personalized_recommendation(student_context, topic),
            "student_context": _public_student_context(student_context),
            "analysis": {
                "risk_level": student_context.get("risk_level"),
                "risk_factors": student_context.get("risk_factors", []),
                "trends": student_context.get("trends", {}),
                "insights": student_context.get("insights", []),
                "recommended_actions": student_context.get("recommendations", []),
            },
            "knowledge": {},
            "workflow": workflow,
            "source": "dataset_direct",
        }

    search_query = topic or message
    search_result = search_docs(search_query)
    workflow.append(
        _log_step(
            "search_docs",
            "completed",
            {
                "source": search_result.get("source"),
                "snippets": len(search_result.get("snippets", [])),
                "has_summary": bool(search_result.get("summary")),
            },
        )
    )

    web_knowledge = scrape_web_content(search_query)
    workflow.append(
        _log_step(
            "scrape_web_context",
            "completed",
            {
                "chars": len(web_knowledge or ""),
            },
        )
    )

    context_prompt = build_context_prompt(student_context, topic)
    combined_knowledge = _build_combined_knowledge(web_knowledge, search_result)

    answer = query_rag(
        message,
        extra_context=combined_knowledge,
        student_context=context_prompt,
        student_context_dict=student_context,
    )
    workflow.append(
        _log_step(
            "generate_answer",
            "completed",
            {
                "answer_chars": len(answer or ""),
            },
        )
    )

    recommendation = build_personalized_recommendation(student_context, topic)

    return {
        "topic": topic,
        "answer": answer,
        "recommendation": recommendation,
        "student_context": _public_student_context(student_context),
        "analysis": {
            "risk_level": student_context.get("risk_level"),
            "risk_factors": student_context.get("risk_factors", []),
            "trends": student_context.get("trends", {}),
            "insights": student_context.get("insights", []),
            "recommended_actions": student_context.get("recommendations", []),
        },
        "knowledge": {
            "web_excerpt": (web_knowledge or "")[:700],
            "search_summary": search_result.get("summary"),
            "search_snippets": search_result.get("snippets", []),
        },
        "workflow": workflow,
        "source": "query_rag",
    }

