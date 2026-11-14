---
name: memory-leak-profiler
description: >-
  [Bác Sĩ Chống Tràn Bộ Nhớ RAM & Treo CPU Trên Máy Trạm] — Tác dụng: Theo dõi mức tiêu thụ RAM của từng hàm, phát hiện và đóng sạch các kết nối ngầm hoặc vòng lặp quên giải phóng bộ nhớ — Kích hoạt: Khi phần mềm chạy lâu bị ngốn RAM, chậm dần hoặc nặng máy.
---

# KỸ NĂNG CHUYÊN SÂU: `MEMORY-LEAK-PROFILER` (NHÓM 5: QA, TESTING, DEBUGGING, REFACTORING & SECURITY — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `memory-leak-profiler`
- **Vai trò:** Chuyên gia Chẩn đoán Rò rỉ Bộ nhớ & Tối ưu Tài nguyên (`Memory Leak & Resource Lifecycle Profiler`)
- **Trọng tâm nhiệm vụ:** Phát hiện và triệt tiêu các nguồn gây rò rỉ RAM và treo CPU trên Windows: mảng/bộ đệm phình to không giới hạn, `Event Listener` / `setInterval` không hủy khi đóng Component, và kết nối file/DB không đóng.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Trong React/Frontend, mọi `useEffect` có đăng ký `addEventListener`, `setInterval`, `WebSocket` hoặc `AbortController` bắt buộc phải trả về hàm dọn dẹp (`Cleanup Function`).
2. Trong Python/Node.js, mọi bộ nhớ đệm trong RAM không được dùng `dict` hay `Map` phình to vô hạn; bắt buộc giới hạn số phần tử tối đa (`maxsize` / `LRU Cache`).
3. Sử dụng `tracemalloc` (Python) hoặc `take_heapsnapshot` (`edge/chrome-devtools-mcp`) để đối chiếu bộ nhớ trước và sau khi chạy lặp tác vụ.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import tracemalloc
from typing import Callable

def profile_memory_delta_kb(action_fn: Callable[[], None], iterations: int = 100) -> float:
    tracemalloc.start()
    snap_before = tracemalloc.take_snapshot()
    for _ in range(iterations):
        action_fn()
    snap_after = tracemalloc.take_snapshot()
    tracemalloc.stop()
    stats = snap_after.compare_to(snap_before, "lineno")
    total_delta_bytes = sum(stat.size_diff for stat in stats if stat.size_diff > 0)
    return round(total_delta_bytes / 1024.0, 2)
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Chạy lặp một thao tác 100 lần liên tiếp, dung lượng bộ nhớ giữ ổn định (đồ thị dạng răng cưa phẳng, không dốc đứng lên mãi).
- [x] Toàn bộ thao tác mở file và kết nối mạng đều nằm trong khối `with` (`Context Manager`) hoặc `try ... finally`.
- [x] Không còn tiến trình ngầm mồ côi (`node.exe`, `python.exe`, `chrome.exe`) chiếm RAM sau khi đóng ứng dụng.
