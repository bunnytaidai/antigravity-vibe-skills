---
name: repomix
description: >-
  [Chuyên Gia Đóng Gói & Phân Tích Mã Nguồn Toàn Cục Cho AI (Repomix MCP Server & CLI — yamadashy)] — Tác dụng: Đóng gói toàn bộ dự án trên máy hoặc kho mã nguồn GitHub từ xa thành một tệp XML/Markdown/JSON chuẩn AI, thống kê số lượng Token từng thư mục, nén cấu trúc code bằng Tree-sitter (tiết kiệm ~70% Token), tự động quét chặn lộ khóa bí mật (Secretlint) và tìm kiếm mẫu code siêu tốc — Kích hoạt: Khi cần phân tích tổng thể cấu trúc dự án mới/lớn, khám phá repo GitHub từ xa, kiểm tra ngân sách Token hoặc đóng gói mã nguồn chuẩn AI (/repomix).
---

# KỸ NĂNG CHUYÊN SÂU: `REPOMIX` (YAMADASHY REPOMIX MCP SERVER & CODEBASE PACKAGER — `version.4.6.0.1`)

## 1. Kiến trúc & Mục tiêu Cốt lõi (`Architecture & Core Purpose`)
- **Tên định danh (`Identifier`):** `repomix` *(Tác giả gốc: `yamadashy` — Nguồn: `https://agenticskills.io/mcp/repomix` & `github.com/yamadashy/repomix`, phiên bản `v1.18.1`)*
- **Vai trò:** Chuyên gia Đóng gói, Nén Cấu trúc AST & Khám phá Kho Mã nguồn cho AI (`AI-Friendly Codebase Packager, Tree-sitter Compressor & Remote Repository Explorer`)
- **Trọng tâm nhiệm vụ:** Hợp nhất toàn bộ tệp tin của dự án cục bộ (`Local Directory`) hoặc kho lưu trữ từ xa (`Remote GitHub Repository`) thành một tài liệu có cấu trúc (`XML`, `Markdown`, `JSON`, `Plain Text`) kèm cây thư mục, thống kê `Token` và bộ lọc bảo mật `Secretlint`, giúp Agent nắm bắt kiến trúc tổng thể mà không làm tràn cửa sổ ngữ cảnh (`Context Window`).

---

## 2. Bối Cảnh Sử Dụng Cá Nhân Hóa (`Personalized Usage Contexts — Khi Nào Dùng & Không Dùng`)

### ✅ Bối cảnh BẮT BUỘC Kích Hoạt (`Trigger Contexts`):
1. **Khám phá Kho mã nguồn từ xa (`Remote GitHub Exploration`):** Khi bạn đưa link GitHub hoặc tên `owner/repo` (ví dụ: `"Phân tích repo yamadashy/repomix"`, `"Xem kiến trúc của facebook/react"`, `"Tìm cách họ viết tweak trong repo X"`) mà không muốn clone thủ công làm rác ổ cứng.
2. **Đánh giá Tổng thể Dự án Lớn / Mới (`High-Level Codebase Audit`):** Khi bắt đầu tiếp nhận một dự án lớn, cần nhìn toàn cảnh cây thư mục (`Directory Structure`), phân bổ `Token` (`--token-count-tree`) và tìm các tệp nặng nhất (`Top Files`).
3. **Truy tìm Mẫu Code Diện Rộng (`Cross-Repo Pattern Discovery`):** Khi cần gom và lọc nhanh toàn bộ điểm định nghĩa `API Endpoints`, `Authentication`, `Database Models`, hoặc `Hook Objective-C (%hook)` trên hàng trăm file qua `grep_repomix_output`.
4. **Đóng gói Mã nguồn & Xuất Kỹ năng Tham chiếu (`AI Context Packaging & Skill Generation`):** Khi cần nén dự án bằng `Tree-sitter` (`--compress` giảm `~70%` dung lượng token) để nạp vào LLM nội bộ (`Ollama GTX 1660 Ti 6GB`) hoặc tạo gói kỹ năng tham chiếu tự động (`generate_skill`).

### 🚫 Bối cảnh KHÔNG Kích Hoạt (`Do Not Trigger — Tránh Lãng Phí Token`):
- **KHÔNG dùng** khi chỉ cần đọc/sửa 1–2 file cụ thể đã biết rõ đường dẫn trong dự án hiện tại (ưu tiên dùng trực tiếp `read_file`, `edit_file` hoặc `code-graph`).
- **KHÔNG dùng** để thay thế các thao tác chạy lệnh `git commit`, chạy bài test (`pytest`/`vitest`) hoặc biên dịch phần mềm.

---

## 3. Hệ Thống Công Cụ `Repomix MCP Server` & Lệnh CLI Chủ Lực (`MCP Tools & CLI Reference`)

