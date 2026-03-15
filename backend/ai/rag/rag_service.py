"""
RAG Service
───────────
Orchestrates: retrieve → build prompt → call Gemini → return grounded answer.
"""

from __future__ import annotations

from typing import Any, Dict

from langchain_google_genai import ChatGoogleGenerativeAI

from ai.rag.retriever import retrieve
from ai.rag.prompts import RAG_SYSTEM_PROMPT
from config import GOOGLE_API_KEY


def query_rag(question: str, k: int = 5) -> Dict[str, Any]:
    """
    Answer a question grounded in our internal analytics data.

    Returns
    -------
    {
        "answer": str,
        "sources": [{"title", "entity_type", "entity_id", "source_table", "relevance_score"}],
        "retrieved_chunks": [{"content", ...}],
    }
    """
    # 1. Retrieve relevant chunks
    chunks = retrieve(question, k=k)

    if not chunks:
        return {
            "answer": "The RAG index has not been built yet. "
                      "Please ask an admin to build the index first via the `/api/ai/chat/build-rag-index` endpoint.",
            "sources": [],
            "retrieved_chunks": [],
        }

    # 2. Assemble context
    context_parts = []
    for i, c in enumerate(chunks, 1):
        context_parts.append(
            f"[Source {i} — {c['title']}]\n{c['content']}"
        )
    context_text = "\n\n".join(context_parts)

    # 3. Build prompt
    prompt_text = RAG_SYSTEM_PROMPT.format(
        context=context_text, question=question
    )

    # 4. Call Gemini
    if not GOOGLE_API_KEY:
        # No API key — return context directly
        return {
            "answer": "Gemini API key is not configured. Here is the retrieved context:\n\n" + context_text,
            "sources": _extract_sources(chunks),
            "retrieved_chunks": chunks,
        }

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3,
            top_p=0.85,
            timeout=15,
            max_retries=0,
        )
        result = llm.invoke(prompt_text)
        answer = result.content.strip() if hasattr(result, "content") else str(result).strip()
    except Exception as e:
        # Quota exhausted or other API error — build a readable answer
        # from the retrieved data instead of showing a raw error.
        answer = _build_offline_answer(question, chunks)

    return {
        "answer": answer,
        "sources": _extract_sources(chunks),
        "retrieved_chunks": chunks,
    }


def _build_offline_answer(question: str, chunks: list) -> str:
    """
    When the Gemini LLM is unavailable (quota / network), synthesise a
    plain-text answer directly from the retrieved chunks.
    """
    lines = [f"Here is what I found in the internal data for: *{question}*\n"]
    for i, c in enumerate(chunks, 1):
        # Use the title as a header, then the content
        lines.append(f"**{i}. {c['title']}**")
        lines.append(c["content"].strip())
        lines.append("")  # blank separator
    lines.append(
        "_Note: The AI summariser is temporarily unavailable due to API "
        "quota limits. The raw data above is sourced directly from the "
        "analytics database._"
    )
    return "\n".join(lines)


def _extract_sources(chunks):
    """Deduplicate and return lightweight source references."""
    seen = set()
    sources = []
    for c in chunks:
        key = c.get("entity_id", c.get("title", ""))
        if key in seen:
            continue
        seen.add(key)
        sources.append({
            "title": c["title"],
            "entity_type": c["entity_type"],
            "entity_id": c["entity_id"],
            "source_table": c["source_table"],
            "relevance_score": c.get("relevance_score"),
        })
    return sources
