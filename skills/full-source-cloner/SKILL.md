---
name: full-source-cloner
description: >-
  [Chuyên Gia Clone & Nhân Bản Dự Án Từ Full Source Gốc 1:1 (Fork / Rebrand / Clean-Room Port)] — Tác dụng: Giúp bạn sao chép nguyên vẹn 100% tính năng từ một bộ mã nguồn mẫu có sẵn (trên máy tính hoặc link GitHub) để thay áo giao diện mới, đổi tên thương hiệu riêng hoặc chuyển đổi sang nền tảng khác mà không bị sót tính năng hay làm hỏng bản gốc — Kích hoạt: Khi bạn đã có sẵn full source gốc (hoặc link GitHub) và muốn clone, nhân bản, đổi giao diện/thương hiệu hoặc dựng lại dự án tương tự.
---

# KỸ NĂNG CHUYÊN SÂU: `FULL-SOURCE-CLONER` (NHÂN BẢN, THAY ÁO & CHUYỂN ĐỔI TỪ FULL SOURCE GỐC — `version.4.6.0.1`)

## 1. Giải Thích Dễ Hiểu Cho Người Mới (`Newbie-Friendly Overview — Đọc 30 Giây Hiểu Ngay`)
- **Tên định danh (`Identifier`):** `full-source-cloner`
- **Hiểu nôm na là gì?** Hãy tưởng tượng bạn đang cầm trong tay **bản vẽ thiết kế gốc đầy đủ của một ngôi nhà mẫu** (`Full Source Gốc` — có sẵn toàn bộ thư mục code đọc được như `src/`, `package.json`, `.py`, `.tsx`...). Thay vì phải tự ngồi gõ lại từ con số 0 dễ sai sót, kỹ năng này biến AI thành **Đội Kỹ Sư Sao Chép & Cải Tạo Chuẩn 1:1**, giúp bạn làm 3 việc cực dễ:
  1. **Thay Áo & Đổi Thương Hiệu (`Fork & Rebrand`):** Giữ nguyên `100%` bộ máy tính năng bên trong đang chạy tốt của source mẫu, chỉ thay giao diện mới đẹp hơn, đổi logo, màu sắc, câu chữ Tiếng Việt và tên phần mềm thành của riêng bạn.
  2. **Rút Tinh Hoa Dựng Bản Mới Sạch Sẽ (`Clean-Room Clone`):** Khi bộ source gốc chạy đúng ý bạn nhưng code bên trong quá cũ hoặc rối rắm, AI sẽ đọc hiểu `100%` công thức và tính năng gốc rồi viết lại cho bạn một bản mới tinh, gọn gàng 3 ngăn (`Clean Architecture`).
  3. **Chuyển Đổi Sang Nền Tảng Khác (`Cross-Platform Port`):** Bạn có sẵn full source của một trang Web (`React/Node.js`) và muốn làm một phần mềm cửa sổ Windows (`PyQt6 / Electron`) hoặc Mobile App có tính năng y hệt 100%.

---

## 2. Bối Cảnh Sử Dụng Thực Tế Cho Newbie (`Khi Nào BẬT & Khi Nào KHÔNG BẬT`)

### ✅ KHI NÀO DÙNG KỸ NĂNG NÀY (`Bật ngay khi bạn gặp 1 trong các tình huống sau`):
- **Tình huống 1 (Có sẵn thư mục source mẫu trên máy):** Bạn tải về một bộ code mẫu (ví dụ: tool TikTok Live, web bán hàng, bot tự động...) mở ra thấy rõ các file code (`.js`, `.ts`, `.py`, `package.json`) và muốn bảo AI: *"Clone bộ này ra thư mục mới, giữ nguyên mọi tính năng nhưng đổi sang giao diện tối sang trọng mang tên thương hiệu của mình"*.
- **Tình huống 2 (Có link GitHub dự án mã nguồn mở):** Bạn thấy một dự án hay trên GitHub (`https://github.com/owner/repo`) và muốn AI tải ngầm về phân tích toàn bộ để dựng một phiên bản tương tự chạy riêng trên máy bạn mà không cần ngồi đọc từng file.
- **Tình huống 3 (Gộp tính năng từ source mẫu):** Bạn có source mẫu `A` có tính năng đăng nhập/thanh toán rất xịn và muốn rút đúng cụm tính năng đó đem sang dự án `B` của bạn.

### 🚫 KHI NÀO KHÔNG DÙNG (`Tránh nhầm với công cụ dịch ngược`):
- **KHÔNG dùng khi bạn CHỈ CÓ file cài đặt đã đóng gói kín** (như file `.exe`, `.dll`, `.apk`, `.ipa`, `.asar` mà không có thư mục code gốc đọc được chữ) ➔ Lúc đó bắt buộc phải dùng máy chủ dịch ngược **`rea` MCP** (`reverse-engineer-anything`) + `ida-pro-mcp` / `ghidra-mcp`.
- **KHÔNG dùng khi bạn chỉ muốn sửa 1 lỗi vặt** trong dự án đang làm dở ➔ Lúc đó dùng `systematic-debugging`.

---

## 3. Quy Trình 4 Bước Clone An Toàn Của AI (`4-Step Zero-Loss Cloning Workflow`)

