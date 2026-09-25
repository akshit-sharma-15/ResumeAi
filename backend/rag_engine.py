import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")
load_dotenv()

# 1. Initialize Embeddings (384-dimensional model matching Pinecone index)
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# 2. Connect to Pinecone Index
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "talentpulse-resumes")

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)
vector_store = PineconeVectorStore(index=index, embedding=embeddings)

# 3. Initialize Groq Chat Model
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
llm = ChatGroq(
    model=GROQ_MODEL,
    temperature=0.0,
    api_key=GROQ_API_KEY
)

def upsert_chunks_to_pinecone(chunks) -> int:
    """Store resume chunks in Pinecone"""
    if not chunks:
        return 0
    vector_store.add_documents(chunks)
    return len(chunks)

def query_groq_rag(query: str, candidate_name: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve grounded chunks from Pinecone and query Groq Llama-3.3"""
    filter_dict = {"candidate_name": candidate_name} if candidate_name else None
    
    # Retrieve top 4 most relevant chunks
    matched_docs = vector_store.similarity_search(query, k=4, filter=filter_dict)

    if not matched_docs:
        # Fallback query without filter if specific candidate not matched
        matched_docs = vector_store.similarity_search(query, k=4)

    if not matched_docs:
        return {
            "answer": "No relevant candidate data found in the resume index. Please upload a resume first.",
            "citations": [],
            "chunks_count": 0
        }

    context = "\n\n".join([
        f"[Source: {doc.metadata.get('filename', 'Resume')} | Candidate: {doc.metadata.get('candidate_name', 'Unknown')}]:\n{doc.page_content}"
        for doc in matched_docs
    ])

    prompt = ChatPromptTemplate.from_template("""
You are TalentPulse AI, an autonomous candidate intelligence agent.
Answer the recruiter's inquiry strictly based on the verified resume context below.
If a detail, date range, or skill metric is not present in the document text, reply with: [NOT CONFIRMED IN RESUME].
Explicitly flag any temporal employment gap greater than 90 days.

Verified Resume Context:
{context}

Recruiter Inquiry:
{question}
""")

    chain = prompt | llm | StrOutputParser()
    answer = chain.invoke({"context": context, "question": query})

    citations = [
        f"Page excerpt: {doc.metadata.get('filename', 'Resume')}"
        for doc in matched_docs
    ]

    return {
        "answer": answer,
        "citations": list(set(citations)),
        "chunks_count": len(matched_docs)
    }
