---
name: prisma-drizzle-orm-helper
description: >-
  [Phiên Dịch Viên Thao Tác Cơ Sở Dữ Liệu An Toàn Qua ORM (Prisma / Drizzle / SQLAlchemy)] — Tác dụng: Giúp viết code lấy và lưu dữ liệu gọn gàng, đúng kiểu dữ liệu 100% và diệt tận gốc lỗi gọi Database lặp đi lặp lại trong vòng lặp (lỗi N+1) — Kích hoạt: Khi kết nối và truy vấn Database trong code Python hoặc TypeScript/Node.js.
---

# KỸ NĂNG CHUYÊN SÂU: `PRISMA-DRIZZLE-ORM-HELPER` (NHÓM 3: DATABASE, ORM & DATA ENGINEERING — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `prisma-drizzle-orm-helper`
- **Vai trò:** Chuyên gia Tầng Ánh xạ Quan hệ Đối tượng An toàn Kiểu (`Prisma / Drizzle ORM / SQLAlchemy 2.0 Specialist`)
- **Trọng tâm nhiệm vụ:** Thao tác cơ sở dữ liệu an toàn kiểu 100% (`End-to-End Type Safety`), tối ưu hóa câu lệnh tải dữ liệu liên kết (`include`/`with`) chống lỗi `N+1 Queries`, quản lý `Singleton Connection Pool` và giao dịch nguyên tử.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Trong môi trường phát triển (`Next.js` / `Node.js` Hot Reload), bắt buộc khởi tạo `PrismaClient` hoặc `Drizzle Pool` theo mẫu `Global Singleton` để không làm tràn giới hạn kết nối PostgreSQL (`Too many clients already`).
2. Luôn dùng `select` chỉ lấy đúng các cột cần thiết thay vì kéo toàn bộ các cột lớn không dùng tới.
3. Trong SQLAlchemy 2.0 (Python), sử dụng cú pháp mới `select(User).where(...)` và `mapped_column` thay vì `session.query()` cũ.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```typescript
// Khởi tạo Prisma/DB Client chuẩn Singleton chống tràn kết nối khi Hot-Reload
export function createSingleton<T>(key: string, factory: () => T): T {
  const globalAny = globalThis as unknown as Record<string, T>;
  if (!globalAny[key]) {
    globalAny[key] = factory();
  }
  return globalAny[key];
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Không có bất kỳ vòng lặp `for ... await db.query()` nào gây lỗi `N+1 Queries` (phải gộp bằng `inArray` / `IN (...)` hoặc `JOIN`).
- [x] Kiểu dữ liệu trả về từ tầng ORM khớp tự động 100% với tầng Service và TypeScript/Pydantic mà không cần ép kiểu `any`.
- [x] Sử dụng giao dịch `db.transaction(async (tx) => { ... })` cho mọi nghiệp vụ cập nhật nhiều bảng.
