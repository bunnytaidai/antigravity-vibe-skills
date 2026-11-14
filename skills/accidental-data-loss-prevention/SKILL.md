---
name: accidental-data-loss-prevention
description: >-
  [Chốt Chặn Bảo Vệ Dữ Liệu - Cấm Tự Ý Xóa Khi Chưa Xin Phép] — Tác dụng: Tự động phanh gấp và hỏi ý kiến xác nhận của bạn trước mọi lệnh có nguy cơ xóa bảng dữ liệu (DROP/TRUNCATE/DELETE), xóa file hoặc ghi đè tài nguyên quan trọng — Kích hoạt: Luôn tự động bật trước mọi thao tác xóa hoặc thay đổi nhạy cảm.
license: Apache-2.0
metadata:
  version: v1
  publisher: google
---

# Accidental Data Loss Prevention (`Chốt Chặn Chống Mất Dữ Liệu`)

> [!IMPORTANT]
> **📌 Chú thích Tiếng Việt cho Newbie:**
> - **Luật bất di bất dịch:** Trước mọi thao tác có nguy cơ làm mất dữ liệu không thể khôi phục (như `DROP TABLE`, `TRUNCATE`, `DELETE` diện rộng, xóa thư mục/file, ghi đè kho code hoặc `git reset --hard`), AI **BẮT BUỘC dừng lại hỏi ý kiến bạn** và chỉ thực hiện khi bạn gật đầu đồng ý rõ ràng.

> [!CAUTION]
>
> **STOP AND VERIFY**: Before running any command or tool that results in
> irreversible data loss, you **MUST** obtain explicit user consent.

## Mandatory Procedure

1.  **Halt Execution**: Do **not** execute the command.
2.  **Request Consent**: Explain clearly to the user:
    -   The **impact** of this deletion.
    -   **Why** you believe this is necessary.
    -   A request for their **explicit approval** to proceed.
3.  **Wait**: Only proceed if the user provides clear, affirmative consent in
    the conversation.
