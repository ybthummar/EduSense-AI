"""Playlist recommendation service — searches YouTube for full-course playlists."""

import os
import requests
from typing import Dict, Any, Optional

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")


def search_playlist(topic: str) -> Optional[Dict[str, Any]]:
    """
    Search YouTube Data API v3 for a playlist related to *topic*.
    Returns the best matching playlist or a fallback search link.
    """
    if not topic:
        return None

    if not YOUTUBE_API_KEY:
        return {
            "title": f"{topic} Full Course",
            "url": f"https://www.youtube.com/results?search_query={_url_encode(topic)}+full+course&sp=EgIQAw%253D%253D",
            "source": "search_fallback",
        }

    try:
        params = {
            "part": "snippet",
            "q": f"{topic} full course tutorial",
            "type": "playlist",
            "maxResults": 1,
            "key": YOUTUBE_API_KEY,
        }
        resp = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params=params,
            timeout=8,
        )
        data = resp.json()
        items = data.get("items", [])
        if items:
            item = items[0]
            return {
                "title": item["snippet"]["title"],
                "url": f"https://www.youtube.com/playlist?list={item['id']['playlistId']}",
                "channel": item["snippet"]["channelTitle"],
                "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                "source": "youtube_api",
            }
    except Exception:
        pass

    # Fallback
    return {
        "title": f"{topic} Full Course",
        "url": f"https://www.youtube.com/results?search_query={_url_encode(topic)}+full+course&sp=EgIQAw%253D%253D",
        "source": "search_fallback",
    }


def _url_encode(text: str) -> str:
    return text.replace(" ", "+")
