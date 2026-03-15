"""
FAISS Vector Store for the analytics RAG pipeline
──────────────────────────────────────────────────
Builds, saves and loads a FAISS index from the documents
produced by document_builder.py.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from ai.rag.embeddings import get_embeddings

INDEX_DIR = Path(__file__).resolve().parents[1].parent / "ai_faiss_index"


def build_index(documents: List[dict]) -> FAISS:
    """
    Build a FAISS index from a list of document dicts
    (each must have 'content', 'document_id', 'entity_type', 'title', etc.).
    Saves to disk and returns the store.
    """
    lc_docs = []
    for d in documents:
        lc_docs.append(
            Document(
                page_content=d["content"],
                metadata={
                    "document_id": d.get("document_id", ""),
                    "entity_type": d.get("entity_type", ""),
                    "entity_id": d.get("entity_id", ""),
                    "title": d.get("title", ""),
                    "source_table": d.get("source_table", ""),
                    **(d.get("metadata") or {}),
                },
            )
        )

    embeddings = get_embeddings()
    store = FAISS.from_documents(lc_docs, embeddings)
    os.makedirs(INDEX_DIR, exist_ok=True)
    store.save_local(str(INDEX_DIR))
    print(f"✓ FAISS index saved to {INDEX_DIR}  ({len(lc_docs)} docs)")
    return store


def load_index() -> Optional[FAISS]:
    """Load a previously saved FAISS index. Returns None if missing."""
    if not INDEX_DIR.exists():
        return None
    try:
        embeddings = get_embeddings()
        return FAISS.load_local(
            str(INDEX_DIR), embeddings, allow_dangerous_deserialization=True
        )
    except Exception as e:
        print(f"⚠ Failed to load FAISS index: {e}")
        return None
