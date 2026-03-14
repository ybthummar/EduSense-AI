import re
from typing import List
import os

from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from rag.vector_store import get_faiss_index
from config import GOOGLE_API_KEY


def _clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    return text


def query_rag(query: str, extra_context: str = "", student_context: str = "") -> str:
    """Retrieve relevant context and return a structured educational response using LangChain."""
    
    # 1. Get FAISS snippets
    index = get_faiss_index()
    course_snippets: List[str] = []
    if index:
        try:
            docs = index.similarity_search(query, k=4)
            course_snippets = [_clean_text(doc.page_content) for doc in docs if doc.page_content]
        except Exception:
            course_snippets = []
            
    faiss_context = "\n".join(course_snippets)

    # 2. Prepare LangChain Prompt
    template = """
You are an expert AI educational assistant.
The student has asked: {query}

Use the following context from our vector database:
{faiss_context}

Additional external web context:
{extra_context}

Personalized Student Context:
{student_context}

Based on the above information, generate a helpful, comprehensive, and clear educational response.
Your response should naturally blend the core explanation and the personalized guidance for the student.
If the context isn't enough, clearly explain the concept using your innate knowledge but explicitly prioritize the retrieved contexts.
Use markdown for formatting. Make it friendly and structured.
    """
    
    prompt = PromptTemplate(
        input_variables=["query", "faiss_context", "extra_context", "student_context"],
        template=template
    )

    if not GOOGLE_API_KEY or GOOGLE_API_KEY == "dummy_key":
        # Fallback if no LLM configured
        return fallback_generate(query, course_snippets, extra_context, student_context)

    # 3. Call ChatGoogleGenerativeAI (Requires GOOGLE_API_KEY)
    try:
        llm = ChatGoogleGenerativeAI(temperature=0.3, model="gemini-1.5-flash", google_api_key=GOOGLE_API_KEY)
        chain = prompt | llm
        
        response = chain.invoke({
            "query": query,
            "faiss_context": faiss_context,
            "extra_context": extra_context,
            "student_context": student_context
        })
        return response.content
    except Exception as e:
        return f"Error connecting to LLM: {str(e)}\n\n" + fallback_generate(query, course_snippets, extra_context, student_context)


def fallback_generate(query, course_snippets, extra_context, student_context):
    lines = []
    lines.append(f"**Topic:** {query}")
    lines.append("\n**Core explanation:**")
    if course_snippets:
         lines.append("- " + course_snippets[0][:300] + "...")
    elif extra_context:
         lines.append("- " + extra_context[:300] + "...")
    else:
         lines.append("- Build fundamentals first, then practice daily.")
    
    if student_context:
        lines.append("\n**Personalized guidance for this student:**")
        lines.append("- Use the student profile context to simplify weak areas first and prioritize high-impact revision topics.")
        
    return "\n".join(lines)
