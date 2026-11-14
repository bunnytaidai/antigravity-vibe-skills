---
name: backend-concurrency-transaction-guard
description: >-
  [Vệ Sĩ Chống Trùng Giao Dịch, Chống Lỗi Bấm Đúp & Bảo Toàn Dữ Liệu Đa Luồng] — Tác dụng: Chặn đứng lỗi người dùng bấm nút 2 lần bị trừ tiền/tạo đơn 2 lần (Idempotency Key), chống lỗi nhiều người mua cùng lúc làm âm kho (Race Condition) và tự động hoàn tác (Rollback) nếu lỗi giữa chừng — Kích hoạt: Khi viết chức năng thanh toán, đặt hàng, trừ số dư, cập nhật trạng thái hoặc chạy đa luồng.
---

# KỸ NĂNG CHUYÊN SÂU: `BACKEND-CONCURRENCY-TRANSACTION-GUARD` (NHÓM 2: HIGH-RELIABILITY BACKEND & DATA INTEGRITY — `version.4.5.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `backend-concurrency-transaction-guard`
- **Vai trò:** Kiến trúc sư Bảo Toàn Giao Dịch, Chống Trùng Lặp & Kiểm Soát Đa Luồng Backend (`High-Concurrency, Idempotency & ACID Transaction Architect`)
- **Trọng tâm nhiệm vụ:** Ngăn chặn 4 lỗi nghiêm trọng nhất của hệ thống Backend thực chiến trên máy trạm đa luồng (`Xeon 12 nhân 24 luồng / 64GB RAM`):
  1. **Lỗi Gửi Trùng Yêu Cầu (`Double Submit / Duplicate Request`):** Người dùng bấm nút 2 lần hoặc mạng tự động gửi lại (`Retry`) khiến hệ thống trừ tiền/tạo đơn 2 lần.
  2. **Lỗi Xung Đột Đa Luồng (`Race Condition / Lost Update`):** Hai luồng đọc cùng một giá trị rồi ghi đè lên nhau làm sai lệch số lượng tồn kho, bộ đếm hoặc số dư.
  3. **Lỗi Ghi Dữ Liệu Nửa Chừng (`Partial Write / Dirty State`):** Bước 1 ghi vào bảng `A` thành công nhưng Bước 2 ghi vào bảng `B` bị lỗi mà không hoàn tác (`Rollback`), làm hỏng tính nhất quán dữ liệu.
  4. **Lỗi Treo Kết Nối Dây Chuyền (`Cascading Timeout / Resource Exhaustion`):** Gọi API bên thứ 3 không đặt `timeout` khiến toàn bộ luồng Backend bị treo cứng.

---

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. **Bắt buộc có Khóa Chống Trùng Lặp (`Idempotency-Key`) cho mọi API làm thay đổi trạng thái quan trọng (`POST / PATCH`):**
   - Kiểm tra khóa `Idempotency-Key` (hoặc cặp `(user_id, client_request_id)`) trước khi thực thi; nếu khóa đang xử lý thì trả về `409 Conflict`, nếu đã xử lý xong thì trả lại ngay kết quả cũ mà không chạy lại logic.
2. **Chống `Race Condition` bằng Khóa Dòng hoặc Cập Nhật Nguyên Tử (`Row Locking & Atomic Update`):**
   - Tuyệt đối **CẤM** viết theo kiểu đọc vào biến Python/JS rồi cộng trừ (`val = db.get(); db.set(val - 1)`).
   - **BẮT BUỘC** dùng câu lệnh cập nhật nguyên tử có điều kiện (`UPDATE ... SET balance = balance - :amt WHERE id = :id AND balance >= :amt`) hoặc khóa dòng bi quan (`SELECT ... FOR UPDATE`) / khóa lạc quan (`version = version + 1`) bên trong giao dịch.
