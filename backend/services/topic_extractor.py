def extract_topic(query: str) -> str:
    """
    Uses simple NLP or LLM to extract the core educational topic from a user query.
    Example: 'Explain neural networks to me' -> 'neural networks'
    """
    # Simple logic placeholder. In production, pass to Langchain LLM.
    query_lower = query.lower()
    if "explain" in query_lower:
        topic = query_lower.split("explain")[-1].strip()
    elif "what is" in query_lower:
        topic = query_lower.split("what is")[-1].strip()
    elif "how does" in query_lower:
        topic = query_lower.split("how does")[-1].split("work")[0].strip()
    else:
        topic = query
    
    # Remove punctuation
    topic = ''.join(c for c in topic if c.isalnum() or c.isspace())
    return topic
