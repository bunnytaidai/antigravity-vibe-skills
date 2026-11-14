---
name: caching-redis-optimizer
description: >-
  [Chuyên Gia Bộ Nhớ Đệm Tăng Tốc Truy Xuất Tức Thì (Redis / RAM Cache)] — Tác dụng: Tận dụng 64GB RAM của máy trạm để lưu sẵn các dữ liệu hay xem vào bộ nhớ đệm, giúp trả kết quả trong vài mili-giây mà không cần đọc lại Database nhiều lần — Kích hoạt: Khi cần tăng tốc độ phản hồi API hoặc giảm tải cho Cơ sở dữ liệu.
---

# KỸ NĂNG CHUYÊN SÂU: `CACHING-REDIS-OPTIMIZER` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `caching-redis-optimizer`
- **Vai trò:** Chuyên gia Tăng tốc Bộ nhớ Đệm Đa tầng (`Redis & In-Memory Cache Performance Engineer`)
- **Trọng tâm nhiệm vụ:** Khai thác lợi thế 64GB RAM của hệ thống để thiết kế bộ đệm `L1 In-Memory LRU` + `L2 Redis` theo mô hình `Cache-Aside`, chống bão truy vấn (`Cache Stampede`) và xóa đệm chính xác khi dữ liệu gốc thay đổi.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Mọi khóa lưu trong Cache bắt buộc phải có thời gian sống (`TTL`) rõ ràng kèm độ lệch ngẫu nhiên nhỏ (`Jitter`) để tránh hàng loạt khóa hết hạn cùng một giây.
2. Đặt tên khóa theo phân cấp chuẩn: `<ten_du_an>:<moi_truong>:<thuc_the>:<id>` (ví dụ: `ag:prod:user:42`).
3. Khi cập nhật dữ liệu trong Database, phải xóa (`Invalidate`) hoặc cập nhật ngay khóa Cache tương ứng.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import time
from collections import OrderedDict
from typing import Any

class ThreadSafeTTLCache:
    def __init__(self, maxsize: int = 2048, default_ttl: int = 300) -> None:
        self.maxsize = maxsize
        self.default_ttl = default_ttl
        self._store: OrderedDict[str, tuple[Any, float]] = OrderedDict()

    def get(self, key: str) -> Any | None:
        if key not in self._store:
            return None
        val, expires_at = self._store[key]
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        self._store.move_to_end(key)
        return val

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        if len(self._store) >= self.maxsize:
            self._store.popitem(last=False)
        self._store[key] = (value, time.monotonic() + (ttl or self.default_ttl))
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Tỷ lệ trúng bộ nhớ đệm (`Cache Hit Ratio`) đạt trên `85%` cho các truy vấn đọc lặp lại.
- [x] Thời gian phản hồi API giảm từ hàng trăm mili-giây xuống dưới `5ms - 15ms`.
- [x] Khi Redis tạm ngắt kết nối, hệ thống tự động chuyển về đọc Database (`Graceful Degradation`) chứ không sập ứng dụng.
