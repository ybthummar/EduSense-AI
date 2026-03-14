import os
import requests

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "dummy_key")

def search_youtube_videos(query: str, max_results=5):
    """
    Search YouTube API for the top educational videos based on extracted topic.
    Returns format matches UI structure.
    """
    if not query or YOUTUBE_API_KEY == "dummy_key":
        # Return mock data if no key is configured
        return {
            "videos": [
                {
                    "title": f"Understanding {query} - Tutorial 1",
                    "url": "https://youtube.com/watch?v=mock1",
                    "thumbnail": "▶️",
                    "channel": "EduTech"
                },
                {
                    "title": f"Mastering {query} - Advanced",
                    "url": "https://youtube.com/watch?v=mock2",
                    "thumbnail": "📚",
                    "channel": "LearnPro"
                }
            ],
            "playlist": {
                "title": f"Complete Course on {query}",
                "url": "https://youtube.com/playlist?list=mock"
            }
        }

    # Actual implementation if key exists
    search_url = f"https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query + " tutorial education",
        "key": YOUTUBE_API_KEY,
        "maxResults": max_results,
        "type": "video"
    }
    
    try:
        response = requests.get(search_url, params=params)
        data = response.json()
        
        videos = []
        if "items" in data:
            for item in data["items"]:
                videos.append({
                    "title": item["snippet"]["title"],
                    "url": f"https://youtube.com/watch?v={item['id']['videoId']}",
                    "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                    "channel": item["snippet"]["channelTitle"]
                })
        
        return {
            "videos": videos,
            "playlist": {
                "title": f"Recommended {query} Playlist",
                "url": f"https://www.youtube.com/results?search_query={query}&sp=EgIQAw%253D%253D" # searches for playlists
            }
        }
    except Exception as e:
        return {"videos": [], "playlist": None, "error": str(e)}
