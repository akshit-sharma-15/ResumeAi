import os
import sys
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from main import app, RESUME_STORE
from langchain_core.documents import Document

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        RESUME_STORE.clear()

    def test_health_check(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertIn(".pdf", data["supported_formats"])

    def test_query_without_resumes(self):
        response = self.client.post("/api/query", json={"query": "Kubernetes"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("No resumes", response.json()["detail"])

    @patch("main.process_complex_resume")
    def test_upload_and_query_flow(self, mock_process):
        # Mock the processor output
        mock_doc = Document(
            page_content="Alex Vanderbilt has 14 years experience with Kubernetes and AWS EKS.",
            metadata={"candidate_name": "Alex Vanderbilt"}
        )
        mock_process.return_value = [mock_doc]

        # 1. Test Upload
        file_content = b"Mock Resume Content"
        response = self.client.post(
            "/api/upload-resume",
            files={"file": ("alex_resume.pdf", file_content, "application/pdf")},
            data={"candidate_name": "Alex Vanderbilt"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["candidate_name"], "Alex Vanderbilt")
        self.assertEqual(data["total_chunks"], 1)

        # 2. Test Query matching the uploaded resume
        query_response = self.client.post(
            "/api/query",
            json={"query": "Kubernetes experience"}
        )
        self.assertEqual(query_response.status_code, 200)
        query_data = query_response.json()
        self.assertEqual(query_data["candidate_name"], "Alex Vanderbilt")
        self.assertGreater(query_data["matched_chunks_count"], 0)
        self.assertIn("Kubernetes", query_data["relevant_context"][0])

if __name__ == "__main__":
    unittest.main()
