import os
import shutil
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from resume_processor import process_complex_resume

app = FastAPI(
    title="TalentPulse AI - Resume Intelligence Backend",
    description="Agentic backend utilizing 'unstructured' and LangChain for layout-aware resume parsing.",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default: http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory document storage for processed resumes
RESUME_STORE = {}

class QueryRequest(BaseModel):
    query: str
    filename: Optional[str] = None

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "TalentPulse AI Extraction Agent",
        "supported_formats": [".pdf", ".docx", ".txt"]
    }

@app.post("/api/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    candidate_name: Optional[str] = Form(None)
):
    """
    Upload and parse multi-column resumes using the unstructured computer vision layout partitioner.
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process complex layout via unstructured + LangChain
        chunks = process_complex_resume(
            file_path=file_path,
            candidate_name=candidate_name
        )

        full_extracted_text = "\n\n".join([chunk.page_content for chunk in chunks])

        # Store in-memory for queries
        RESUME_STORE[file.filename] = {
            "candidate_name": candidate_name or file.filename,
            "chunks": [c.dict() for c in chunks],
            "raw_text": full_extracted_text,
            "total_chunks": len(chunks)
        }

        return {
            "success": True,
            "filename": file.filename,
            "candidate_name": candidate_name or file.filename,
            "total_chunks": len(chunks),
            "sample_snippet": full_extracted_text[:400] + "..." if len(full_extracted_text) > 400 else full_extracted_text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@app.post("/api/query")
async def query_resume(request: QueryRequest):
    """
    Query processed resume chunks for grounded candidate answers.
    """
    if not RESUME_STORE:
        raise HTTPException(status_code=400, detail="No resumes have been uploaded yet.")

    filename = request.filename or list(RESUME_STORE.keys())[-1]
    doc_data = RESUME_STORE.get(filename)

    if not doc_data:
        raise HTTPException(status_code=404, detail=f"Resume '{filename}' not found.")

    query_lower = request.query.lower()
    matching_chunks = [
        c["page_content"] for c in doc_data["chunks"]
        if any(term in c["page_content"].lower() for term in query_lower.split())
    ]

    return {
        "candidate_name": doc_data["candidate_name"],
        "query": request.query,
        "matched_chunks_count": len(matching_chunks),
        "relevant_context": matching_chunks[:3] if matching_chunks else [doc_data["chunks"][0]["page_content"] if doc_data["chunks"] else ""]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