| Tên Công Cụ MCP (`MCP Tool`) | Tác Dụng Tiếng Việt (`Vietnamese Purpose`) | Cách Dùng & Tham Số Chính (`Usage & Key Parameters`) |
| :--- | :--- | :--- |
| **`pack_codebase`** | Đóng gói thư mục dự án trên máy thành tệp phân tích chuẩn AI kèm thống kê Token. | Truyền `directory` (đường dẫn tuyệt đối), `style` (`"xml"`, `"markdown"`, `"json"`), `compress` (`true`/`false`), `includePatterns`, `ignorePatterns`. |
| **`pack_remote_repository`** | Tải ngầm và đóng gói trực tiếp kho GitHub từ xa (an toàn trong thư mục tạm). | Truyền `remote` (`"owner/repo"` hoặc URL nhánh/commit), `compress` (`true` cho repo `>100k` dòng), `includePatterns`. |
| **`grep_repomix_output`** | Tìm kiếm chính quy (`JavaScript RegExp`) siêu tốc trong gói đầu ra đã đóng gói. | Truyền `outputId` (mã trả về sau khi pack), `pattern` (mẫu tìm kiếm), `contextLines` (số dòng ngữ cảnh), `ignoreCase`. |
| **`read_repomix_output`** | Đọc từng phân đoạn theo số dòng (`startLine` ➔ `endLine`) của tệp Repomix lớn. | Truyền `outputId`, `startLine`, `endLine` để đọc cuốn chiếu không gây tràn bộ nhớ ngữ cảnh. |
| **`attach_packed_output`** | Gắn tệp `repomix-output.xml` có sẵn trên ổ cứng vào phiên làm việc MCP. | Truyền `path` tới thư mục hoặc tệp `.xml`/`.md`/`.json` đã đóng gói trước đó để phân tích lại tức thì. |
| **`generate_skill`** | Tự động sinh bộ kỹ năng tham chiếu (`SKILL.md` + `references/`) từ mã nguồn dự án. | Truyền `directory`, `skillName` (`kebab-case`) để biến một codebase mẫu thành tài liệu tra cứu cho AI. |

### Lệnh Terminal (`CLI`) Cá Nhân Hóa Cho Máy Trạm Windows:
- **Đóng gói nhanh thư mục hiện tại:** `repomix` *(tự động nhận cấu hình cá nhân hóa tại `%LOCALAPPDATA%\Repomix\repomix.config.json`)*.
- **Xem cây phân bổ Token (`Token Count Tree`):** `repomix --token-count-tree 500` *(chỉ hiện các file tiêu tốn từ `500 tokens` trở lên)*.
- **Đóng gói nén cấu trúc AST (`Tree-sitter Compression`):** `repomix --compress --include "src/**/*.ts,**/*.py"`.
- **Phân tích kho GitHub từ xa ra thư mục tạm:** `repomix --remote <owner/repo> --compress -o $env:TEMP\repomix-remote.xml`.

---

## 4. Quy Tắc Thực Thi & Cấu Hình Cá Nhân Hóa Cho Thỏ / Antidv (`Mandatory Rules`)
1. **Bảo vệ thư mục dự án (`Zero Workspace Pollution`):** Khi phân tích repo từ xa qua CLI, luôn xuất file ra `$env:TEMP\<repo>-analysis.xml` (hoặc dùng tool MCP `pack_remote_repository` tự lưu vào vùng tạm), tuyệt đối không xả file rác vào dự án đang mở.
2. **Chiến lược Đọc Cuốn Chiếu (`Grep-First, Read-Later`):** Sau khi gọi `pack_codebase` hoặc `pack_remote_repository` nhận được `outputId`, **BẮT BUỘC** dùng `grep_repomix_output` lọc đúng vị trí dòng rồi mới gọi `read_repomix_output(startLine, endLine)`, cấm đọc tràn lan toàn bộ file lớn.
3. **Tự động Lọc File Rác & Bảo mật (`Auto-Ignore & Secretlint`):** Cấu hình toàn cục tại [`~\AppData\Local\Repomix\repomix.config.json`](file:///C:/Users/Antidv/AppData/Local/Repomix/repomix.config.json) đã được cá nhân hóa để luôn bật `Secretlint` (chặn lộ `.env`, `API Key`, `id_iphone_usb`), đánh số dòng (`showLineNumbers: true`), cắt gọn chuỗi ảnh `base64` (`truncateBase64: true`) và tự động loại bỏ các tệp nhị phân/môi trường ảo (`.venv`, `node_modules`, `.theos`, `*.deb`, `*.dylib`, `*.idb`, `*.i64`, `*.sqlite`).

---

## 5. Mẫu Triển Khai Chuẩn Thực Chiến (`Production Pattern: Repomix CLI & Config Wrapper`)
```python
import json, pathlib, subprocess, tempfile

def run_personalized_repomix_pack(
    target: str,
    is_remote: bool = False,
    compress: bool = True,
    include_glob: str | None = None,
) -> dict[str, object]:
    """Đóng gói mã nguồn cục bộ hoặc GitHub từ xa bằng Repomix với cấu hình cá nhân hóa."""
    out_file = pathlib.Path(tempfile.gettempdir()) / "antidv-repomix-pack.xml"
    cmd = ["repomix", "--style", "xml", "-o", str(out_file)]
    if is_remote:
        cmd.extend(["--remote", target])
    else:
        cmd.append(target)
    if compress:
        cmd.append("--compress")
    if include_glob:
        cmd.extend(["--include", include_glob])

    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
    return {
        "exit_code": proc.returncode,
        "output_path": str(out_file),
        "exists": out_file.exists(),
        "size_bytes": out_file.stat().st_size if out_file.exists() else 0,
        "stdout_summary": proc.stdout[-600:].strip(),
    }
```

---

## 6. Danh Sách Nghiệm Thu & Kiểm Định Chất Lượng (`Verification Checklist`)
- [x] Khối `YAML Frontmatter` có `name: repomix` khớp `100%` với thư mục `~/.gemini\config\skills\repomix` và chú thích tiếng Việt đầy đủ tác dụng + bối cảnh kích hoạt.
- [x] Máy chủ `repomix` MCP được đồng bộ kép trong `mcp_config.json` kèm trọn bộ Schema JSON tại `~/.gemini\antigravity\mcp\repomix\`.
- [x] Tệp cấu hình cá nhân hóa toàn cục `~\AppData\Local\Repomix\repomix.config.json` hoạt động chuẩn xác (`Exit Code: 0`).

