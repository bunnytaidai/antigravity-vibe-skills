---
name: desktop-gui-builder
description: >-
  [Kỹ Sư Chế Tạo Phần Mềm Cửa Sổ Trên Máy Tính Windows (PyQt6 / Tkinter / Electron)] — Tác dụng: Xây dựng phần mềm Desktop có giao diện cửa sổ, nút bấm, thanh tiến trình chạy mượt trên Windows 10/11, tách luồng xử lý ngầm để cửa sổ không bao giờ bị đơ (Not Responding) — Kích hoạt: Khi viết phần mềm/công cụ chạy trực tiếp trên màn hình Windows.
---

# KỸ NĂNG CHUYÊN SÂU: `DESKTOP-GUI-BUILDER` (NHÓM 1: FRONTEND, WEB & APP UI/UX — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `desktop-gui-builder`
- **Vai trò:** Kỹ sư Phần mềm Máy tính Desktop Windows (`PyQt6 / Tkinter / Electron GUI Architect`)
- **Trọng tâm nhiệm vụ:** Thiết kế ứng dụng cửa sổ chạy trực tiếp trên Windows 10/11 với cơ chế tách luồng giao diện (`UI Thread`) khỏi luồng tác vụ nặng (`Worker QThread`) chống treo cửa sổ (`Not Responding`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Bật nhận diện độ phân giải cao (`High-DPI Scaling`) trên Windows 10/11 để chữ tiếng Việt không bị nhòe.
2. Tuyệt đối không chạy `time.sleep()`, gọi API hay đọc file lớn trực tiếp trên `Main UI Thread`; bắt buộc dùng `QThread` hoặc `asyncio`.
3. Tạo kèm tệp `Launcher.bat` khởi chạy ngầm sạch sẽ và xử lý sự kiện đóng cửa sổ (`closeEvent`) an toàn.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
from PyQt6.QtCore import QThread, pyqtSignal
from PyQt6.QtWidgets import QMainWindow, QPushButton, QVBoxLayout, QWidget, QLabel

class BackgroundWorker(QThread):
    finished_signal = pyqtSignal(str)
    def run(self) -> None:
        # Xử lý tác vụ nặng ở luồng riêng, giữ giao diện Windows mượt 60fps
        self.finished_signal.emit("Hoàn tất xử lý ngầm an toàn!")

class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Ứng dụng Desktop Chuẩn Windows 10 — version.3.6.0.0")
        self.status_lbl = QLabel("Sẵn sàng")
        self.btn = QPushButton("Chạy tác vụ")
        self.btn.clicked.connect(self.start_task)
        layout = QVBoxLayout()
        layout.addWidget(self.status_lbl)
        layout.addWidget(self.btn)
        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

    def start_task(self) -> None:
        self.btn.setEnabled(False)
        self.worker = BackgroundWorker()
        self.worker.finished_signal.connect(lambda msg: (self.status_lbl.setText(msg), self.btn.setEnabled(True)))
        self.worker.start()
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Cửa sổ phần mềm kéo thả, thu phóng mượt mà, không bao giờ hiện `(Not Responding)` khi đang xử lý.
- [x] Hiển thị phông chữ `Segoe UI` tiếng Việt sắc nét ở cả mức DPI `100%`, `125%` và `150%`.
- [x] Khi bấm nút `X` thoát phần mềm, toàn bộ luồng `Worker` ngầm đều được giải phóng sạch sẽ.
