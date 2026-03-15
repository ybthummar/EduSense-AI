"""
Chat Service
─────────────
Routes requests to either the RAG pipeline or the Gemini LLM
based on the selected mode.
"""

from __future__ import annotations

from typing import Any, Dict

from ai.rag.rag_service import query_rag
from ai.llm.gemini_service import query_gemini


def handle_chat(mode: str, message: str) -> Dict[str, Any]:
    """
    Dispatch a chat message to the appropriate AI backend.

    Parameters
    ----------
    mode : "rag" | "llm"
    message : user question text

    Returns
    -------
    dict with at least { "mode", "answer" }
    """
    if mode == "rag":
        result = query_rag(message)
        return {
            "mode": "rag",
            "answer": result["answer"],
            "sources": result.get("sources", []),
            "retrieved_chunks": result.get("retrieved_chunks", []),
        }

    # mode == "llm"
    result = query_gemini(message)
    return {
        "mode": "llm",
        "answer": result["answer"],
        "sources": [],
        "retrieved_chunks": [],
    }
