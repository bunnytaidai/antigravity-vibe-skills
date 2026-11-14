---
name: secret-env-protector
description: >-
  [Người Gác Đền Giấu Mật Khẩu & Khóa Bí Mật Vào File .env] — Tác dụng: Tự động cất toàn bộ mật khẩu Database, API Key, Token vào tệp .env riêng biệt và chặn không cho đẩy nhầm mật khẩu lên GitHub — Kích hoạt: Khi cấu hình kết nối Database, khóa API bên thứ ba hoặc kiểm tra an toàn mã nguồn.
---

# KỸ NĂNG CHUYÊN SÂU: `SECRET-ENV-PROTECTOR` (NHÓM 5: QA, TESTING, DEBUGGING, REFACTORING & SECURITY — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `secret-env-protector`
- **Vai trò:** Người Gác đền Khóa Bí mật & Cấu hình Môi trường (`Secret Management & .env Security Guardian`)
- **Trọng tâm nhiệm vụ:** Bảo vệ tuyệt đối mật khẩu CSDL, `API Key`, `JWT Secret`, `Private Key` bằng tệp `.env`, kiểm tra tự động sự tồn tại của biến môi trường lúc khởi động (`Fail-Fast Env Validation`) và quét mã nguồn chống lộ khóa trước khi Commit.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Tuyệt đối không gán cứng (`Hardcode`) bất kỳ khóa bí mật thật nào trong mã nguồn; luôn đọc qua `os.environ` hoặc `process.env`.
2. Mỗi dự án phải có tệp `.env.example` (chỉ chứa tên biến và giá trị mẫu rỗng) và đảm bảo `.env` nằm trong `.gitignore`.
3. Kiểm tra đầy đủ các biến môi trường bắt buộc ngay khi ứng dụng vừa khởi động để báo lỗi tiếng Việt rõ ràng nếu quên cấu hình.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
import os, re

SECRET_PATTERNS = [
    re.compile(r"AIza[0-9A-Za-z\-_]{35}"),          # Google / Gemini API Key
    re.compile(r"sk-[A-Za-z0-9]{20,}"),              # OpenAI / Generic Secret Key
    re.compile(r"ghp_[A-Za-z0-9]{36}"),              # GitHub Personal Access Token
]

def scan_text_for_leaked_secrets(source_code: str) -> list[str]:
    findings: list[str] = []
    for pat in SECRET_PATTERNS:
        for match in pat.findall(source_code):
            findings.append(f"{match[:6]}...{match[-4:]}")
    return findings

def require_env_vars(keys: list[str]) -> dict[str, str]:
    missing = [k for k in keys if not os.getenv(k)]
    if missing:
        raise EnvironmentError(f"Thiếu biến môi trường bắt buộc trong .env: {', '.join(missing)}")
    return {k: os.environ[k] for k in keys}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Quét toàn bộ mã nguồn bằng `scan_text_for_leaked_secrets` trả về `0` phát hiện rò rỉ.
- [x] Tệp `.gitignore` có đầy đủ `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`.
- [x] Khi thiếu biến môi trường trong `.env`, ứng dụng báo rõ tên biến bị thiếu ngay lúc khởi động.
