import re
from typing import List

from rag.vector_store import get_faiss_index


def _clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_sentences(text: str, max_items: int = 3) -> List[str]:
    if not text:
        return []

    chunks = re.split(r"(?<=[.!?])\s+", _clean_text(text))
    points: List[str] = []

    for sentence in chunks:
        sentence = sentence.strip()
        if len(sentence) < 25:
            continue
        points.append(sentence)
        if len(points) >= max_items:
            break

    return points


def _format_key_points(points: List[str]) -> str:
    if not points:
        return "- Build fundamentals first, then solve 2-3 practice questions daily."
    return "\n".join(f"- {point}" for point in points)


def query_rag(query: str, extra_context: str = "", student_context: str = "") -> str:
    """Retrieve relevant context and return a structured educational response."""
    index = get_faiss_index()

    course_snippets: List[str] = []
    if index:
        try:
            docs = index.similarity_search(query, k=4)
            course_snippets = [_clean_text(doc.page_content) for doc in docs if doc.page_content]
        except Exception:
            course_snippets = []

    key_points: List[str] = []
    if course_snippets:
        joined = " ".join(course_snippets[:2])
        key_points.extend(_extract_sentences(joined, max_items=3))

    if not key_points and extra_context:
        key_points.extend(_extract_sentences(extra_context, max_items=3))

    lines: List[str] = []
    lines.append(f"Topic: {query}")
    lines.append("")
    lines.append("Core explanation:")
    lines.append(_format_key_points(key_points))

    if student_context:
        lines.append("")
        lines.append("Personalized guidance for this student:")
        lines.append(
            "- Use the student profile context to simplify weak areas first and prioritize high-impact revision topics."
        )
        lines.append(
            "- Maintain a short daily plan: concept review, one solved example, and one independent practice question."
        )

    lines.append("")
    lines.append("Action plan (next 7 days):")
    lines.append("- Day 1-2: Review fundamentals and class notes for this topic.")
    lines.append("- Day 3-4: Solve medium-level problems and verify mistakes.")
    lines.append("- Day 5-6: Attempt timed practice and past questions.")
    lines.append("- Day 7: Summarize key formulas/concepts and self-test.")

    if extra_context:
        excerpt = _clean_text(extra_context)[:380]
        if excerpt:
            lines.append("")
            lines.append("Reference context:")
            lines.append(f"- {excerpt}")

    return "\n".join(lines)

