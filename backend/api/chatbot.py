from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from services.youtube_service import search_youtube_videos
from services.playlist_service import search_playlist
from services.topic_extractor import extract_topic
from services.web_scraper import scrape_web_content
from services.student_context import get_student_context, build_context_prompt
from rag.rag_service import query_rag

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    user_id: int
    student_id: Optional[str] = None

@router.post("/message")
def chat_with_assistant(request: ChatRequest):
    # 1. Extract topic
    topic = extract_topic(request.message)

    # 2. Fetch student context for personalisation
    student_ctx = get_student_context(request.student_id)
    context_prompt = build_context_prompt(student_ctx, topic)

    # 3. Scrape web knowledge
    web_knowledge = scrape_web_content(topic)

    # 4. Query RAG with enriched context
    rag_response = query_rag(request.message, extra_context=web_knowledge, student_context=context_prompt)

    # 5. YouTube video search
    youtube_results = search_youtube_videos(topic)

    # 6. Playlist recommendation
    playlist = search_playlist(topic)

    # 7. Build personalised recommendation message
    recommendation = None
    weak = student_ctx.get("weak_subjects", [])
    if weak and topic:
        for subj in weak:
            if subj.lower() in topic.lower() or topic.lower() in subj.lower():
                recommendation = f"You are weak in {subj}. We recommend watching the full playlist to strengthen your understanding."
                break

    return {
        "answer": rag_response,
        "videos": youtube_results.get("videos", []),
        "playlist": playlist or youtube_results.get("playlist", {}),
        "recommendation": recommendation,
        "student_context": {
            "cgpa": student_ctx.get("cgpa"),
            "weak_subjects": weak,
            "attendance": student_ctx.get("attendance"),
        },
    }
