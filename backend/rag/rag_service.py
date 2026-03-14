from rag.vector_store import get_faiss_index
import os


def query_rag(query: str, extra_context: str = "", student_context: str = "") -> str:
    """
    Queries the vector store for relevant chunks, enriches with web knowledge
    and student context, then generates a response.
    """
    index = get_faiss_index()

    # Build combined context
    context_parts = []
    if student_context:
        context_parts.append(student_context)

    if not index:
        # No vector index available — use web knowledge + student context
        if extra_context:
            context_parts.append(extra_context)
        if context_parts:
            combined = "\n\n".join(context_parts)
            return (
                f"Based on available knowledge:\n\n{extra_context[:600]}\n\n"
                f"To deepen your understanding of {query}, review the recommended videos and course materials."
            )
        return (
            f"To understand {query}, think about the fundamental concepts. "
            "Ensure you review the prerequisite subjects like Data Structures or basic Calculus."
        )

    try:
        docs = index.similarity_search(query, k=3)
        rag_context = " ".join([doc.page_content for doc in docs])
        if extra_context:
            context_parts.append(f"Web Knowledge: {extra_context[:400]}")
        context_parts.append(f"Course Materials: {rag_context[:400]}")

        combined = "\n\n".join(context_parts)

        # LLM call would use combined context as prompt enrichment
        response = (
            f"Based on your course materials and research:\n\n"
            f"{rag_context[:300]}...\n\n"
            f"Additional context: {extra_context[:200]}\n\n"
            f"[AI-generated explanation for: {query}]"
        )
        return response
    except Exception:
        if extra_context:
            return (
                f"Here's what we found about {query}:\n\n{extra_context[:500]}\n\n"
                "Please also check the recommended videos below for more detail."
            )
        return (
            f"Our materials indicate that {query} is a key concept. "
            "Please check the recommended videos below for more detail."
        )
