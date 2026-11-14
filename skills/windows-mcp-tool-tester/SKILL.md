---
name: windows-mcp-tool-tester
description: >-
  [Kiểm Định Viên Đo Tốc Độ & Độ Chính Xác Công Cụ Điều Khiển Windows] — Tác dụng: Chạy bộ 10-20 bài test hộp đen (Black-Box) đo tốc độ mili-giây và kiểm chứng chéo cho 21 công cụ của windows-mcp — Kích hoạt: Khi kiểm tra chất lượng (QA) hoặc đo tốc độ (Benchmark) bộ công cụ windows-mcp.
---

# KỸ NĂNG CHUYÊN SÂU: `WINDOWS-MCP-TOOL-TESTER` (NHÓM 4: AI AGENT, PROMPT ENGINEERING & MCP SYSTEM — `version.4.2.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `windows-mcp-tool-tester`
- **Vai trò:** Kỹ sư Kiểm định Chất lượng & Đo Hiệu năng Công cụ Windows-MCP (`Black-Box QA & Benchmark Tester`)
- **Trọng tâm nhiệm vụ:** Phối hợp trực tiếp với MCP Server **`windows-mcp`** (và **`time`** / **`PowerShell`**) để thực thi kiểm thử hộp đen (`Black-Box Testing`) từng công cụ trong bộ 21 công cụ của `windows-mcp` qua 6 nhóm kịch bản (`Happy Path`, `Boundary`, `Invalid Input`, `Stress/Timing`, `Multi-Monitor/DPI`, `Cross-Tool Verification`) kèm đo thời gian thực thi chính xác.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. **Đánh giá chuyên sâu từng công cụ:** Mỗi phiên kiểm thử tập trung đánh giá chuyên sâu từng công cụ với `10 - 20 Test Cases` bao phủ đủ các nhánh tham số trong Schema JSON (`~/.gemini\antigravity\mcp\windows-mcp\<ToolName>.json`).
2. **Kiểm chứng chéo độc lập (`Cross-Tool Verification`):** Bắt buộc sử dụng một công cụ thứ hai độc lập để xác nhận tác dụng thực tế (ví dụ: sau khi test `Registry(mode='set')`, dùng `PowerShell` kiểm chứng lại giá trị thực trên hệ thống; sau khi test `App(mode='launch')`, dùng `Process(mode='list')` kiểm tra `PID`).
3. **Đo độ trễ & Dọn dẹp 100% (`Latency & Clean Teardown`):** Ghi nhận thời gian phản hồi (`Latency ms`) và dọn dẹp sạch sẽ mọi khóa Registry tạm, tệp tạm hay tiến trình thử nghiệm (theo đúng `PID`) sau khi kết thúc.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import time
from dataclasses import dataclass

@dataclass
class ToolBenchmarkRecord:
    tool_name: str
    case_id: str
    passed: bool
    elapsed_ms: float
    verification_note: str

def measure_step_latency(fn) -> tuple[object, float]:
    start = time.perf_counter()
    result = fn()
    elapsed_ms = round((time.perf_counter() - start) * 1000.0, 2)
    return result, elapsed_ms
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Báo cáo kiểm thử xuất ra đầy đủ bảng tổng hợp: `Test Case ID`, `Tham số đầu vào`, `Kết quả kỳ vọng`, `Kết quả thực tế`, `Thời gian (ms)` và `Trạng thái PASS/FAIL`.
- [x] 100% tài nguyên thử nghiệm (`Temp Files`, `Test Registry Keys`, `Spawned PIDs`) được dọn sạch ở bước `Teardown`.
- [x] Không tự ý sửa mã nguồn nội bộ của MCP Server khi đang chạy kiểm thử hộp đen.
