"""
Chat Schemas
────────────
Pydantic models for the dual-mode chat API.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatQueryRequest(BaseModel):
    mode: str = Field(..., pattern="^(rag|llm)$", description="'rag' or 'llm'")
    message: str = Field(..., min_length=1, max_length=4000)


class SourceRef(BaseModel):
    title: str
    entity_type: str
    entity_id: str
    source_table: str
    relevance_score: Optional[float] = None


class ChatQueryResponse(BaseModel):
    mode: str
    answer: str
    sources: List[SourceRef] = []
    retrieved_chunks: List[Dict[str, Any]] = []


class BuildIndexResponse(BaseModel):
    status: str
    documents_indexed: int
