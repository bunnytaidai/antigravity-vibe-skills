---
name: error-handling-logger
description: >-
  [Thư Ký Bắt Lỗi Toàn Cục & Ghi Nhật Ký Tiếng Việt Rõ Ràng] — Tác dụng: Giúp phần mềm không bị sập đột ngột khi gặp sự cố bất ngờ mà tự động ghi lại nhật ký tiếng Việt chỉ rõ: Lỗi gì, ở file nào, dòng bao nhiêu để sửa ngay lập tức — Kích hoạt: Khi thiết lập hệ thống bắt lỗi (Try/Catch) và ghi file nhật ký (Log) cho dự án.
---

# KỸ NĂNG CHUYÊN SÂU: `ERROR-HANDLING-LOGGER` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `error-handling-logger`
- **Vai trò:** Kỹ sư Quản lý Ngoại lệ Toàn cục & Nhật ký Cấu trúc (`Global Exception & Structured Logging Architect`)
- **Trọng tâm nhiệm vụ:** Thiết lập bộ bắt lỗi tập trung (`Global Error Middleware`), chuẩn hóa mã lỗi nghiệp vụ và ghi nhật ký định dạng JSON/Tiếng Việt có gắn mã truy vết (`Correlation/Trace ID`) kèm xoay vòng file log (`RotatingFileHandler`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Tuyệt đối cấm dùng `except Exception: pass` làm nuốt mất lỗi âm thầm.
2. Phân biệt rõ lỗi cho người dùng xem (thông báo Tiếng Việt lịch sự, dễ hiểu) và nhật ký kỹ thuật cho lập trình viên (chứa đầy đủ `trace_id`, tên file, số dòng, `stack_trace`).
3. Tự động che dấu (`Mask/Redact`) các trường nhạy cảm như `password`, `token`, `authorization`, `api_key` trước khi ghi vào file log.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import json, logging, traceback, uuid
from datetime import datetime, timezone

class StructuredVietnameseFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "trace_id": getattr(record, "trace_id", str(uuid.uuid4())[:8]),
            "location": f"{record.filename}:{record.lineno}",
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = "".join(traceback.format_exception(*record.exc_info)).strip()
        return json.dumps(payload, ensure_ascii=False)
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Mọi lỗi bất ngờ đều trả về cấu trúc JSON thống nhất kèm mã `trace_id` để tra cứu ngay trong thư mục `logs/`.
- [x] File nhật ký được cấu hình `RotatingFileHandler` (ví dụ tối đa `10MB/file`, giữ `5 file`) không bao giờ làm đầy ổ cứng.
- [x] Kiểm tra file log đảm bảo hiển thị chuẩn UTF-8 Tiếng Việt và không chứa bất kỳ mật khẩu hay API Key nào.
