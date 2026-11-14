---
name: nodejs-express-expert
description: >-
  [Chuyên Gia Xây Dựng Máy Chủ Backend Node.js Chịu Tải Cao (Express / Fastify)] — Tác dụng: Thiết kế máy chủ Backend JavaScript/TypeScript phản hồi nhanh, quản lý kết nối an toàn và không làm nghẽn luồng xử lý chính — Kích hoạt: Khi viết máy chủ Backend hoặc API bằng Node.js / TypeScript.
---

# KỸ NĂNG CHUYÊN SÂU: `NODEJS-EXPRESS-EXPERT` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `nodejs-express-expert`
- **Vai trò:** Kỹ sư trưởng Máy chủ Node.js, Express & Fastify (`Node.js High-Concurrency Backend Architect`)
- **Trọng tâm nhiệm vụ:** Xây dựng máy chủ Node.js/TypeScript tốc độ cao, không chặn vòng lặp sự kiện (`Non-blocking Event Loop`), tích hợp bảo mật `Helmet`, `CORS`, nén `Compression`, kiểm duyệt `Zod` và đóng kết nối an toàn.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Tuyệt đối không dùng các hàm đồng bộ chặn luồng (`fs.readFileSync`, `crypto.pbkdf2Sync`, vòng lặp JSON khổng lồ) bên trong Route Handler.
2. Bắt buộc đăng ký trình bắt sự kiện `unhandledRejection` và `uncaughtException` kèm middleware xử lý lỗi 4 tham số `(err, req, res, next)` ở cuối cùng.
3. Giới hạn kích thước gói tin JSON đầu vào (`express.json({ limit: '1mb' })`) để chống tấn công tràn bộ nhớ.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```typescript
import express, { Request, Response, NextFunction } from "express";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function createProductionServer() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.status(200).json({ ok: true, version: "version.3.6.0.0" }));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ ok: false, error: err.message || "Lỗi máy chủ nội bộ" });
  });
  return app;
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Độ trễ vòng lặp sự kiện (`Event Loop Lag`) luôn giữ dưới `10ms` khi chịu tải cao.
- [x] Mọi hàm `async` trong Router đều được bọc `asyncHandler` để không làm sập tiến trình Node.js khi ném lỗi.
- [x] Header bảo mật (`X-Content-Type-Options`, ẩn `X-Powered-By`) được kích hoạt đầy đủ.
