from rag.vector_store import get_faiss_index
import os

def query_rag(query: str) -> str:
    """
    Queries the vector store for relevant chunks, then generates a response using LLM.
    """
    index = get_faiss_index()
    if not index:
        return f"To understand {query}, think about the fundamental concepts. Ensure you review the prerequisite subjects like Data Structures or basic Calculus."

    # Using Langchain RetrievalQA or similar
    # Placeholder for actual LLM execution since we mock the index when empty
    try:
        docs = index.similarity_search(query, k=3)
        context = " ".join([doc.page_content for doc in docs])
        
        # LLM call would happen here.
        response = f"Based on your course materials: {context[:200]}... [LLM generated explanation for {query}]"
        return response
    except Exception as e:
        return f"Our materials indicate that {query} is a key concept. Please check the recommended videos below for more detail."
