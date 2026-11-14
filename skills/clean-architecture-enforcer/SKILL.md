---
name: clean-architecture-enforcer
description: >-
  [Kiến Trúc Sư Giữ Cấu Trúc Code Ngăn Nắp 3 Tầng (Clean Architecture)] — Tác dụng: Phân chia dự án thành 3 ngăn rõ ràng: Giao diện (UI/API) ➔ Xử lý nghiệp vụ (Service) ➔ Kho dữ liệu (Database), giúp dự án lớn dễ hiểu, sửa chỗ này không làm hỏng chỗ kia — Kích hoạt: Khi khởi tạo dự án mới khi Vibe Coding hoặc sắp xếp lại cấu trúc thư mục.
---

# KỸ NĂNG CHUYÊN SÂU: `CLEAN-ARCHITECTURE-ENFORCER` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `clean-architecture-enforcer`
- **Vai trò:** Kiến trúc sư Hệ thống Phân tầng Sạch (`Clean & Hexagonal Architecture Enforcer`)
- **Trọng tâm nhiệm vụ:** Thực thi nghiêm ngặt quy tắc phụ thuộc một chiều: `Presentation (API/UI)` ➔ `Application (Use Cases/Services)` ➔ `Domain (Entities/Business Rules)` ⇐ `Infrastructure (DB/External APIs)`.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Tầng `Domain` (Lõi nghiệp vụ) hoàn toàn độc lập, không được `import` bất kỳ thư viện giao diện, HTTP framework (`FastAPI`/`Express`) hay ORM cụ thể nào.
2. Tầng `Controller/Router` chỉ làm nhiệm vụ nhận Request, kiểm tra hợp lệ đầu vào, gọi `Service` và trả về Response (không viết câu lệnh SQL trong Controller).
3. Sử dụng `Dependency Injection (DI)` để dễ dàng thay thế Database thật bằng bản giả lập (`In-Memory Fake`) khi chạy Unit Test.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
from typing import Protocol
from dataclasses import dataclass

@dataclass(frozen=True)
class OrderEntity:
    order_id: str
    amount_vnd: int

class OrderRepositoryPort(Protocol):
    def save(self, order: OrderEntity) -> None: ...

class CreateOrderUseCase:
    def __init__(self, repo: OrderRepositoryPort) -> None:
        self._repo = repo

    def execute(self, order_id: str, amount_vnd: int) -> OrderEntity:
        if amount_vnd <= 0:
            raise ValueError("Số tiền đơn hàng phải lớn hơn 0 VNĐ")
        entity = OrderEntity(order_id=order_id, amount_vnd=amount_vnd)
        self._repo.save(entity)
        return entity
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Kiểm tra đồ thị phụ thuộc (`@sdsrs/code-graph`) không có bất kỳ vòng lặp phụ thuộc (`Circular Dependency`) nào giữa các module.
- [x] Mỗi tệp mã nguồn giữ ở kích thước gọn gàng (`< 300 dòng`), mỗi lớp/hàm đảm nhận đúng 1 trách nhiệm duy nhất (`Single Responsibility`).
- [x] Có thể chạy kiểm thử toàn bộ tầng `UseCase/Service` trong `10ms` mà không cần bật máy chủ Database thật.
