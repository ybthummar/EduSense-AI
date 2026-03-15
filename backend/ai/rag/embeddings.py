"""
Embeddings helper
─────────────────
Wraps HuggingFace sentence-transformers so we get a consistent
LangChain-compatible embedding object everywhere.
"""

from langchain_community.embeddings import HuggingFaceEmbeddings

_MODEL_NAME = "all-MiniLM-L6-v2"
_embeddings = None


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=_MODEL_NAME)
    return _embeddings
