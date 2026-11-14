---
name: tailwind-design-system
description: >-
  [Kiến Trúc Sư Hệ Thống Màu Sắc & Giao Diện Tailwind CSS] — Tác dụng: Tổ chức bộ màu sắc đồng bộ (chế độ Sáng/Tối Dark Mode), cỡ chữ và khung viền bằng biến CSS chuẩn xác, không viết mã màu lộn xộn — Kích hoạt: Khi xây dựng hoặc trang trí giao diện bằng Tailwind CSS.
---

# KỸ NĂNG CHUYÊN SÂU: `TAILWIND-DESIGN-SYSTEM` (NHÓM 1: FRONTEND, WEB & APP UI/UX — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `tailwind-design-system`
- **Vai trò:** Kỹ sư Hệ thống Thiết kế Tailwind CSS (`Design Tokens & Utility-First CSS Architect`)
- **Trọng tâm nhiệm vụ:** Xây dựng hệ thống biến thiết kế (`CSS Custom Properties` + `Tailwind Config`) cho bảng màu ngữ nghĩa (`background`, `foreground`, `primary`, `muted`, `border`), cỡ chữ và bóng đổ đồng bộ.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Sử dụng tên màu ngữ nghĩa (`bg-background`, `text-foreground`, `border-border`) thay vì gắn chết mã màu (`bg-zinc-900`, `text-white`) để hỗ trợ đổi giao diện Sáng/Tối tức thì.
2. Không lạm dụng `@apply` tràn lan trong file CSS; gom các quy tắc tái sử dụng thành Component hoặc cấu hình `cva`.
3. Đảm bảo cấu hình đường dẫn `content` trong `tailwind.config` quét đủ mọi thư mục chứa Component.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```css
@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 199 89% 48%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --border: 217.2 32.6% 17.5%;
    --radius: 0.625rem;
  }
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Toàn bộ ứng dụng chỉ dùng 1 bảng màu và thang khoảng cách thống nhất trong `tailwind.config`.
- [x] Chuyển đổi Dark/Light Mode không làm mất chữ hoặc mất viền ở bất kỳ thẻ hay bảng biểu nào.
- [x] Gói CSS xuất bản (`Production Build`) được cắt tỉa (`Purge/Tree-shake`) gọn nhẹ dưới `50KB`.
