# Kỹ Thuật Phòng Vệ Đa Tầng (`Defense-in-Depth Validation — version.4.4.0.0`)

## 1. Tổng Quan (`Overview`)
Khi bạn sửa một lỗi do dữ liệu không hợp lệ gây ra, việc chỉ thêm `1 câu lệnh if` kiểm tra tại một chỗ thường tạo cảm giác an tâm giả tạo. Trong thực tế, lớp kiểm tra đơn lẻ đó rất dễ bị vượt qua bởi một nhánh gọi hàm khác, khi tái cấu trúc (`Refactor`), hoặc khi dùng `Mock` trong lúc kiểm thử.

> **Nguyên lý cốt lõi (`Core Principle`):** Kiểm tra tính hợp lệ tại **MỌI TẦNG (`Every Layer`)** mà dữ liệu đi qua. Biến lỗi đó thành **không thể xảy ra về mặt cấu trúc (`Structurally Impossible`)**.

---

## 2. Bốn Lớp Phòng Vệ Bắt Buộc (`The Four Layers`)

### 🛡️ Lớp 1: Kiểm Duyệt Tại Cổng Đầu Vào (`Layer 1: Entry Point Validation`)
- **Mục đích:** Chặn đứng ngay lập tức các dữ liệu đầu vào rỗng, sai kiểu hoặc sai đường dẫn ngay tại biên giới API / Hàm giao tiếp bên ngoài.
```python
import pathlib

def create_project(name: str, working_directory: str) -> pathlib.Path:
    # Chú thích: Kiểm tra chặt chẽ chuỗi rỗng và sự tồn tại của thư mục ngay tại cổng vào
    if not working_directory or not working_directory.strip():
        raise ValueError("Tham số 'working_directory' không được để trống!")
    target_path = pathlib.Path(working_directory).resolve()
    if not target_path.exists():
        raise FileNotFoundError(f"Thư mục làm việc không tồn tại: {target_path}")
    if not target_path.is_dir():
        raise NotADirectoryError(f"Đường dẫn không phải là thư mục hợp lệ: {target_path}")
    return target_path
```

### ⚙️ Lớp 2: Kiểm Duyệt Tại Tầng Nghiệp Vụ (`Layer 2: Business Logic Validation`)
- **Mục đích:** Đảm bảo dữ liệu hợp lý đối với ngữ cảnh nghiệp vụ cụ thể trước khi xử lý sâu.
```python
def initialize_workspace(project_dir: pathlib.Path, session_id: str) -> None:
    # Chú thích: Đảm bảo cả đường dẫn dự án lẫn mã phiên làm việc đều hợp lệ
    if not project_dir or not str(project_dir).strip():
        raise RuntimeError("Bắt buộc phải có 'project_dir' hợp lệ để khởi tạo Workspace!")
    if not session_id or len(session_id.strip()) < 4:
        raise ValueError("Mã phiên 'session_id' không hợp lệ!")
```

### 🔒 Lớp 3: Chốt Chặn An Toàn Theo Môi Trường (`Layer 3: Environment & Hardware Guards`)
- **Mục đích:** Ngăn chặn các thao tác nguy hiểm trong môi trường kiểm thử (`TEST`), bảo vệ thư mục gốc `~\` và bảo vệ phần cứng máy trạm (`GTX 1660 Ti 6GB VRAM` / `64GB RAM`).
```python
import os, tempfile

def safe_git_init(directory: pathlib.Path) -> None:
    # Chú thích: Khi đang chạy kiểm thử (ENV=test), nghiêm cấm chạy git init ngoài thư mục tạm (Temp)
    if os.environ.get("APP_ENV") == "test":
        norm_dir = str(directory.resolve()).lower()
        norm_tmp = str(pathlib.Path(tempfile.gettempdir()).resolve()).lower()
        if not norm_dir.startswith(norm_tmp):
            raise PermissionError(
                f"[CHỐT CHẶN AN TOÀN] Từ chối khởi tạo git ngoài thư mục Temp khi đang test: {directory}"
            )
```

### 📡 Lớp 4: Ghi Nhận Nhật Ký Pháp Y (`Layer 4: Debug & Forensic Instrumentation`)
- **Mục đích:** Lưu lại ngữ cảnh đầy đủ (`Thư mục hiện tại`, `Tham số`, `Stack Trace`) để nếu có bất kỳ sự cố bất thường nào cũng xác định được vị trí trong tích tắc.
```python
import logging, traceback

logger = logging.getLogger("defense_in_depth")

def audit_operation(action_name: str, target: str) -> None:
    # Chú thích: Ghi nhật ký truy vết kèm ngăn xếp lời gọi hàm trước khi thực thi lệnh nhạy cảm
    logger.debug(
        "Thực thi [%s] trên đích [%s] | CWD=%s | Stack=%s",
        action_name, target, os.getcwd(), "".join(traceback.format_stack(limit=4))
    )
```

---

## 3. Quy Trình Áp Dụng Khi Vá Lỗi (`Applying the Pattern`)
1. **Truy vết luồng dữ liệu (`Trace data flow`):** Xác định nơi giá trị lỗi bắt đầu và nơi nó đi qua.
2. **Lập bản đồ các trạm kiểm soát (`Map all checkpoints`):** Liệt kê mọi hàm trung gian trên đường đi của dữ liệu.
3. **Gia cố cả 4 lớp (`Add validation at each layer`):** Đầu vào ➔ Nghiệp vụ ➔ Môi trường ➔ Nhật ký.
4. **Kiểm thử từng lớp (`Test each layer`):** Thử truyền dữ liệu xấu vào từng tầng để xác nhận chốt chặn hoạt động độc lập 100%.
