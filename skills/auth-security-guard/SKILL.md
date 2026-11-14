---
name: auth-security-guard
description: >-
  [Vệ Sĩ Bảo Mật Đăng Nhập & Phân Quyền Tài Khoản (JWT / OAuth2)] — Tác dụng: Mã hóa mật khẩu người dùng an toàn tuyệt đối, cấp thẻ phiên đăng nhập (Token) và kiểm soát chặt quyền hạn giữa Quản trị viên (Admin) và Người dùng thường — Kích hoạt: Khi làm chức năng Đăng ký, Đăng nhập, Quên mật khẩu hoặc Phân quyền.
---

# KỸ NĂNG CHUYÊN SÂU: `AUTH-SECURITY-GUARD` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `auth-security-guard`
- **Vai trò:** Kiến trúc sư Bảo mật Xác thực & Phân quyền (`Authentication, JWT/OAuth2 & RBAC Security Architect`)
- **Trọng tâm nhiệm vụ:** Thiết kế hệ thống đăng nhập an toàn với băm mật khẩu `Argon2id`/`Bcrypt`, cơ chế xoay vòng `Access Token` ngắn hạn + `Refresh Token` (`HttpOnly, Secure, SameSite=Strict`) và phân quyền `RBAC`.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Tuyệt đối không lưu mật khẩu dạng văn bản thuần (`Plaintext`) hoặc băm yếu (`MD5`/`SHA1`); bắt buộc dùng `Argon2id` hoặc `Bcrypt` (`cost >= 12`).
2. `Access Token` có hạn ngắn (`15 phút`); `Refresh Token` lưu trong `HttpOnly Cookie` và có cơ chế thu hồi (`Token Revocation`) khi đăng xuất.
3. Áp dụng giới hạn tốc độ (`Rate Limiting`) tại đường dẫn `/login` để chặn tấn công dò mật khẩu (`Brute-force`).

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import hashlib, hmac, secrets, time

def hash_password_pbkdf2(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return f"{salt.hex()}:{dk.hex()}"

def verify_password_pbkdf2(password: str, stored_hash: str) -> bool:
    salt_hex, dk_hex = stored_hash.split(":", 1)
    expected = hash_password_pbkdf2(password, bytes.fromhex(salt_hex))
    return hmac.compare_digest(expected, stored_hash)
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] So sánh mật khẩu/token luôn dùng hàm chống tấn công thời gian (`hmac.compare_digest`).
- [x] Khi người dùng không đủ quyền, trả về đúng mã `HTTP 401 Unauthorized` (chưa đăng nhập) hoặc `HTTP 403 Forbidden` (không đủ quyền RBAC).
- [x] Không bao giờ trả trường `password_hash` về trong JSON phản hồi API.
