# TalentPulse AI - Backend Service

This backend microservice uses **FastAPI**, **LangChain**, and **Unstructured** to parse complex, multi-column resumes (PDF, DOCX, TXT) with computer-vision-based layout understanding.

---

## 1. Setup & Installation

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd c:\Users\akshi\Desktop\resume\ResumeAi\backend
   ```

2. (Optional but recommended) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```

3. Install the dependencies including `unstructured`:
   ```bash
   pip install -r requirements.txt
   ```

> **Note for Windows PDF Parsing:**  
> The `unstructured` library uses `poppler` and `tesseract` behind the scenes for advanced OCR and layout partition on scanned PDFs. If processing complex image-based PDFs on Windows, make sure Poppler is installed or in your system PATH (`winget install osdn.poppler` or via conda).

---

## 2. Run the Backend Server

Start the FastAPI server on port 8000:
```bash
uvicorn main:app --reload --port 8000
```
Or directly:
```bash
python main.py
```

The server will be available at:
- **API Docs (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health check:** [http://localhost:8000/](http://localhost:8000/)

---

## 3. Endpoints

- `POST /api/upload-resume`: Multipart form-data upload (`file`, optional `candidate_name`). Processes layout, splits into chunks, and extracts text.
- `POST /api/query`: JSON payload (`query`, optional `filename`). Grounded chunk lookup.
