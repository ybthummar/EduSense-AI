import re
from typing import List, Optional, Dict, Any
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


def _is_personal_data_query(query: str) -> bool:
    """Check if query is asking about student's personal academic data."""
    query_lower = query.lower()
    personal_keywords = [
        "my sgpa", "my cgpa", "my gpa", "my marks", "my attendance",
        "my score", "my grades", "my performance", "my average",
        "what is my", "how much is my", "what's my", "what are my",
        "my backlog", "my weak", "my strong", "my risk", "my trend",
        "semester grade", "semester marks", "semester cgpa",
        "do i have", "am i", "current marks", "current attendance",
        "current gpa", "current score"
    ]
    return any(keyword in query_lower for keyword in personal_keywords)


def _extract_student_metrics(student_context_dict: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract numerical metrics from student context."""
    if not student_context_dict:
        return {}
    
    return {
        "cgpa": student_context_dict.get("cgpa"),
        "attendance": student_context_dict.get("attendance"),
        "average_marks": student_context_dict.get("average_marks"),
        "risk_level": student_context_dict.get("risk_level"),
        "weak_subjects": student_context_dict.get("weak_subjects", []),
        "strong_subjects": student_context_dict.get("strong_subjects", []),
        "risk_factors": student_context_dict.get("risk_factors", []),
        "trends": student_context_dict.get("trends", {}),
    }


def query_rag(query: str, extra_context: str = "", student_context: str = "", student_context_dict: Optional[Dict[str, Any]] = None) -> str:
    """Retrieve relevant context and return a structured educational response using LangChain."""
    
    # Debug logging
    is_personal = _is_personal_data_query(query)
    print(f"🔍 Query: '{query[:50]}...' | Personal: {is_personal} | Has student_context_dict: {bool(student_context_dict)}")
    
    if student_context_dict:
        print(f"  Student ID: {student_context_dict.get('student_id')}")
        print(f"  CGPA: {student_context_dict.get('cgpa')}")
        print(f"  Attendance: {student_context_dict.get('attendance')}")
        print(f"  Marks: {student_context_dict.get('average_marks')}")
    
    # 1. Check if this is a personal data query and we have student metrics
    if is_personal and student_context_dict:
        # Check if we have a student_id, meaning we have actual student data
        if student_context_dict.get("student_id"):
            metrics = _extract_student_metrics(student_context_dict)
            # Check if we have meaningful academic data (cgpa, attendance, or marks)
            has_data = (
                metrics.get("cgpa") is not None or 
                metrics.get("attendance") is not None or 
                metrics.get("average_marks") is not None or
                metrics.get("risk_level") is not None
            )
            print(f"  Has metrics data: {has_data}")
            if has_data:
                personal_answer = _answer_personal_data_query(query, metrics)
                if personal_answer:
                    # Log that we're using personal data
                    print(f"📊 ✓ Returning personal data response for: {query[:50]}...")
                    return personal_answer
                else:
                    print(f"📊 ✗ Personal data query but no answer generated")
    
    print(f"  → Using Gemini API for this query")
    
    # 2. Get FAISS snippets from dataset
    index = get_faiss_index()
    course_snippets: List[str] = []
    if index:
        try:
            docs = index.similarity_search(query, k=4)
            course_snippets = [_clean_text(doc.page_content) for doc in docs if doc.page_content]
        except Exception:
            course_snippets = []
            
    faiss_context = "\n".join(course_snippets) if course_snippets else "No relevant course material found in database."

    # 3. Prepare LangChain Prompt
    template = """You are an expert AI educational assistant for EduSense.
The student has asked: {query}

Use the following context from our knowledge base:
{faiss_context}
Additional web context:
{extra_context}

Student Learning Profile:
{student_context}

Instructions:
- Provide a clear, comprehensive educational response
- Reference the provided contexts when applicable
- Personalize the explanation based on the student's background
- Use markdown formatting for clarity
- Be friendly and encouraging
- If the exact answer isn't in the context, explain using your knowledge but note this

Response:"""
    
    prompt = PromptTemplate(
        input_variables=["query", "faiss_context", "extra_context", "student_context"],
        template=template
    )

    if not GOOGLE_API_KEY or GOOGLE_API_KEY == "dummy_key":
        # Fallback if no LLM configured
        return fallback_generate(query, course_snippets, extra_context, student_context)

    # 4. Call ChatGoogleGenerativeAI (Uses GEMINI_API_KEY from config)
    try:
        llm = ChatGoogleGenerativeAI(
            temperature=0.7, 
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            top_p=0.95,
            top_k=40,
        )
        
        # Create chain using | operator (LCEL)
        chain = prompt | llm
        
        result = chain.invoke({
            "query": query, 
            "faiss_context": faiss_context, 
            "extra_context": extra_context, 
            "student_context": student_context or "Not available"
        })
        
        return result.content.strip() if hasattr(result, 'content') else str(result).strip()
    except Exception as e:
        print(f"LLM Error: {str(e)}")
        return fallback_generate(query, course_snippets, extra_context, student_context)



def _answer_personal_data_query(query: str, metrics: Dict[str, Any]) -> Optional[str]:
    """Return actual student data for personal queries."""
    query_lower = query.lower()
    response_parts = []
    
    # CGPA/GPA/SGPA queries
    if any(kw in query_lower for kw in ["cgpa", "gpa ", "overall gpa", "overall cgpa", "sgpa", "semester gpa", "semester grade"]):
        cgpa = metrics.get("cgpa")
        if cgpa is not None:
            response_parts.append(f"**Your CGPA/SGPA:** {cgpa:.2f}")
            
            if metrics.get("trends", {}).get("cgpa"):
                trend = metrics["trends"]["cgpa"]
                response_parts.append(f"**CGPA Trend:** {trend.capitalize()}")
            
            if metrics.get("risk_level"):
                response_parts.append(f"**Academic Risk Level:** {metrics['risk_level'].upper()}")
    
    # Marks/Average queries
    elif any(kw in query_lower for kw in ["marks ", "average", "score", "percentage"]):
        avg_marks = metrics.get("average_marks")
        if avg_marks is not None:
            response_parts.append(f"**Your Average Marks:** {avg_marks:.2f}")
            if metrics.get("trends", {}).get("marks"):
                response_parts.append(f"**Marks Trend:** {metrics['trends']['marks'].capitalize()}")
    
    # Attendance queries
    elif any(kw in query_lower for kw in ["attendance", "present", "absence"]):
        attendance = metrics.get("attendance")
        if attendance is not None:
            response_parts.append(f"**Your Attendance:** {attendance:.1f}%")
            if metrics.get("trends", {}).get("attendance"):
                response_parts.append(f"**Attendance Trend:** {metrics['trends']['attendance'].capitalize()}")
    
    # Performance/strength/weakness queries
    elif any(kw in query_lower for kw in ["strong subject", "weak subject", "performance"]):
        if metrics.get("strong_subjects"):
            strong = ", ".join(metrics["strong_subjects"][:3])
            response_parts.append(f"**Your Strong Subjects:** {strong}")
        if metrics.get("weak_subjects"):
            weak = ", ".join(metrics["weak_subjects"][:3])
            response_parts.append(f"**Subjects Needing Improvement:** {weak}")
    
    # Risk factors
    elif "risk" in query_lower:
        if metrics.get("risk_factors"):
            factors = ", ".join(metrics["risk_factors"][:3])
            response_parts.append(f"**Risk Factors:** {factors}")
        if metrics.get("risk_level"):
            response_parts.append(f"**Risk Level:** {metrics['risk_level'].upper()}")
    
    # If none of the above matched but we have CGPA/attendance/marks, include them
    if not response_parts:
        if metrics.get("cgpa") is not None:
            response_parts.append(f"**Your CGPA:** {metrics['cgpa']:.2f}")
        if metrics.get("average_marks") is not None:
            response_parts.append(f"**Your Average Marks:** {metrics['average_marks']:.2f}")
        if metrics.get("attendance") is not None:
            response_parts.append(f"**Your Attendance:** {metrics['attendance']:.1f}%")
    
    if response_parts:
        result = "\n".join(response_parts)
        result += "\n\n**Note:** This information is based on your actual academic record from our database."
        return result
    
    return None


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
