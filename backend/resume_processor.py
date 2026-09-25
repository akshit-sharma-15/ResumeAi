from unstructured.partition.auto import partition
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
from typing import List, Optional

def process_complex_resume(
    file_path: str,
    candidate_name: Optional[str] = None,
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> List[Document]:
    """
    Parses complex layout resumes (e.g. multi-column PDFs, tables, DOCX) using unstructured.
    Extracts structured layout elements and chunks them for vector storage/RAG retrieval.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found at: {file_path}")

    # Fallback default name if not provided
    name = candidate_name or os.path.splitext(os.path.basename(file_path))[0].replace("_", " ")

    # partition() automatically detects if it is a PDF or DOCX
    # It reads the physical layout (titles, columns, tables) accurately
    elements = partition(filename=file_path)

    # Join the parsed elements back into a clean string preserving flow
    clean_text = "\n\n".join([str(element).strip() for element in elements if str(element).strip()])

    # Create a LangChain document with rich metadata
    doc = Document(
        page_content=clean_text,
        metadata={
            "candidate_name": name,
            "source": file_path,
            "filename": os.path.basename(file_path)
        }
    )

    # Chunk the document into manageable context windows for embedding
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    chunks = text_splitter.split_documents([doc])

    return chunks
