---
name: rag-knowledge-base-builder
description: >-
  [Chuyên Gia Xây Dựng Kho Tri Thức Tài Liệu Riêng (RAG)] — Tác dụng: Cắt nhỏ tài liệu dài (PDF, Word, Markdown), đánh mục lục thông minh giúp AI tra cứu và trả lời chính xác theo đúng tài liệu nội bộ của bạn — Kích hoạt: Khi làm tính năng chatbot hỏi đáp tài liệu hoặc tra cứu văn bản lớn.
---

# KỸ NĂNG CHUYÊN SÂU: `RAG-KNOWLEDGE-BASE-BUILDER` (NHÓM 4: AI AGENT, PROMPT ENGINEERING & MCP SYSTEM — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `rag-knowledge-base-builder`
- **Vai trò:** Kỹ sư Hệ thống Truy xuất Tri thức Tăng cường cho Agent (`RAG, Hybrid Search & Context Grounding Architect`)
- **Trọng tâm nhiệm vụ:** Xây dựng bộ nhớ tri thức cho AI Agent bằng phương pháp cắt đoạn ngữ nghĩa (`Semantic/Markdown Chunking`), tìm kiếm kết hợp (`BM25 Từ khóa` + `Dense Vector Embedding`), xếp hạng lại (`Reranking`) và trích dẫn chính xác nguồn tài liệu.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Không cắt văn bản mù quáng theo số ký tự cố định làm đứt gãy hàm code hoặc bảng biểu; ưu tiên cắt theo ranh giới tiêu đề Markdown (`#`, `##`, `###`) kèm phần gối đầu (`Overlap 10-15%`).
2. Mỗi đoạn văn bản (`Chunk`) lưu vào Vector DB bắt buộc phải đính kèm `metadata` (`source_file`, `section_title`, `line_start`, `line_end`) để Agent dẫn nguồn clickable link.
3. Nếu điểm tương đồng (`Similarity Score`) của toàn bộ kết quả tìm kiếm đều thấp hơn ngưỡng tin cậy, Agent phải trả lời rõ là tài liệu chưa có thông tin thay vì tự bịa câu trả lời.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import re
from dataclasses import dataclass

@dataclass
class DocumentChunk:
    chunk_id: int
    header: str
    content: str
    source_path: str

def chunk_markdown_by_headers(markdown_text: str, source_path: str) -> list[DocumentChunk]:
    sections = re.split(r"(?=^#{1,3}\s+.+$)", markdown_text.strip(), flags=re.MULTILINE)
    chunks: list[DocumentChunk] = []
    for idx, sec in enumerate(s.strip() for s in sections if s.strip()):
        first_line = sec.splitlines()[0].lstrip("#").strip()
        chunks.append(DocumentChunk(chunk_id=idx + 1, header=first_line, content=sec, source_path=source_path))
    return chunks
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Các khối code (```` ... ````) và bảng Markdown không bị cắt đôi giữa hai Chunk.
- [x] Mọi câu trả lời lấy từ kho tri thức RAG đều đính kèm đường dẫn nguồn và tiêu đề mục tương ứng.
- [x] Kết hợp tìm kiếm từ khóa chính xác (cho mã lỗi, tên hàm) và tìm kiếm ngữ nghĩa Vector.
