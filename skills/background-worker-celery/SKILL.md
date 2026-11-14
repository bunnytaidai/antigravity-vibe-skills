---
name: background-worker-celery
description: >-
  [Chuyên Gia Đẩy Việc Nặng Chạy Ngầm Không Làm Đơ Máy Chủ (Queue / Worker)] — Tác dụng: Tách các việc tốn thời gian (gửi hàng trăm email, xuất file Excel/PDF lớn, cào dữ liệu) xuống chạy ngầm và tự động thử lại nếu mạng chập chờn — Kích hoạt: Khi xử lý tác vụ nặng chạy ngầm hoặc hàng đợi công việc.
---

# KỸ NĂNG CHUYÊN SÂU: `BACKGROUND-WORKER-CELERY` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `background-worker-celery`
- **Vai trò:** Kỹ sư Hệ thống Hàng đợi & Tác vụ Chạy ngầm (`Distributed Queue & Background Worker Architect`)
- **Trọng tâm nhiệm vụ:** Tách các tác vụ nặng (gửi email, xuất báo cáo lớn, đồng bộ dữ liệu, gọi AI) sang tiến trình Worker chạy ngầm (`Celery` / `BullMQ` / `ARQ`) có cơ chế thử lại lũy thừa (`Exponential Backoff`) và chống chạy trùng (`Idempotency`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Mọi tác vụ đẩy vào hàng đợi chỉ truyền `ID` hoặc dữ liệu JSON gọn nhẹ, không truyền cả đối tượng kết nối Database hay tệp nhị phân lớn.
2. Mọi hàm Worker phải có tính lũy đẳng (`Idempotent`): nếu chạy lại lần 2 do lỗi mạng giữa chừng thì không được tạo bản ghi trùng lặp.
3. Cấu hình giới hạn thời gian chạy (`soft_time_limit` và `time_limit`) để không có tiến trình Worker nào bị treo vĩnh viễn.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import asyncio, logging
from typing import Callable, Awaitable

async def run_with_exponential_backoff(task_fn: Callable[[], Awaitable[dict]], max_retries: int = 3) -> dict:
    for attempt in range(1, max_retries + 1):
        try:
            return await task_fn()
        except Exception as exc:
            if attempt == max_retries:
                logging.error("Tác vụ ngầm thất bại sau %d lần thử: %s", attempt, exc)
                raise
            wait_sec = 2 ** (attempt - 1)
            logging.warning("Lần thử %d lỗi (%s), chờ %ds trước khi thử lại...", attempt, exc, wait_sec)
            await asyncio.sleep(wait_sec)
    return {}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] API chính phản hồi ngay lập tức (`HTTP 202 Accepted` kèm `task_id` dưới `50ms`) mà không bắt người dùng chờ tác vụ nặng.
- [x] Khi dịch vụ bên ngoài lỗi tạm thời, Worker tự động thử lại theo `Exponential Backoff` và đẩy vào `Dead-Letter Queue` nếu vượt ngưỡng.
- [x] Trên Windows 10, tiến trình Worker kết thúc sạch sẽ khi nhận tín hiệu dừng.
