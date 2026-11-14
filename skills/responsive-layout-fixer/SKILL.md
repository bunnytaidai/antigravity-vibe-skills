---
name: responsive-layout-fixer
description: >-
  [Bác Sĩ Sửa Lỗi Vỡ Khung Hình & Lệch Lề (Responsive PC/Mobile)] — Tác dụng: Tự động co giãn bố cục trang web hiển thị đẹp trên cả màn hình máy tính lớn lẫn điện thoại nhỏ, trị dứt điểm lỗi tràn lề ngang hoặc chữ đè lên nhau — Kích hoạt: Khi giao diện bị lệch, vỡ khung hoặc cần tương thích điện thoại/máy tính.
---

# KỸ NĂNG CHUYÊN SÂU: `RESPONSIVE-LAYOUT-FIXER` (NHÓM 1: FRONTEND, WEB & APP UI/UX — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `responsive-layout-fixer`
- **Vai trò:** Bác sĩ Chẩn đoán & Sửa lỗi Vỡ Bố cục Đa màn hình (`CSS Grid / Flexbox & Responsive Surgeon`)
- **Trọng tâm nhiệm vụ:** Khắc phục triệt để lỗi tràn cuộn ngang (`Horizontal Overflow`), lệch khung, chồng chéo chữ trên mọi kích thước từ Mobile (`320px`) tới Tablet (`768px`) và Desktop (`1920px+`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Sử dụng `grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr))` thay vì gán cứng chiều rộng pixel (`width: 400px`).
2. Thêm `min-w-0` vào các phần tử con của `flex` hoặc `grid` để văn bản dài có thể tự động xuống dòng hoặc cắt dấu `...` (`truncate`) mà không đẩy vỡ khung.
3. Dùng hàm `clamp(1rem, 2vw, 1.5rem)` cho cỡ chữ tiêu đề tự động co giãn mượt mà.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```css
/* Hệ thống lưới tự động co giãn không cần Media Query phức tạp (Zero Overflow Grid) */
.responsive-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: clamp(0.75rem, 2vw, 1.5rem);
  width: 100%;
  box-sizing: border-box;
}

.flex-safe-child {
  min-width: 0; /* Chặn lỗi phần tử con đẩy tràn khung Flex/Grid */
  overflow-wrap: break-word;
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Kiểm tra `document.documentElement.scrollWidth <= document.documentElement.clientWidth` ở các mốc `375px`, `768px`, `1366px`, `1920px`.
- [x] Không có chữ hoặc nút bấm nào bị che khuất hoặc tràn ra ngoài viền thẻ (`Card`).
- [x] Bảng dữ liệu rộng (`Table`) được bọc trong khung `overflow-x-auto` riêng biệt, không làm trôi toàn bộ trang.
