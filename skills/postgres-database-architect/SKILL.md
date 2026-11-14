---
name: postgres-database-architect
description: >-
  [Kiến Trúc Sư Thiết Kế & Tối Ưu Cơ Sở Dữ Liệu PostgreSQL (Supabase Official — 485K+ Installs)] — Tác dụng: Thiết kế bảng chuẩn hóa 3NF, chọn kiểu dữ liệu chính xác (TIMESTAMPTZ, NUMERIC, BIGINT), đánh chỉ mục (B-Tree, GIN, Partial Index), phân quyền dòng (RLS), quản lý kết nối và chống khóa bảng theo bộ chuẩn chính chủ Supabase — Kích hoạt: Khi tạo/sửa bảng, viết Migration, tối ưu câu lệnh SQL hoặc cấu hình PostgreSQL / SQLite.
---

# KỸ NĂNG CHUYÊN SÂU: `POSTGRES-DATABASE-ARCHITECT` (HỢP NHẤT `SUPABASE-POSTGRES-BEST-PRACTICES` + `POSTGRES-MCP` ANTIDV — `version.5.3.0.0`)

> [!NOTE]
> **📌 Chú thích Tiếng Việt cho Newbie:**
> - **Tác dụng:** Kết hợp quy trình kiểm tra thực tế qua công cụ `postgres-mcp` + `accidental-data-loss-prevention` trên máy Antidv với **trọn bộ cẩm nang 8 nhóm tối ưu PostgreSQL chính chủ từ đội ngũ Supabase** (`485.9K+` lượt cài trên `skills.sh`, lưu đầy đủ trong thư mục `./references/`).

---

## 1. Quy Tắc Bắt Buộc & 8 Nhóm Trọng Tâm Theo Độ Ưu Tiên (`Mandatory Rules & Supabase 8 Categories`)

1. **Khảo sát thực tế & Bảo vệ dữ liệu tuyệt đối:** Luôn đọc cấu trúc bảng thực tế bằng `postgres-mcp` (`postgres_mcp_db_context`) trước khi viết truy vấn; kích hoạt `accidental-data-loss-prevention` xin phép người dùng trước mọi lệnh `DROP`, `TRUNCATE`, `DELETE`.
2. **Chuẩn Kiểu Dữ Liệu Cấm Sai Số:**
   - **Tiền tệ / Số dư:** Tuyệt đối cấm `FLOAT`/`REAL` *(gây sai số lẻ)*; bắt buộc dùng `NUMERIC(18, 2)` hoặc `BIGINT` *(đơn vị nhỏ nhất)*.
   - **Thời gian:** Luôn dùng `TIMESTAMPTZ` *(có múi giờ chuẩn UTC)* thay vì `TIMESTAMP` trần.
   - **Khóa chính & Chuỗi:** Ưu tiên `BIGINT GENERATED ALWAYS AS IDENTITY` hoặc `UUIDv7`, đặt tên bảng/cột chuẩn `snake_case`.

| Ưu Tiên | Nhóm Quy Tắc (`Category`) | Mức Độ | Tiền Tố File `./references/` | Quy Tắc Cốt Lõi Cần Tra Cứu |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Tốc Độ Truy Vấn (`Query Performance`)** | `CRITICAL` | `query-*` | Đánh Index đầy đủ cho cột `WHERE`/`JOIN`/`ORDER BY`, dùng `Partial Index` cho bản ghi đang hoạt động, đọc `EXPLAIN (ANALYZE, BUFFERS)`. |
| **2** | **Quản Lý Kết Nối (`Connection Management`)** | `CRITICAL` | `conn-*` | Dùng Connection Pooling (`PgBouncer` / `Supavisor`), đặt `statement_timeout` & giải phóng kết nối nhàn rỗi tránh sập trần kết nối. |
| **3** | **Bảo Mật & Phân Quyền Dòng (`Security & RLS`)** | `CRITICAL` | `security-*` | Bật `Row-Level Security (RLS)` cho bảng đa người dùng, bọc hàm `(select auth.uid())` và đánh Index cột kiểm tra quyền để RLS không bị chậm. |
| **4** | **Thiết Kế Lược Đồ (`Schema Design`)** | `HIGH` | `schema-*` | Luôn đánh Index cho **mọi cột khóa ngoại (`Foreign Keys`)** để tăng tốc `JOIN` và chống khóa bảng khi xóa/cập nhật bảng cha. |
| **5** | **Đa Luồng & Chống Khóa Bảng (`Concurrency & Locking`)** | `MEDIUM-HIGH` | `lock-*` | Dùng `CREATE INDEX CONCURRENTLY` trên bảng lớn đang chạy thật; khóa dòng có thứ tự nhất quán hoặc `FOR UPDATE SKIP LOCKED` cho hàng đợi. |
| **6** | **Mẫu Truy Xuất Dữ Liệu (`Data Access Patterns`)** | `MEDIUM` | `data-*` | Phân trang bằng con trỏ (`Keyset/Cursor Pagination` theo `(created_at, id)`) thay cho `OFFSET` lớn gây quét chậm hàng triệu dòng; gom `UPSERT` theo lô. |
| **7** | **Giám Sát & Chẩn Đoán (`Monitoring`)** | `LOW-MEDIUM` | `monitor-*` | Theo dõi `pg_stat_statements`, tỷ lệ trúng bộ nhớ đệm (`Cache Hit Ratio >= 99%`) và dọn `VACUUM` định kỳ. |
| **8** | **Tính Năng Nâng Cao (`Advanced Features`)** | `LOW` | `advanced-*` | Đánh chỉ mục `GIN` cho tìm kiếm `JSONB` / Full-Text Search và `HNSW` cho `pgvector`. |

- **Kho tài liệu ví dụ SQL Sai/Đúng chi tiết:** Dùng `read_file` tra cứu trực tiếp trong [`./references/`](file:///~/.gemini/config/skills/postgres-database-architect/references) (xem mục lục tại [`./references/_sections.md`](file:///~/.gemini/config/skills/postgres-database-architect/references/_sections.md)).

---

## 2. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern — Schema + FK/Partial Index + Cursor Query`)
```sql
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_code TEXT NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    total_amount NUMERIC(18, 2) NOT NULL CHECK (total_amount >= 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Bắt buộc đánh Index cho khóa ngoại + Partial Index cho các hóa đơn đang hoạt động (< 10ms)
CREATE INDEX IF NOT EXISTS idx_invoices_active_customer_cursor
ON invoices (customer_id, created_at DESC, id DESC)
WHERE deleted_at IS NULL;
```

## 3. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Tất cả các bảng đều có `PRIMARY KEY`, mọi cột `FOREIGN KEY` đều có `INDEX`, tiền tệ dùng `NUMERIC`/`BIGINT`, thời gian dùng `TIMESTAMPTZ`.
- [x] Mọi thao tác ghi liên quan từ `2` bảng trở lên đều bọc trong giao dịch nguyên tử (`BEGIN ... COMMIT / ROLLBACK`).
- [x] Truy vấn danh sách lớn đạt thời gian thực thi `< 100ms` (kiểm chứng qua `EXPLAIN ANALYZE` trên `postgres-mcp`).
