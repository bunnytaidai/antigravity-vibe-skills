---
name: unit-test-generator
description: >-
  [Máy Tự Động Viết Bài Kiểm Tra Từng Hàm Tính Toán (Pytest / Vitest / Jest)] — Tác dụng: Tự động tạo các bài test kiểm tra từng hàm nhỏ trong code với đủ 3 tình huống: Nhập đúng chuẩn, Nhập giá trị sát biên và Nhập sai dữ liệu để bắt lỗi sớm — Kích hoạt: Khi viết xong hàm xử lý mới hoặc cần kiểm tra độ chính xác của logic tính toán.
---

# KỸ NĂNG CHUYÊN SÂU: `UNIT-TEST-GENERATOR` (NHÓM 5: QA, TESTING, DEBUGGING, REFACTORING & SECURITY — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `unit-test-generator`
- **Vai trò:** Kỹ sư Kiểm thử Đơn vị & Phát triển Hướng Kiểm thử (`TDD & Pytest / Vitest / Jest Architect`)
- **Trọng tâm nhiệm vụ:** Thiết kế bộ kiểm thử đơn vị (`Unit Tests`) độc lập, chạy siêu tốc theo cấu trúc `Arrange - Act - Assert (AAA)`, bao phủ đầy đủ luồng chuẩn (`Happy Path`), giá trị biên (`Boundary/Edge Cases`) và ngoại lệ (`Error Paths`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Mỗi hàm kiểm thử (`test_<ten_ham>_<kich_ban>_<ket_qua>`) chỉ kiểm tra 1 hành vi cụ thể và hoàn toàn độc lập với thứ tự chạy của các bài test khác.
2. Giả lập (`Mock/Stub/Fake`) toàn bộ các kết nối mạng, thời gian thực hoặc hệ thống tệp bên ngoài để bộ Unit Test chạy xong trong vài chục mili-giây.
3. Sử dụng kiểm thử tham số hóa (`@pytest.mark.parametrize` hoặc `test.each`) để kiểm tra hàng loạt bộ dữ liệu đầu vào gọn gàng.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import unittest

def clamp_percentage(value: float) -> float:
    if not isinstance(value, (int, float)):
        raise TypeError("Giá trị phần trăm phải là số")
    return max(0.0, min(100.0, float(value)))

class TestClampPercentage(unittest.TestCase):
    def test_happy_path_within_range(self) -> None:
        self.assertEqual(clamp_percentage(45.5), 45.5)

    def test_boundary_values_clamped(self) -> None:
        self.assertEqual(clamp_percentage(-10), 0.0)
        self.assertEqual(clamp_percentage(150), 100.0)

    def test_invalid_type_raises_type_error(self) -> None:
        with self.assertRaises(TypeError):
            clamp_percentage("invalid")  # type: ignore[arg-type]
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Mọi hàm nghiệp vụ quan trọng đều có ít nhất 3 kịch bản test: `Happy Path`, `Boundary/Edge Case` và `Invalid Input`.
- [x] Toàn bộ bộ Unit Test chạy hoàn tất xanh 100% (`0 failed`) mà không cần kết nối Internet.
- [x] Không để lại bất kỳ tệp rác nào trên ổ đĩa sau khi chạy xong `pytest` / `vitest`.
