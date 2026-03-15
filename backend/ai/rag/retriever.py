"""
Retriever
─────────
Thin wrapper around the FAISS vector store for similarity search.
Returns top-k relevant documents with metadata.
"""

from __future__ import annotations

from typing import Any, Dict, List

from ai.rag.vector_store import load_index


def retrieve(query: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Search the analytics FAISS index and return the top-k chunks
    as dicts with 'content', 'title', 'entity_type', 'source_table', etc.
    """
    index = load_index()
    if index is None:
        return []

    results = index.similarity_search_with_score(query, k=k)
    chunks = []
    for doc, score in results:
        chunks.append({
            "content": doc.page_content,
            "title": doc.metadata.get("title", ""),
            "entity_type": doc.metadata.get("entity_type", ""),
            "entity_id": doc.metadata.get("entity_id", ""),
            "source_table": doc.metadata.get("source_table", ""),
            "relevance_score": round(float(score), 4),
        })
    return chunks
