import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from resume_processor import process_complex_resume
from langchain_core.documents import Document

class TestResumeProcessor(unittest.TestCase):
    def setUp(self):
        self.sample_txt_path = os.path.join(os.path.dirname(__file__), "test_sample_resume.txt")
        with open(self.sample_txt_path, "w", encoding="utf-8") as f:
            f.write(
                "Jane Doe\n"
                "Email: jane.doe@example.com | Phone: 555-0199\n\n"
                "Summary:\n"
                "Staff Platform Architect with 14+ years experience in Kubernetes, Golang, and Cloud Deployments.\n\n"
                "Experience:\n"
                "FinTech Labs Inc. - Principal Platform Engineer (2023 - Present)\n"
                "- Led migration of 140 microservices across hybrid cloud.\n\n"
                "Stripe - Staff Infrastructure Architect (2016 - 2020)\n"
                "- Scaled payment platform to 120,000 RPS.\n\n"
                "Education:\n"
                "M.S. in Computer Science - Carnegie Mellon University (CMU)\n"
            )

    def tearDown(self):
        if os.path.exists(self.sample_txt_path):
            os.remove(self.sample_txt_path)

    def test_file_not_found_raises_error(self):
        with self.assertRaises(FileNotFoundError):
            process_complex_resume("non_existent_file.pdf")

    def test_process_resume_with_mocked_partition(self):
        """Test the extraction pipeline logic with mocked unstructured elements"""
        mock_element1 = MagicMock()
        mock_element1.__str__.return_value = "Jane Doe - Staff Platform Architect"
        mock_element2 = MagicMock()
        mock_element2.__str__.return_value = "Skills: Kubernetes, Golang, Terraform"

        with patch("resume_processor.partition", return_value=[mock_element1, mock_element2]):
            chunks = process_complex_resume(
                file_path=self.sample_txt_path,
                candidate_name="Jane Doe",
                chunk_size=200,
                chunk_overlap=20
            )

            self.assertIsInstance(chunks, list)
            self.assertGreater(len(chunks), 0)
            self.assertIsInstance(chunks[0], Document)
            self.assertEqual(chunks[0].metadata["candidate_name"], "Jane Doe")
            self.assertIn("Kubernetes", chunks[0].page_content)

    def test_chunking_configuration(self):
        """Test that chunks respect chunk size limits"""
        long_text_element = MagicMock()
        long_text_element.__str__.return_value = "Kubernetes " * 200

        with patch("resume_processor.partition", return_value=[long_text_element]):
            chunks = process_complex_resume(
                file_path=self.sample_txt_path,
                candidate_name="Test Candidate",
                chunk_size=100,
                chunk_overlap=20
            )

            self.assertGreater(len(chunks), 1)
            for chunk in chunks:
                self.assertLessEqual(len(chunk.page_content), 150)

if __name__ == "__main__":
    unittest.main()