3. **Giao dịch Nguyên tử (`ACID Atomic Transaction Context`):**
   - Mọi thao tác ghi liên quan đến từ 2 bảng trở lên bắt buộc đặt trong khối `with transaction.atomic():` (hoặc `async with session.begin():` / `BEGIN ... COMMIT/ROLLBACK`). Nếu bất kỳ bước nào lỗi, toàn bộ thay đổi phải tự động `ROLLBACK 100%`.
4. **Luôn gắn `Timeout` rõ ràng cho mọi lời gọi mạng/DB:** Không bao giờ gọi `httpx` / `fetch` / `subprocess` hoặc câu lệnh SQL mà bỏ trống giới hạn thời gian chờ (`timeout`).

---

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern: Atomic & Idempotent Transaction Engine`)
```python
import sqlite3
import threading
from contextlib import contextmanager
from typing import Any

class ConcurrencySafeWalletService:
    """Mẫu Backend chống Race Condition và chống trùng lặp giao dịch (Idempotent + ACID)."""

    def __init__(self, db_path: str = ":memory:") -> None:
        self._lock = threading.RLock()
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._init_schema()

    def _init_schema(self) -> None:
        with self.conn:
            self.conn.execute(
                "CREATE TABLE IF NOT EXISTS accounts (account_id TEXT PRIMARY KEY, balance INTEGER NOT NULL CHECK(balance >= 0), version INTEGER NOT NULL DEFAULT 1)"
            )
            self.conn.execute(
                "CREATE TABLE IF NOT EXISTS idempotency_records (idem_key TEXT PRIMARY KEY, status_code INTEGER NOT NULL, response_json TEXT NOT NULL)"
            )

    @contextmanager
    def atomic_transaction(self):
        with self._lock:
            try:
                self.conn.execute("BEGIN IMMEDIATE")
                yield self.conn
                self.conn.commit()
            except Exception:
                self.conn.rollback()
                raise

    def transfer_atomic_idempotent(
        self, idem_key: str, from_acc: str, to_acc: str, amount: int
    ) -> dict[str, Any]:
        if amount <= 0:
            raise ValueError("Số tiền giao dịch phải lớn hơn 0")

        with self.atomic_transaction() as tx:
            # 1. Kiểm tra Idempotency-Key chống bấm đúp 2 lần
            existing = tx.execute(
                "SELECT response_json FROM idempotency_records WHERE idem_key = ?", (idem_key,)
            ).fetchone()
            if existing:
                return {"idempotent_replay": True, "result": existing[0]}

            # 2. Cập nhật nguyên tử có kiểm tra điều kiện số dư (Chống Race Condition 100%)
            cur = tx.execute(
                "UPDATE accounts SET balance = balance - ?, version = version + 1 WHERE account_id = ? AND balance >= ?",
                (amount, from_acc, amount),
            )
            if cur.rowcount == 0:
                raise RuntimeError("Số dư không đủ hoặc tài khoản nguồn không tồn tại")

            tx.execute(
                "UPDATE accounts SET balance = balance + ?, version = version + 1 WHERE account_id = ?",
                (amount, to_acc),
            )

            # 3. Lưu khóa Idempotency trong cùng 1 giao dịch ACID
            summary = f"Moved {amount} from {from_acc} to {to_acc}"
            tx.execute(
                "INSERT INTO idempotency_records (idem_key, status_code, response_json) VALUES (?, 200, ?)",
                (idem_key, summary),
            )
            return {"idempotent_replay": False, "result": summary}
```

---

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Gửi lặp lại cùng một `Idempotency-Key` 10 lần liên tiếp chỉ làm thay đổi dữ liệu đúng **1 lần duy nhất**.
- [x] Chạy `24 luồng song song` (bằng `load-stress-tester`) cùng trừ số dư/tồn kho không bao giờ xảy ra hiện tượng âm kho hoặc mất cập nhật (`Zero Race Condition`).
- [x] Khi giả lập lỗi ở bước giữa giao dịch, toàn bộ dữ liệu tự động hoàn tác về trạng thái ban đầu (`100% Atomic Rollback`).

