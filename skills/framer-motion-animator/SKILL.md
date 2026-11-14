---
name: framer-motion-animator
description: >-
  [Phù Thủy Hiệu Ứng Chuyển Động Mượt 60fps (Framer Motion)] — Tác dụng: Thêm hiệu ứng chuyển trang êm ái, nút bấm nảy nhẹ, danh sách trượt mượt mà bằng GPU mà không làm nặng máy — Kích hoạt: Khi cần thêm hiệu ứng động (Animation) sinh động cho giao diện.
---

# KỸ NĂNG CHUYÊN SÂU: `FRAMER-MOTION-ANIMATOR` (NHÓM 1: FRONTEND, WEB & APP UI/UX — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `framer-motion-animator`
- **Vai trò:** Chuyên gia Hiệu ứng Chuyển động & Tương tác Vi mô (`Motion Design & Micro-interactions`)
- **Trọng tâm nhiệm vụ:** Tạo chuyển động chuyển trang, xuất hiện danh sách (`Stagger Children`) và phản hồi nút bấm mượt 60fps bằng `Framer Motion` chỉ sử dụng thuộc tính tăng tốc GPU (`transform`, `opacity`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Chỉ tạo animation trên `transform` (`x`, `y`, `scale`, `rotate`) và `opacity` để tận dụng GPU GTX 1660 Ti, cấm animate `width`/`height`/`top`/`left` gây giật khung hình (`Layout Thrashing`).
2. Luôn tôn trọng cài đặt `prefers-reduced-motion` của người dùng Windows.
3. Thời lượng hiệu ứng giao diện chuẩn từ `150ms` đến `300ms` với đường cong vật lý `spring` tự nhiên.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```tsx
import { motion, AnimatePresence } from "framer-motion";

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

export const fadeInUpItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } }
};

export function AnimatedCardList({ items }: { items: { id: string; title: string }[] }) {
  return (
    <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="grid gap-3">
      <AnimatePresence>
        {items.map((item) => (
          <motion.li key={item.id} variants={fadeInUpItem} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            {item.title}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Tốc độ khung hình giữ ổn định `60fps`, không gây nhảy bố cục (`CLS = 0`).
- [x] Hiệu ứng đóng/mở danh sách hoặc Modal có `AnimatePresence` mượt mà cả chiều vào lẫn chiều ra.
- [x] Tự động tắt hiệu ứng nặng khi hệ điều hành bật chế độ giảm chuyển động (`useReducedMotion`).
