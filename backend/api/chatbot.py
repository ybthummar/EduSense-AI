from typing import Optional, Union

from fastapi import APIRouter
from pydantic import BaseModel

from services.agent_workflow import run_student_agent_workflow
from services.playlist_service import search_playlist
from services.youtube_service import search_youtube_videos
from services.web_scraper import scrape_web_links

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_id: Union[int, str]
    student_id: Optional[str] = None


@router.post("/message")
def chat_with_assistant(request: ChatRequest):
    workflow_result = run_student_agent_workflow(
        message=request.message,
        student_id=request.student_id,
    )

    topic = workflow_result.get("topic") or request.message
    is_direct = workflow_result.get("source") == "dataset_direct"

    youtube_results = {"videos": [], "playlist": {}}
    web_links = []

    if not is_direct:
        try:
            youtube_results = search_youtube_videos(topic)
        except Exception as ex:
            print(f"⚠️  YouTube search failed: {ex}")
            youtube_results = {"videos": [], "playlist": {}}

        try:
            playlist = search_playlist(topic)
        except Exception as ex:
            print(f"⚠️  Playlist search failed: {ex}")
            playlist = None

        try:
            web_links = scrape_web_links(topic)
        except Exception as ex:
            print(f"⚠️  Web scrape failed: {ex}")
            web_links = []

        playlist_result = playlist or youtube_results.get("playlist", {})
    else:
        playlist_result = {}

    return {
        "answer": workflow_result.get("answer"),
        "videos": youtube_results.get("videos", []),
        "playlist": playlist_result,
        "web_links": web_links,
        "recommendation": workflow_result.get("recommendation"),
        "student_context": workflow_result.get("student_context", {}),
        "analysis": workflow_result.get("analysis", {}),
        "knowledge": workflow_result.get("knowledge", {}),
        "workflow": workflow_result.get("workflow", []),
        "source": workflow_result.get("source", "query_rag"),
    }