1. **Bước 1 — Đóng Băng Bản Gốc & Chụp X-Quang Toàn Cục (`Read-Only Scan via Repomix + Code-Graph`):**
   - **Luật bất di bất dịch:** Tuyệt đối **KHÔNG sửa đè trực tiếp vào thư mục source gốc** (giữ bản gốc nguyên vẹn `100%` để luôn có cái đối chiếu). Luôn tạo một thư mục mới riêng biệt cho bản Clone.
   - Gọi MCP **`repomix`** (`pack_codebase` cho thư mục trên máy hoặc `pack_remote_repository` cho link GitHub, bật `compress: true`) kết hợp MCP **`code-graph`** (`project_map`, `module_overview`, `get_call_graph`) để nắm trọn sơ đồ file, cổng API, Database và thư viện phụ thuộc.
2. **Bước 2 — Lập Bảng Kiểm Kê Tính Năng 1-Đổi-1 (`1:1 Feature Parity Checklist`):**
   - Trình bày bảng tóm tắt ngắn gọn bằng Tiếng Việt dễ hiểu cho bạn xem trước: **(1) Danh sách tính năng gốc sẽ giữ nguyên 100%**, **(2) Những chỗ sẽ thay mới theo ý bạn (UI, tên thương hiệu, ngôn ngữ)**, và **(3) Các biến cài đặt cần điền trong `.env`**.
3. **Bước 3 — Thi Công Bản Clone & Tẩy Sạch Dấu Vết Cũ (`Build, Rebrand & Sanitize`):**
   - Phối hợp `code-refactoring-surgeon` + `strict-input-scope-guard` (nếu Fork & Rebrand) hoặc `clean-architecture-enforcer` + `ui-ux-pro-max` (nếu dựng mới).
   - Quét và thay thế đồng bộ tên thương hiệu/link cứng cũ, cất khóa API/mật khẩu sang `.env.example` qua `secret-env-protector` (không bê nhầm key cá nhân của tác giả cũ).
4. **Bước 4 — Chạy Thử & Đối Chứng Với Bản Gốc (`Side-by-Side Verification`):**
   - Cài đặt thư viện chuẩn môi trường riêng, chạy thử bản Clone (`Exit Code: 0`) và tích kiểm từng mục trên **Bảng Kiểm Kê 1-Đổi-1** qua `verification-before-completion` trước khi bàn giao.

---

## 4. Mẫu Triển Khai Chuẩn Thực Chiến (`Production Pattern: Full-Source Blueprint Scanner`)
```python
import pathlib, re
from dataclasses import dataclass

@dataclass(frozen=True)
class CloneBlueprint:
    source_root: str
    detected_stacks: tuple[str, ...]
    code_file_count: int
    env_keys_found: tuple[str, ...]

def scan_full_source_blueprint(source_dir: str) -> CloneBlueprint:
    """Quét nhanh thư mục Full Source Gốc (chế độ Chỉ Đọc) để lập hồ sơ nhân bản 1:1."""
    root = pathlib.Path(source_dir)
    ignore_dirs = {".git", "node_modules", ".venv", "venv", "dist", "build", "__pycache__", ".next"}
    code_exts = {".py", ".ts", ".tsx", ".js", ".jsx", ".vue", ".cs", ".go", ".rs", ".java"}
    stacks: list[str] = []
    if (root / "package.json").exists():
        stacks.append("Node.js / JavaScript / TypeScript")
    if (root / "requirements.txt").exists() or (root / "pyproject.toml").exists():
        stacks.append("Python")
    if any(root.glob("*.sln")) or any(root.glob("*.csproj")):
        stacks.append("C# / .NET")

    code_files = [
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in code_exts and not (set(p.parts) & ignore_dirs)
    ]
    env_keys: set[str] = set()
    for env_sample in (".env.example", ".env.sample", ".env.template"):
        fp = root / env_sample
        if fp.exists():
            for line in fp.read_text(encoding="utf-8", errors="ignore").splitlines():
                m = re.match(r"^\s*([A-Z][A-Z0-9_]+)\s*=", line)
                if m:
                    env_keys.add(m.group(1))

    return CloneBlueprint(
        source_root=str(root.resolve()),
        detected_stacks=tuple(stacks) or ("Generic Source",),
        code_file_count=len(code_files),
        env_keys_found=tuple(sorted(env_keys)),
    )
```

---

## 5. Danh Sách Nghiệm Thu & Kiểm Định Chất Lượng (`Verification Checklist`)
- [x] Thư mục Full Source Gốc được giữ nguyên trạng `100%` (`0 files modified` ở thư mục gốc); toàn bộ mã nhân bản nằm gọn trong thư mục đích mới.
- [x] Đầy đủ `100%` tính năng cốt lõi trong Bảng Kiểm Kê 1-Đổi-1 hoạt động trơn tru trên bản Clone (`Exit Code: 0`, sạch lỗi đỏ Console/Terminal).
- [x] Không còn sót tên thương hiệu cũ ngoài ý muốn, đường dẫn cứng (`hardcoded path`) của máy khác hay khóa bí mật cũ chưa tách ra `.env.example`.

