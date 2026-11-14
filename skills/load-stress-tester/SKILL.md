---
name: load-stress-tester
description: >-
  [Chuyên Gia Thử Nghiệm Sức Chịu Tải Hàng Ngàn Luồng Cùng Lúc (Stress Test)] — Tác dụng: Tận dụng 24 luồng CPU Xeon và 64GB RAM để giả lập hàng trăm/ngàn người truy cập cùng lúc, đo tốc độ xử lý mỗi giây (RPS) và phát hiện chỗ gây nghẽn — Kích hoạt: Khi cần đo tốc độ phản hồi và độ chịu tải của máy chủ Backend/API.
---

# KỸ NĂNG CHUYÊN SÂU: `LOAD-STRESS-TESTER` (NHÓM 5: QA, TESTING, DEBUGGING, REFACTORING & SECURITY — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `load-stress-tester`
- **Vai trò:** Chuyên gia Kiểm thử Chịu tải & Đo kiểm Hiệu năng Hệ thống (`Load, Stress & Concurrency Benchmark Lead`)
- **Trọng tâm nhiệm vụ:** Giả lập hàng trăm đến hàng ngàn luồng truy cập đồng thời tận dụng 24 luồng CPU Intel Xeon E5-2678 v3 và 64GB RAM để đo thông lượng (`RPS`), độ trễ phân vị (`p50`, `p95`, `p99`) và phát hiện điểm nghẽn cổ chai.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Chỉ chạy kiểm thử chịu tải đối với máy chủ nội bộ (`localhost` / `127.0.0.1`) hoặc môi trường thử nghiệm của người dùng.
2. Đánh giá hiệu năng dựa trên phân vị thứ 95 và 99 (`p95`, `p99` Latency) thay vì chỉ nhìn vào số trung bình cộng (`Average`) dễ gây ảo tưởng.
3. Tăng tải theo từng bậc (`Ramp-up`: `10` ➔ `50` ➔ `200` luồng đồng thời) và đóng sạch toàn bộ kết nối sau khi kết thúc bài đo.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import statistics, time
from concurrent.futures import ThreadPoolExecutor
from typing import Callable

def run_concurrency_benchmark(worker_fn: Callable[[], bool], total_requests: int = 100, concurrency: int = 20) -> dict:
    latencies_ms: list[float] = []
    successes = 0

    def _timed_call(_: int) -> None:
        nonlocal successes
        t0 = time.perf_counter()
        ok = worker_fn()
        latencies_ms.append((time.perf_counter() - t0) * 1000.0)
        if ok:
            successes += 1

    start_all = time.perf_counter()
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        list(pool.map(_timed_call, range(total_requests)))
    duration_s = max(time.perf_counter() - start_all, 0.001)
    sorted_lat = sorted(latencies_ms)
    p95 = sorted_lat[int(len(sorted_lat) * 0.95) - 1] if sorted_lat else 0.0
    return {"rps": round(total_requests / duration_s, 2), "success_rate": f"{(successes/total_requests)*100:.1f}%", "p95_ms": round(p95, 2)}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Tỷ lệ lỗi (`Error Rate`) ở mức tải mục tiêu giữ ở mức `0%`.
- [x] Độ trễ `p95` của các API đọc dữ liệu đạt dưới `100ms`.
- [x] Sau khi bài kiểm thử kết thúc, mức sử dụng CPU và RAM trở về trạng thái nghỉ bình thường.
