import os
import shutil
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
db_client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client, db
    if MONGODB_URI and not MONGODB_URI.endswith("<db_password>@cluster0.wvbj49e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"):
        try:
            db_client = AsyncIOMotorClient(MONGODB_URI)
            db = db_client["talentpulse"]
        except Exception as e:
            print(f"MongoDB Connection Error: {e}")
    yield
    if db_client:
        db_client.close()

from resume_processor import process_complex_resume
from rag_engine import upsert_chunks_to_pinecone, query_groq_rag

app = FastAPI(
    title="TalentPulse AI - Candidate Intelligence API",
    description="Full-stack AI recruitment backend connected to Pinecone Vector DB and Groq LLaMA-3.3.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite running on localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Candidates are stored in MongoDB

class QueryRequest(BaseModel):
    query: str
    candidate_name: Optional[str] = None

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "TalentPulse AI Backend",
        "vector_db": "Pinecone (Serverless 384-dim)",
        "llm_engine": "Groq (qwen/qwen3.8-27b)"
    }

@app.get("/api/candidates")
async def get_candidates():
    """Return all pipeline candidates"""
    if db is not None:
        # Fetch from MongoDB, exclude the internal _id
        candidates = await db.candidates.find({}, {"_id": 0}).to_list(100)
        return candidates
    return []

@app.post("/api/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    candidate_name: Optional[str] = Form(None)
):
    """
    1. Save incoming file
    2. Parse layout with unstructured
    3. Push vectorized embeddings to Pinecone
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Layout-aware chunking
        name = candidate_name or os.path.splitext(file.filename)[0].replace("_", " ")
        chunks = process_complex_resume(
            file_path=file_path,
            candidate_name=name
        )

        # 2. Upsert to Pinecone
        upserted_count = upsert_chunks_to_pinecone(chunks)

        # 3. Add to candidate list
        new_candidate = {
            "id": name.lower().replace(" ", "-"),
            "name": name,
            "score": "91 Match",
            "scoreColor": "text-emerald-400",
            "dotColor": "bg-emerald-400",
            "skills": ["Distributed Systems", "Cloud Architecture", "Vector Search"],
            "status": "Shortlisted",
            "statusBadge": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            "category": "Shortlisted"
        }
        # Check if already in cache
        if not any(c["id"] == new_candidate["id"] for c in CANDIDATES_CACHE):
            CANDIDATES_CACHE.insert(0, new_candidate)

        return {
            "success": True,
            "filename": file.filename,
            "candidate_name": name,
            "chunks_upserted": upserted_count,
            "vector_store": "Pinecone (talentpulse-resumes)"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process and vectorize resume: {str(e)}")

@app.post("/api/query")
async def query_resume(request: QueryRequest):
    """
    Retrieve grounded chunks from Pinecone and query Groq
    """
    try:
        response = query_groq_rag(
            query=request.query,
            candidate_name=request.candidate_name
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Query failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
