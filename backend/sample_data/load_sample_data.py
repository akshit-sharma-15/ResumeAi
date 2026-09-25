"""
TalentPulse — Sample Data Loader
Ingests the plain-text sample resumes directly into Pinecone via the RAG engine,
bypassing the file-upload API. Useful for seeding the vector DB for testing.

Usage:
    python load_sample_data.py
"""

import os
import sys
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Add parent dir so we can import the rag engine
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from rag_engine import upsert_chunks_to_pinecone

SAMPLE_TEXT_DIR = os.path.join(os.path.dirname(__file__), "resumes_text")

# Map filename -> candidate name
CANDIDATES = {
    "alex_vanderbilt_resume.txt": "Alex Vanderbilt",
    "priya_mehta_resume.txt": "Priya Mehta",
    "marcus_johnson_resume.txt": "Marcus Johnson",
}


def load_and_chunk(file_path: str, candidate_name: str, chunk_size=500, chunk_overlap=50):
    """Read a plain-text resume and split it into LangChain Documents."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    doc = Document(
        page_content=content,
        metadata={
            "candidate_name": candidate_name,
            "source": file_path,
            "filename": os.path.basename(file_path),
        }
    )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    return splitter.split_documents([doc])


def main():
    print("=" * 60)
    print("  TalentPulse — Sample Data Loader")
    print("=" * 60)

    total_upserted = 0

    for filename, name in CANDIDATES.items():
        path = os.path.join(SAMPLE_TEXT_DIR, filename)
        if not os.path.exists(path):
            print(f"  ⚠  Skipping {filename} — file not found")
            continue

        print(f"\n  📄 Processing: {name}")
        print(f"     File: {filename}")

        chunks = load_and_chunk(path, name)
        print(f"     Chunks: {len(chunks)}")

        count = upsert_chunks_to_pinecone(chunks)
        total_upserted += count
        print(f"     Upserted: {count} vectors → Pinecone")

    print(f"\n{'=' * 60}")
    print(f"  ✅ Done — {total_upserted} total vectors upserted")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
