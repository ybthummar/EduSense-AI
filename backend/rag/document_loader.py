import os
from rag.vector_store import build_faiss_index

def _get_loaders():
    from langchain_community.document_loaders import PyPDFLoader, TextLoader
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    return PyPDFLoader, TextLoader, RecursiveCharacterTextSplitter

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

def load_documents_and_index():
    PyPDFLoader, TextLoader, RecursiveCharacterTextSplitter = _get_loaders()
    all_docs = []
    
    if not os.path.exists(DATA_DIR):
        print(f"Data directory {DATA_DIR} not found.")
        return False
        
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            path = os.path.join(root, file)
            try:
                if file.endswith(".pdf"):
                    loader = PyPDFLoader(path)
                    all_docs.extend(loader.load())
                elif file.endswith(".txt"):
                    loader = TextLoader(path)
                    all_docs.extend(loader.load())
            except Exception as e:
                print(f"Failed to load {file}: {str(e)}")
                
    if not all_docs:
        print("No documents found to index.")
        return False
        
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    chunks = text_splitter.split_documents(all_docs)
    
    # Store in FAISS
    build_faiss_index(chunks)
    print(f"Successfully indexed {len(chunks)} document chunks.")
    return True

if __name__ == "__main__":
    load_documents_and_index()
