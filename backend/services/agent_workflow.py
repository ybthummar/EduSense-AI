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
        "trends": context.get("trends", {}),
        "risk_factors": context.get("risk_factors", []),
        "insights": context.get("insights", []),
    }


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
    }

