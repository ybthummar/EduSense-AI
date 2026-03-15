"""
Gemini LLM Service
──────────────────
General-purpose AI assistant powered by Google Gemini.
Loads API key from .env — no hardcoded keys.
"""

from __future__ import annotations

import os
from typing import Dict

from langchain_google_genai import ChatGoogleGenerativeAI

from ai.rag.prompts import LLM_SYSTEM_PROMPT
from config import GOOGLE_API_KEY

# Model can be overridden via env
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


def query_gemini(message: str) -> Dict[str, str]:
    """
    Send a general question to Gemini and return the answer.

    Returns
    -------
    {"answer": str}
    """
    if not GOOGLE_API_KEY:
        return {
            "answer": "Gemini API key is not configured. "
                      "Please set GEMINI_API_KEY in backend/.env."
        }

    prompt = f"{LLM_SYSTEM_PROMPT}\n\nUser: {message}\n\nAssistant:"

    try:
        llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GOOGLE_API_KEY,
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            timeout=15,
            max_retries=0,
        )
        result = llm.invoke(prompt)
        answer = result.content.strip() if hasattr(result, "content") else str(result).strip()
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            answer = (
                "The Gemini AI service is temporarily unavailable because "
                "the API quota has been exceeded. Please try again in a "
                "few minutes, or switch to **RAG Assistant** mode to query "
                "your internal analytics data (which works offline)."
            )
        else:
            answer = f"Sorry, the Gemini API returned an error. Please try again later."

    return {"answer": answer}
