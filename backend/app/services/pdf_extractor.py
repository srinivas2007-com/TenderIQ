import re
import os
from typing import List, Dict, Any, Optional

class PDFExtractionResult:
    def __init__(self, text: str, pages: List[Dict[str, Any]], page_count: int, is_scanned: bool = False):
        self.text = text
        self.pages = pages  # [{"page": 1, "text": "..."}]
        self.page_count = page_count
        self.is_scanned = is_scanned

class PDFExtractor:
    @staticmethod
    def extract(file_path: str) -> PDFExtractionResult:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found: {file_path}")
        
        pages = []
        full_text_list = []
        is_scanned = False
        
        # Try PyMuPDF (fitz) first
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            page_count = len(doc)
            
            for page_num in range(page_count):
                page = doc.load_page(page_num)
                page_text = page.get_text("text") or ""
                cleaned = PDFExtractor.clean_text(page_text)
                pages.append({
                    "page": page_num + 1,
                    "text": cleaned,
                    "char_count": len(cleaned)
                })
                full_text_list.append(f"--- PAGE {page_num + 1} ---\n" + cleaned)
            
            doc.close()
            
            # Check if majority of pages have very little text (scanned PDF heuristic)
            non_empty_pages = [p for p in pages if p["char_count"] > 30]
            if len(non_empty_pages) < max(1, page_count // 3):
                is_scanned = True
                
            return PDFExtractionResult(
                text="\n\n".join(full_text_list),
                pages=pages,
                page_count=page_count,
                is_scanned=is_scanned
            )
        except ImportError:
            pass
        except Exception as e:
            # If fitz fails, check if password protected
            if "password" in str(e).lower():
                raise ValueError("Unable to analyze this document. The PDF appears to be password protected.")
            # Fallback to pypdf or basic binary extractor if needed
        
        # Fallback to pypdf
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            page_count = len(reader.pages)
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                cleaned = PDFExtractor.clean_text(page_text)
                pages.append({
                    "page": idx + 1,
                    "text": cleaned,
                    "char_count": len(cleaned)
                })
                full_text_list.append(f"--- PAGE {idx + 1} ---\n" + cleaned)
            
            non_empty = [p for p in pages if p["char_count"] > 30]
            if len(non_empty) < max(1, page_count // 3):
                is_scanned = True

            return PDFExtractionResult(
                text="\n\n".join(full_text_list),
                pages=pages,
                page_count=page_count,
                is_scanned=is_scanned
            )
        except Exception as e:
            if "password" in str(e).lower():
                raise ValueError("Unable to analyze this document. The PDF appears to be password protected.")
            raise ValueError(f"Failed to extract PDF content: {str(e)}")

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        # Remove null bytes and excessive carriage returns
        text = text.replace("\x00", "")
        text = re.sub(r'\r\n|\r', '\n', text)
        # Normalize multiple spaces and non-breaking spaces
        text = re.sub(r'[\t\xa0]', ' ', text)
        # Normalize multiple spaces to single space but preserve line breaks
        text = re.sub(r'[ ]{2,}', ' ', text)
        # Limit excessive newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    @staticmethod
    def chunk_document(pages: List[Dict[str, Any]], max_chars_per_chunk: int = 6000) -> List[Dict[str, Any]]:
        """
        Splits document into logical chunks while maintaining page range mapping.
        """
        chunks = []
        current_chunk_text = ""
        start_page = 1
        current_pages = []

        for p in pages:
            page_num = p["page"]
            page_text = p["text"]
            
            if len(current_chunk_text) + len(page_text) > max_chars_per_chunk and current_chunk_text:
                chunks.append({
                    "start_page": start_page,
                    "end_page": current_pages[-1] if current_pages else start_page,
                    "pages": current_pages,
                    "text": current_chunk_text
                })
                current_chunk_text = f"--- PAGE {page_num} ---\n{page_text}\n\n"
                start_page = page_num
                current_pages = [page_num]
            else:
                current_chunk_text += f"--- PAGE {page_num} ---\n{page_text}\n\n"
                current_pages.append(page_num)

        if current_chunk_text:
            chunks.append({
                "start_page": start_page,
                "end_page": current_pages[-1] if current_pages else start_page,
                "pages": current_pages,
                "text": current_chunk_text
            })

        return chunks
