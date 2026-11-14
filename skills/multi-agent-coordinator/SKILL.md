---
name: multi-agent-coordinator
description: >-
  [Nhạc Trưởng Phân Việc Cho Đội Ngũ AI Phụ (Subagents)] — Tác dụng: Chia một dự án lớn thành nhiều phần độc lập (Backend riêng, UI riêng, Test riêng) và giao cho các AI phụ làm cùng lúc mà không dẫm chân lên file của nhau — Kích hoạt: Khi làm dự án lớn nhiều hạng mục cần chạy song song.
---

# KỸ NĂNG CHUYÊN SÂU: `MULTI-AGENT-COORDINATOR` (NHÓM 4: AI AGENT, PROMPT ENGINEERING & MCP SYSTEM — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `multi-agent-coordinator`
- **Vai trò:** Nhạc trưởng Điều phối Hệ thống Đa Tác nhân (`Multi-Agent Orchestration & Subagent Workflow Lead`)
- **Trọng tâm nhiệm vụ:** Thiết kế kiến trúc phân công và phối hợp giữa các Agent chuyên biệt (`Planner` ➔ `Researcher` ➔ `Implementer` ➔ `Reviewer/QA`) với hợp đồng bàn giao trạng thái (`Handoff Contract`), cô lập ngữ cảnh và chống lặp vô tận.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Mỗi Subagent khi được gọi (`invoke_subagent`) phải nhận được một bản giao việc (`Task Brief`) tự chứa đầy đủ: **(1) Mục tiêu cụ thể**, **(2) Danh sách file liên quan**, **(3) Ràng buộc không được vi phạm**, và **(4) Định dạng báo cáo kết quả**.
2. Các tác vụ độc lập không đụng chạm chung một tệp mã nguồn phải được điều phối chạy song song để rút ngắn thời gian chờ.
3. Luôn đặt giới hạn số vòng trao đổi (`max_turns`) và bước nghiệm thu độc lập trước khi hợp nhất kết quả.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
from dataclasses import dataclass, field

@dataclass
class SubagentTaskBrief:
    role: str
    objective: str
    target_files: list[str]
    constraints: list[str] = field(default_factory=list)
    expected_output: str = "Báo cáo ngắn gọn các thay đổi kèm kết quả chạy kiểm thử thực tế."

    def to_prompt(self) -> str:
        files_str = ", ".join(self.target_files) if self.target_files else "Tự khảo sát trong phạm vi module"
        rules_str = "\n".join(f"- {c}" for c in self.constraints)
        return (
            f"### VAI TRÒ: {self.role}\n"
            f"### MỤC TIÊU: {self.objective}\n"
            f"### TỆP TRỌNG TÂM: {files_str}\n"
            f"### RÀNG BUỘC BẮT BUỘC:\n{rules_str}\n"
            f"### ĐẦU RA YÊU CẦU: {self.expected_output}"
        )
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Hai Subagent chạy song song không bao giờ ghi đè vào cùng một file tại cùng một thời điểm.
- [x] Ngữ cảnh của Agent chính (`Parent Agent`) được giữ gọn gàng, chỉ nhận bản tóm tắt kết quả đã qua kiểm chứng từ Subagent.
- [x] Mỗi hạng mục sau khi Subagent hoàn thành đều được kiểm tra chéo với kế hoạch gốc (`Spec Compliance`).
