---
name: microservices-orchestrator
description: >-
  [Kiến Trúc Sư Chia Nhỏ Hệ Thống Chạy Đa Luồng (Xeon 24 Threads)] — Tác dụng: Phối hợp nhiều dịch vụ chạy song song tận dụng sức mạnh 24 luồng CPU Xeon và trang bị cầu chì tự ngắt (Circuit Breaker) khi một dịch vụ con bị quá tải — Kích hoạt: Khi thiết kế hệ thống nhiều dịch vụ con hoặc xử lý song song quy mô lớn.
---

# KỸ NĂNG CHUYÊN SÂU: `MICROSERVICES-ORCHESTRATOR` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `microservices-orchestrator`
- **Vai trò:** Kiến trúc sư Điều phối Đa Dịch vụ & Xử lý Song song (`Microservices & Multi-Process Orchestrator`)
- **Trọng tâm nhiệm vụ:** Thiết kế kiến trúc đa dịch vụ / đa tiến trình tận dụng tối đa 12 nhân 24 luồng CPU Intel Xeon E5-2678 v3 và 64GB RAM, tích hợp cầu chì ngắt mạch (`Circuit Breaker`), kiểm tra sức khỏe (`Health/Readiness Probes`) và đóng tiến trình êm ái (`Graceful Shutdown`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Mọi lệnh gọi liên dịch vụ (`Service-to-Service RPC/HTTP`) bắt buộc phải có `Timeout` chặt chẽ và bộ ngắt mạch (`Circuit Breaker`) để một dịch vụ chậm không kéo sập toàn hệ thống.
2. Với các tác vụ tính toán nặng CPU trên Windows, sử dụng `concurrent.futures.ProcessPoolExecutor(max_workers=12)` để khai thác 12 nhân vật lý của CPU Xeon.
3. Mỗi dịch vụ quản lý nguồn dữ liệu riêng biệt và giao tiếp qua hợp đồng Schema rõ ràng.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import time
from typing import Callable, TypeVar

T = TypeVar("T")

class SimpleCircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 15.0) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.opened_at: float | None = None

    def call(self, fn: Callable[[], T]) -> T:
        if self.opened_at and (time.monotonic() - self.opened_at) < self.recovery_timeout:
            raise RuntimeError("Circuit Breaker đang MỞ (OPEN) — tạm ngắt để bảo vệ hệ thống")
        try:
            result = fn()
            self.failures = 0
            self.opened_at = None
            return result
        except Exception:
            self.failures += 1
            if self.failures >= self.failure_threshold:
                self.opened_at = time.monotonic()
            raise
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Khi 1 dịch vụ vệ tinh bị tắt, `Circuit Breaker` tự động ngắt sau 3 lần lỗi và trả về phản hồi dự phòng ngay lập tức (`< 5ms`).
- [x] Tất cả dịch vụ con đều có cổng `/healthz` kiểm tra trạng thái sống thực tế.
- [x] Không để sót tiến trình mồ côi (`Orphaned Processes`) chiếm cổng mạng sau khi dừng hệ thống.
