---
name: database-migration-manager
description: >-
  [Quản Gia Nâng Cấp Bảng Dữ Liệu An Toàn Không Mất Dữ Liệu Cũ (Migration)] — Tác dụng: Giúp thêm bảng mới, thêm cột mới hoặc sửa cấu trúc Database đang hoạt động một cách êm ái, có sẵn phương án quay lui (Rollback) và giữ nguyên 100% dữ liệu đang có — Kích hoạt: Khi cập nhật, thêm cột hoặc thay đổi cấu trúc bảng Cơ sở dữ liệu.
---

# KỸ NĂNG CHUYÊN SÂU: `DATABASE-MIGRATION-MANAGER` (NHÓM 3: DATABASE, ORM & DATA ENGINEERING — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `database-migration-manager`
- **Vai trò:** Kỹ sư Quản lý Tiến hóa Lược đồ CSDL Không Gián đoạn (`Zero-Downtime Schema Migration Specialist`)
- **Trọng tâm nhiệm vụ:** Thiết kế và thực thi các bản nâng cấp cấu trúc bảng (`Alembic`, `Prisma Migrate`, `Drizzle Kit`, `Flyway`) theo chiến lược `Expand-and-Contract` có đầy đủ chiều nâng cấp (`upgrade`) và chiều hoàn tác (`downgrade`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Không bao giờ đổi tên cột hoặc xóa cột trực tiếp trong 1 bước trên hệ thống đang chạy; phải qua 3 pha: `(1) Thêm cột mới cho phép NULL` ➔ `(2) Chép dữ liệu cũ sang (Backfill)` ➔ `(3) Áp ràng buộc NOT NULL & xóa cột cũ ở phiên bản sau`.
2. Trên PostgreSQL, khi đánh chỉ mục cho bảng lớn đang hoạt động, bắt buộc dùng `CREATE INDEX CONCURRENTLY` để không khóa bảng (`Table Lock`).
3. Mọi file Migration đã chạy xong tuyệt đối không được sửa đổi lại lịch sử; nếu cần điều chỉnh phải tạo file Migration mới tiếp theo.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```sql
-- Mẫu Migration an toàn (Idempotent & Zero-Lock) trên PostgreSQL
BEGIN;

-- 1. Thêm cột mới an toàn kèm giá trị mặc định, không làm mất dữ liệu cũ
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_tier VARCHAR(20) NOT NULL DEFAULT 'FREE';

-- 2. Thêm ràng buộc kiểm tra ở chế độ NOT VALID trước để không khóa toàn bảng
ALTER TABLE users
ADD CONSTRAINT chk_users_account_tier
CHECK (account_tier IN ('FREE', 'PRO', 'ENTERPRISE')) NOT VALID;

-- 3. Xác thực ràng buộc nhẹ nhàng
ALTER TABLE users VALIDATE CONSTRAINT chk_users_account_tier;

COMMIT;
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Kiểm thử chạy `upgrade` ➔ `downgrade` ➔ `upgrade` liên tiếp thành công 100% mà không lỗi.
- [x] Không có bất kỳ dữ liệu hiện có nào trong bảng bị mất hoặc bị gán sai giá trị mặc định sau khi chạy Migration.
- [x] Thời gian khóa bảng (`Lock Timeout`) được giới hạn dưới `3 giây`.
