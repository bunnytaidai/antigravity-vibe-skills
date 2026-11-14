---
name: rest-graphql-api-designer
description: >-
  [Kiến Trúc Sư Thiết Kế Chuẩn Giao Tiếp Dữ Liệu API (REST & GraphQL)] — Tác dụng: Quy hoạch các đường dẫn API rõ ràng, thống nhất mẫu gói tin JSON trả về (luôn có trạng thái thành công/thất bại, mã lỗi và phân trang chuẩn xác) — Kích hoạt: Khi thiết kế các cổng kết nối API giữa Giao diện (Frontend) và Máy chủ (Backend).
---

# KỸ NĂNG CHUYÊN SÂU: `REST-GRAPHQL-API-DESIGNER` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `rest-graphql-api-designer`
- **Vai trò:** Kiến trúc sư Đặc tả Giao diện Lập trình Ứng dụng (`RESTful & GraphQL API Contract Architect`)
- **Trọng tâm nhiệm vụ:** Thiết kế hợp đồng API chuẩn mực: quản lý phiên bản (`/api/v1/...`), khung phản hồi JSON đồng nhất (`Envelope`), phân trang con trỏ (`Cursor/Offset Pagination`), lọc/sắp xếp và chuẩn hóa lỗi theo `RFC 7807 Problem Details`.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Đường dẫn REST dùng danh từ số nhiều viết thường cách nhau bởi dấu gạch ngang (`/api/v1/user-profiles`), tuyệt đối không đặt động từ như `/api/v1/getUsers`.
2. Mọi API trả về danh sách bắt buộc phải có phân trang (`limit`, `cursor` hoặc `page`, `total`) để chống sập mạng khi bảng có hàng triệu bản ghi.
3. Với GraphQL, bắt buộc dùng `DataLoader` để gom truy vấn, triệt tiêu hoàn toàn lỗi `N+1 Queries`.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```typescript
// Khung phản hồi API chuẩn hóa toàn hệ thống (Unified API Envelope — version.3.6.0.0)
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;       // Ví dụ: "VALIDATION_FAILED" | "RESOURCE_NOT_FOUND"
    message: string;    // Thông báo Tiếng Việt rõ ràng cho người dùng
    details?: unknown;  // Chi tiết từng trường bị lỗi
    traceId: string;
  };
  timestamp: string;
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] 100% các Endpoint trong dự án trả về cùng một cấu trúc `ApiSuccessResponse` / `ApiErrorResponse`.
- [x] Sử dụng đúng phương thức và mã HTTP: `GET (200)`, `POST (201 Created)`, `PATCH/PUT (200)`, `DELETE (204/200)`, `400`, `401`, `403`, `404`, `422`, `429`, `500`.
- [x] Các thao tác tạo mới quan trọng (`POST /orders`) hỗ trợ `Idempotency-Key` trong Header.
