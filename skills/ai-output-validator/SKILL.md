---
name: ai-output-validator
description: >-
  [Bộ Lọc Kiểm Duyệt Đầu Ra AI Chuẩn Khuôn Mẫu JSON/Pydantic] — Tác dụng: Ép câu trả lời của AI hoặc dữ liệu trả về từ mô hình ngôn ngữ (LLM) phải đúng 100% cấu trúc dữ liệu quy định, tự động lọc bỏ chữ thừa gây lỗi phần mềm — Kích hoạt: Khi cần lấy dữ liệu JSON chuẩn xác từ AI hoặc kiểm duyệt quy trình điều phối.
---

# KỸ NĂNG CHUYÊN SÂU: `AI-OUTPUT-VALIDATOR` (NHÓM 4: AI AGENT, PROMPT ENGINEERING & MCP SYSTEM — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `ai-output-validator`
- **Vai trò:** Kỹ sư Kiểm duyệt Đầu ra AI có Cấu trúc (`Structured LLM Output & Schema Guardrail Specialist`)
- **Trọng tâm nhiệm vụ:** Ép khuôn phản hồi của LLM/Agent luôn tuân thủ tuyệt đối 100% định dạng `Pydantic v2` / `JSON Schema` kèm vòng lặp tự động phản hồi lỗi để AI tự sửa (`Self-Correction Validation Retry Loop`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Không bao giờ dùng `json.loads()` trần trụi trên chuỗi văn bản do AI sinh ra mà không qua bước bóc tách khối Markdown và kiểm định bằng `Pydantic.model_validate_json()`.
2. Mọi trường trong Schema phải có `Field(..., description='...')` cụ thể và ràng buộc giá trị (`ge`, `le`, `min_length`, `Literal`) để chặn AI trả về giá trị rỗng hoặc ngoài phạm vi.
3. Nếu AI trả về sai Schema ở lần 1, tự động gửi lại chính thông báo `ValidationError` vào ngữ cảnh để AI sửa ngay (tối đa `2 lần retry`).

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import json, re
from typing import TypeVar, Type
from pydantic import BaseModel, Field, ValidationError

T = TypeVar("T", bound=BaseModel)

class AgentTaskAnalysis(BaseModel):
    intent: str = Field(..., min_length=3, description="Ý định cốt lõi của người dùng")
    selected_tools: list[str] = Field(default_factory=list, description="Danh sách công cụ MCP cần gọi")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Độ tin cậy phân tích từ 0.0 đến 1.0")

def parse_and_validate_llm_json(raw_text: str, schema: Type[T]) -> T:
    cleaned = re.sub(r"^\x60{3}(?:json)?\s*|\s*\x60{3}$", "", raw_text.strip(), flags=re.MULTILINE)
    return schema.model_validate_json(cleaned)
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Hàm giải mã xử lý mượt cả trường hợp AI bọc kết quả trong khối ````json ... ```` hoặc có khoảng trắng thừa.
- [x] Dữ liệu đầu ra sau khi qua bộ lọc đạt chuẩn kiểu dữ liệu 100%, không bao giờ gây lỗi `KeyError` ở các bước tiếp theo.
- [x] Có bài kiểm thử cho cả chuỗi JSON hợp lệ và chuỗi JSON thiếu trường/sai kiểu.
