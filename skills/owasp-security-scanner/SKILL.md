---
name: owasp-security-scanner
description: >-
  [Lá Chắn Quét & Chặn Đứng Lỗ Hổng Bảo Mật (OWASP Top 10)] — Tác dụng: Rà soát mã nguồn để khóa chặt các lỗ hổng nguy hiểm như chèn mã độc SQL (SQL Injection), mã độc giao diện (XSS) và truy cập trái phép thư mục hệ thống (Path Traversal) — Kích hoạt: Khi kiểm tra bảo mật dữ liệu đầu vào của người dùng trước khi hoàn thiện dự án.
---

# KỸ NĂNG CHUYÊN SÂU: `OWASP-SECURITY-SCANNER` (NHÓM 5: QA, TESTING, DEBUGGING, REFACTORING & SECURITY — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `owasp-security-scanner`
- **Vai trò:** Chuyên gia Kiểm định An ninh Ứng dụng & Phòng chống Lỗ hổng (`OWASP Top 10 Security Auditor`)
- **Trọng tâm nhiệm vụ:** Rà soát mã nguồn và chặn đứng các lỗ hổng nguy hiểm theo chuẩn `OWASP Top 10`: `SQL Injection`, `XSS`, `CSRF`, `SSRF`, `Path Traversal`, `Command Injection` và lỗi phân quyền (`IDOR / Broken Access Control`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Tuyệt đối không nối chuỗi trực tiếp vào câu lệnh SQL (`f'SELECT * FROM users WHERE name = {name}'`) hay câu lệnh hệ thống (`subprocess.run(cmd, shell=True)`); bắt buộc dùng `Parameterized Queries` và truyền mảng tham số.
2. Khi xử lý đường dẫn tệp do người dùng tải lên hoặc yêu cầu, phải chuẩn hóa bằng `Path.resolve()` và kiểm tra `.is_relative_to(BASE_DIR)` để chặn tấn công leo thang thư mục (`../../Windows/System32`).
3. Không dùng `dangerouslySetInnerHTML` hoặc `innerHTML` với dữ liệu chưa qua khử độc (`DOMPurify`).

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import pathlib

def resolve_safe_user_path(base_dir: str, user_supplied_rel_path: str) -> pathlib.Path:
    """Chặn đứng lỗ hổng Path Traversal (../) trên Windows & Linux."""
    root = pathlib.Path(base_dir).resolve()
    target = (root / user_supplied_rel_path).resolve()
    if not target.is_relative_to(root):
        raise PermissionError(f"Phát hiện truy cập vượt phạm vi thư mục an toàn: {user_supplied_rel_path}")
    return target
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] 100% câu lệnh SQL sử dụng biến tham số hóa (`$1, $2` hoặc `?`, `:param`).
- [x] Mọi API lấy/sửa/xóa tài nguyên theo `id` đều kiểm tra quyền sở hữu (`resource.owner_id == current_user.id`) để chống lỗ hổng `IDOR`.
- [x] Các hàm xử lý tệp đều qua bộ lọc `resolve_safe_user_path` và giới hạn định dạng/dung lượng tải lên.
