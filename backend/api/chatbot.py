from fastapi import APIRouter, Depends
from pydantic import BaseModel
from services.youtube_service import search_youtube_videos
from services.topic_extractor import extract_topic
from rag.rag_service import query_rag

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    user_id: int

@router.post("/message")
def chat_with_assistant(request: ChatRequest):
    # 1. Answer via RAG
    rag_response = query_rag(request.message)

    # 2. Extract Topic for Youtube recommendations
    topic = extract_topic(request.message)

    # 3. Retrieve Youtube Recs
    youtube_results = search_youtube_videos(topic)

    return {
        "answer": rag_response,
        "videos": youtube_results.get("videos", []),
        "playlist": youtube_results.get("playlist", {})
    }
