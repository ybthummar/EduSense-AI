"""
Call Messages API - Fetch student call data from Supabase
GET /api/calls - All call records
"""

import os
from typing import Optional

from fastapi import APIRouter, Query, HTTPException
from supabase import create_client

router = APIRouter()

_SUPABASE_URL = os.getenv("SUPABASE_URL", "")
_SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or ""


def _get_supabase():
    if not _SUPABASE_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured")
    return create_client(_SUPABASE_URL, _SUPABASE_KEY)


@router.get("")
def get_calls(
    sentiment: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
):
    """Return call messages from the Supabase student_calls table."""
    sb = _get_supabase()
    q = sb.table("student_calls").select("*").order("created_at", desc=True).limit(limit)

    if sentiment:
        q = q.eq("sentiment", sentiment)

    res = q.execute()
    rows = res.data or []

    calls = []
    for r in rows:
        calls.append({
            "user_message": r.get("user_message"),
            "summary": r.get("summary"),
            "sentiment": r.get("sentiment"),
            "keywords": r.get("keywords") or [],
            "difficulty_level": r.get("difficulty_level"),
            "created_at": r.get("created_at"),
        })

    return {"calls": calls, "count": len(calls)}
