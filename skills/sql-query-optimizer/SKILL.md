---
name: sql-query-optimizer
description: >-
  [Chuyên Gia Tăng Tốc Câu Lệnh Tìm Kiếm SQL Chạy Dưới 100ms] — Tác dụng: Soi nguyên nhân làm câu lệnh SQL bị chậm và viết lại câu truy vấn kết hợp đánh chỉ mục để tốc độ tìm kiếm luôn mượt mà dưới 100 mili-giây — Kích hoạt: Khi trang danh sách/báo cáo tải dữ liệu chậm hoặc cần tối ưu câu lệnh SQL.
---

# KỸ NĂNG CHUYÊN SÂU: `SQL-QUERY-OPTIMIZER` (NHÓM 3: DATABASE, ORM & DATA ENGINEERING — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `sql-query-optimizer`
- **Vai trò:** Chuyên gia Tối ưu Hóa Truy vấn & Chẩn đoán Nghẽn Cổ chai SQL (`SQL Performance & Execution Plan Optimizer`)
- **Trọng tâm nhiệm vụ:** Phân tích kế hoạch thực thi thực tế bằng `EXPLAIN (ANALYZE, BUFFERS)`, loại bỏ quét tuần tự toàn bảng (`Seq Scan`), biến đổi truy vấn con tương quan (`Correlated Subqueries`) và áp dụng `Covering Index` để đưa thời gian chạy xuống dưới `50ms`.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Không bao giờ bọc hàm quanh cột đã đánh chỉ mục ở vế trái mệnh đề `WHERE` (ví dụ: thay `WHERE EXTRACT(YEAR FROM created_at) = 2026` bằng `WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'`).
2. Thay thế phân trang `OFFSET 100000 LIMIT 20` (cực chậm vì phải đếm bỏ qua 100.000 dòng) bằng phân trang `Keyset/Seek Pagination` (`WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20`).
3. Không dùng `SELECT *` trong code thực tế; chỉ liệt kê đúng các cột cần lấy để tận dụng `Index-Only Scan`.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```sql
-- Tối ưu phân trang Keyset (Seek Method): Tốc độ < 5ms bất kể ở trang thứ 1 hay trang thứ 10.000
SELECT id, invoice_code, customer_id, total_amount, created_at
FROM invoices
WHERE deleted_at IS NULL
  AND (created_at, id) < ('2026-10-31T00:00:00Z'::timestamptz, 950000)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Kết quả `EXPLAIN (ANALYZE, BUFFERS)` xác nhận sử dụng `Index Scan` hoặc `Index Only Scan`, hoàn tất dưới `50ms`.
- [x] Số khối bộ đệm phải đọc (`Shared Hit / Read Buffers`) giảm tối thiểu `80%` so với câu lệnh ban đầu.
- [x] Hai câu lệnh trước và sau khi tối ưu trả về tập kết quả giống hệt nhau 100%.
