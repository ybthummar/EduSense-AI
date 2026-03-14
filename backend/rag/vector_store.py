import os

INDEX_PATH = "rag/faiss_index"

def get_faiss_index():
    if not os.path.exists(INDEX_PATH):
        return None
    try:
        from langchain_community.vectorstores import FAISS
        from langchain_community.embeddings import HuggingFaceEmbeddings
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        return FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
    except Exception:
        return None

def build_faiss_index(docs):
    from langchain_community.vectorstores import FAISS
    from langchain_community.embeddings import HuggingFaceEmbeddings
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = FAISS.from_documents(docs, embeddings)
    vector_store.save_local(INDEX_PATH)
    return vector_store
