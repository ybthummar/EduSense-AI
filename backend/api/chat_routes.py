"""
Chat Routes — Dual-mode AI assistant
─────────────────────────────────────
POST /api/ai/chat/query         — Ask RAG or Gemini
POST /api/ai/chat/build-rag-index — Rebuild the FAISS index from gold data
"""

from fastapi import APIRouter, HTTPException

from ai.chat.schemas import (
    ChatQueryRequest,
    ChatQueryResponse,
    BuildIndexResponse,
)
from ai.chat.chat_service import handle_chat

router = APIRouter()


@router.post("/query", response_model=ChatQueryResponse)
def chat_query(req: ChatQueryRequest):
    """
    Dual-mode chat endpoint.

    - mode = "rag"  → answer grounded in internal analytics data
    - mode = "llm"  → general Gemini AI answer
    """
    try:
        result = handle_chat(mode=req.mode, message=req.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/build-rag-index", response_model=BuildIndexResponse)
def build_rag_index():
    """
    Rebuild the FAISS RAG index from gold-layer analytics data.
    Should be called once after ETL pipeline runs or data changes.
    """
    try:
        from ai.rag.document_builder import build_all_documents
        from ai.rag.vector_store import build_index

        docs = build_all_documents()
        if not docs:
            raise HTTPException(
                status_code=400,
                detail="No documents were generated from gold data.",
            )
        build_index(docs)
        return {"status": "ok", "documents_indexed": len(docs)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
