---
name: verification-before-completion
description: >-
  [Trạm Kiểm Chứng Thực Tế & Soát Lỗi Trước Khi Báo Xong] — Tác dụng: Bắt buộc AI phải chạy thử code thực tế (Exit Code 0) và kiểm tra lại từng dòng vừa sửa (git_diff) xem có làm hỏng code cũ không rồi mới được báo cáo hoàn thành — Kích hoạt: Luôn chạy ở bước cuối cùng trước khi bàn giao kết quả.
---

# KỸ NĂNG CHUYÊN SÂU: `VERIFICATION-BEFORE-COMPLETION` (`OBRA/SUPERPOWERS` VERIFICATION GATE — `version.4.5.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `verification-before-completion` (Chuẩn `Obra Superpowers` tối ưu hóa cho máy trạm Antidv Windows 10/11)
- **Vai trò:** Cổng Kiểm Định Bằng Chứng Sống & Chống Báo Cáo Ảo (`Mandatory Pre-Completion Verification & Diff Audit Gate`)
- **Nguyên lý cốt lõi (`The Iron Law`):** **TUYỆT ĐỐI CẤM tuyên bố "Đã hoàn thành / Đã sửa xong / Chạy thành công" khi chưa chạy lệnh kiểm chứng thực tế ngay trong bước hiện tại và đọc kết quả đầu ra.**

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║  LUẬT THÉP NGHIỆM THU (THE VERIFICATION IRON LAW):                           ║
║  KHÔNG BÁO CÁO HOÀN THÀNH NẾU CHƯA CÓ BẰNG CHỨNG KIỂM THỬ THỰC TẾ MỚI NHẤT!  ║
║  (NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE)                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Quy Trình Cổng Kiểm Chứng 5 Bước Bắt Buộc (`The 5-Step Gate Function`)

**TRƯỚC KHI** viết bất kỳ câu khẳng định hoàn thành nào (như *"Đã sửa xong lỗi"*, *"Code chạy mượt mà"*, *"Đã nâng cấp thành công"*), Agent **BẮT BUỘC** thực hiện tuần tự 5 bước:

1. **BƯỚC 1 — Xác Định Lệnh Kiểm Chứng (`IDENTIFY`):**
   - Lệnh hoặc công cụ MCP nào chứng minh được yêu cầu trong Prompt đã hoàn thành?
   - *Backend / Logic:* `pytest`, `python -m unittest`, `vitest`, hoặc gọi trực tiếp hàm/API kiểm tra.
   - *Giao diện Web:* `chrome-devtools-mcp` (`list_console_messages`, `take_snapshot`) hoặc `browsentic` (`page_readConsole`).
   - *Ứng dụng Desktop / Windows:* `windows-mcp` (`Snapshot`, `Screenshot`, `Process`).
   - *Cơ sở dữ liệu:* `postgres-mcp` (`postgres_mcp_query`) hoặc `sqlite` (`read_query`).
2. **BƯỚC 2 — Thực Thi Trực Tiếp & Trọn Vẹn (`RUN`):**
   - Chạy lệnh kiểm chứng **mới nhất** ngay sau lần sửa code cuối cùng (không dùng lại kết quả cũ từ các bước trước).
3. **BƯỚC 3 — Đọc Toàn Bộ Đầu Ra & Mã Thoát (`READ`):**
   - Kiểm tra `exit_code == 0`, đếm số bài test `PASSED` / `FAILED` và đọc kỹ mọi dòng cảnh báo (`Warnings`).
4. **BƯỚC 4 — Kiểm Toán `git_diff` Cùng `strict-input-scope-guard` (`AUDIT DIFF`):**
   - Kiểm tra thay đổi mã nguồn (`git_diff` hoặc đọc lại vùng file vừa sửa) để chắc chắn `100%`:
     - Không có dòng code, hàm hay comment nào ngoài yêu cầu bị xóa nhầm.
     - Không để sót lệnh in nháp (`print("debug")`, `console.log("test")`) hay tệp tạm không cần thiết.
5. **BƯỚC 5 — Báo Cáo Kèm Bằng Chứng (`CLAIM WITH EVIDENCE`):**
   - Chỉ khi Bước 3 và Bước 4 đạt `PASS 100%`, mới được phép báo cáo hoàn thành kèm trích dẫn kết quả chạy thực tế.

---

## 3. Bảng Cờ Đỏ Chống Báo Cáo Ảo (`Red Flags — Stop Immediately`)

| Câu Nói / Suy Nghĩ Cấm Kỵ (`Forbidden Assumption`) | Thực Tế Phải Làm (`Mandatory Verification`) |
| :--- | :--- |
| *"Code này nhìn chuẩn rồi, chắc chắn chạy được"* | **CẤM ĐOÁN!** Phải chạy lệnh thực thi thực tế và kiểm tra `Exit Code: 0`. |
| *"Lần chạy trước đã PASS, giờ mới sửa nhẹ 1 dòng không cần chạy lại"* | **CẤM BỎ QUA!** Sửa dù chỉ 1 ký tự cũng bắt buộc chạy lại lệnh kiểm chứng mới nhất. |
| *"Bài test chạy lỗi do môi trường chứ code mình sửa đúng rồi"* | **CẤM ĐỔ LỖI!** Phải kiểm tra đúng môi trường ảo (`managing-python-dependencies`) và chạy tới khi `PASS 100%`. |

---

## 4. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern: Automated Verification Gate`)
```python
import subprocess
from dataclasses import dataclass

@dataclass
class VerificationEvidence:
    command: str
    exit_code: int
    stdout: str
    stderr: str
    passed: bool

def run_verification_gate(command: list[str], timeout_sec: int = 30) -> VerificationEvidence:
    """Chạy lệnh kiểm chứng thực tế và trả về bằng chứng sống trước khi nghiệm thu."""
    proc = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout_sec,
    )
    is_pass = proc.returncode == 0 and "FAILED" not in proc.stdout
    return VerificationEvidence(
        command=" ".join(command),
        exit_code=proc.returncode,
        stdout=proc.stdout.strip(),
        stderr=proc.stderr.strip(),
        passed=is_pass,
    )
```

---

## 5. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Mọi thay đổi mã nguồn đều có bằng chứng chạy thử thực tế (`Exit Code: 0`, `0 Failed`, `0 Console Errors`).
- [x] Kiểm toán `git_diff` xác nhận không làm hỏng bất kỳ chức năng cũ nào (`Zero Regression`) và tuân thủ tuyệt đối phạm vi Prompt Input.

