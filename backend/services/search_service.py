"""Search tool service inspired by agent workflows (DuckDuckGo-backed)."""

from __future__ import annotations

from typing import Any, Dict, List

import requests


def _flatten_related_topics(items: List[Dict[str, Any]]) -> List[str]:
    results: List[str] = []
    for item in items or []:
        if isinstance(item, dict) and item.get("Text"):
            results.append(str(item["Text"]).strip())
            continue

        nested = item.get("Topics") if isinstance(item, dict) else None
        if isinstance(nested, list):
            for child in nested:
                if isinstance(child, dict) and child.get("Text"):
                    results.append(str(child["Text"]).strip())
    return results


def search_docs(query: str, limit: int = 3) -> Dict[str, Any]:
    """
    Query DuckDuckGo instant answer API and return concise knowledge snippets.
    Safe fallback when network is unavailable.
    """
    if not query:
        return {
            "summary": "",
            "snippets": [],
            "source": "empty_query",
        }

    url = "https://api.duckduckgo.com/"
    params = {
        "q": query,
        "format": "json",
        "no_html": 1,
        "skip_disambig": 1,
    }

    try:
        response = requests.get(url, params=params, timeout=8)
        response.raise_for_status()
        payload = response.json()

        summary = str(payload.get("AbstractText") or "").strip()
        related = _flatten_related_topics(payload.get("RelatedTopics", []))
        snippets = [item for item in related if item][: max(limit, 1)]

        return {
            "summary": summary,
            "snippets": snippets,
            "source": "duckduckgo",
        }
    except Exception:
        return {
            "summary": "",
            "snippets": [],
            "source": "unavailable",
        }

