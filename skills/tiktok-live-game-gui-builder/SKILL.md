---
name: tiktok-live-game-gui-builder
description: "[Kiến Trúc Sư Node.js Dựng Giao Diện Hai Làn Tốc Độ (React 19 + Zustand HUD/Admin <-> PixiJS v8 60 FPS Safe-Zone)] — Tác dụng: Thiết kế lớp giao diện Hybrid chuẩn Master Blueprint cho Game Live TikTok màn dọc 1080x1920 gồm trang điều khiển /admin (React 19 + Tailwind v4), lớp HUD nổi /overlay (Zustand Atomic Selector + Framer Motion né vùng cấm Top 8% / Right 14% / Bottom 27%) và vỏ sân khấu <CanvasStageHost /> mount đúng 1 lần chạy PixiJS v8 60 FPS — Kích hoạt: Khi dựng giao diện GUI/UI, trang /admin, lớp HUD Safe-Zone hoặc sân khấu PixiJS cho Game Live TikTok."
---

# KỸ NĂNG CHUYÊN SÂU: `TIKTOK-LIVE-GAME-GUI-BUILDER` (`DUAL-LANE HYBRID REACT 19 + PIXIJS V8` — `version.5.2.0.0`)

## 1. Kiến trúc Giao Diện Hai Làn Tốc Độ (`Dual-Lane Hybrid Architecture`)
- **Tên định danh (`Identifier`):** `tiktok-live-game-gui-builder` *(Triển khai chuẩn `Master Blueprint v4.0.1.0` trên nền `Node.js + Vite 6 + React 19 + Zustand 5 + PixiJS v8`)*
- **Hiểu đơn giản là gì?** Sai lầm lớn nhất khi làm game bằng React là đưa tọa độ `(x, y)` của hàng trăm nhân vật vào `useState` cập nhật `60 lần/giây` làm đơ trình duyệt. Kỹ năng này chia giao diện thành **2 làn chạy song song hoàn toàn không dẫm chân nhau**:
  1. **Làn UI Chậm (`1–15 Hz` trên `React 19 + Zustand + Tailwind v4 + Framer Motion`):**
     - **Trang Quản trị `/admin` (`AdminStudioShell`):** Có sẵn `90%` nút kết nối Live, bảng bắn thử quà/stress test, nhật ký xu và nhúng xem trước `<iframe src="/overlay?muted=1">`.
     - **Lớp HUD Nổi `/overlay` (`OverlayHudSlot`):** Thanh máu PK có máu trễ, Bảng Top Đại Gia, Đồng hồ đếm ngược, Hộp chỉ dẫn quà và Banner nổ Combo quà — chỉ đọc qua `Zustand Atomic Selector` (`useStore(s => s.scores)`) và trượt bằng GPU (`transform`, `opacity`).
  2. **Làn Hành Động Nhanh (`60 FPS` trên `PixiJS v8 WebGL2 + GSAP + Matter.js`):**
     - Bọc thẻ `<canvas>` trong `<CanvasStageHost />` dùng `React.memo(() => true)` để **chỉ Mount đúng `1` lần duy nhất (`renderCount === 1`)** suốt 8 tiếng Live; nhận lệnh trực tiếp từ `Imperative Action RingBuffer` vẽ nhân vật, biểu cảm, hạt và ánh sáng mượt tuyệt đối.

---

## 2. 4 Quy Chuẩn Phát Sóng OBS Bắt Buộc (`Broadcast-Grade UI Standards`)
1. **Khung Vùng An Toàn Chuẩn Tỷ Lệ Phần Trăm `1080×1920` (`SafeZoneFrame`):**
   - Mọi thẻ HUD của React bắt buộc né **3 vùng bị giao diện TikTok/Facebook trên điện thoại che khuất**:
     - **Cạnh trên `8%` (`Y < 154px`):** Thanh Avatar chủ phòng & mắt xem.
     - **Cạnh phải `14%` (`X > 928px`):** Cột nút Tim, Bình luận, Chia sẻ, Quà tặng.
     - **Cạnh dưới `27%` (`Y > 1402px`):** Luồng trôi bình luận và ô nhập chat.
   - Hỗ trợ tham số `?debug=safezone` hiển thị khung viền đỏ bán trong suốt để căn chỉnh trực quan.
2. **Khóa Âm Thanh Đơn Kênh & Tự Dìm Nhạc (`Howler.js Audio Ducking`):**
   - Chỉ `/overlay?audio=primary` mở trong OBS được phát âm thanh chính; khi nổ quà lớn hoặc đọc thông báo VIP, nhạc nền `BGM` tự hạ `-10dB` trong `600ms` rồi nâng lại êm ái.
3. **Chọn Lọc Đúng Mô-Đun Trong `5 Canvas Primitives` (`Tree-Shakable Import`):**
   - Trong `worldController`, chỉ `import` đúng các nhóm mà game cần (`particle-pool`, `procedural-motion`, `lighting-shadow`, `modular-actor-2d`, `physics-and-cues`) để giữ mức ăn CPU `< 5%`.
4. **Dọn Sạch Tài Nguyên Phiên Dài (`Mandatory dispose()`):** Khi đổi cảnh hoặc kết thúc ván lớn, bắt buộc hủy toàn bộ `Texture`, `Sprite`, `Timer` và `Physics Body` để chạy `8–12 tiếng` không tăng RAM.

---

## 3. Mẫu Kiểm Định `SafeZoneFrame` & `<CanvasStageHost />` Thuần `Node.js ESM`
```javascript
export const MASTER_SAFEZONE_1080X1920 = Object.freeze({
  width: 1080,
  height: 1920,
  minSafeY: Math.ceil(1920 * 0.08),        // 154px (né Top 8%)
  maxSafeX: Math.floor(1080 * (1 - 0.14)), // 928px (né Right 14%)
  maxSafeY: Math.floor(1920 * (1 - 0.27)), // 1401px (né Bottom 27%)
});

export function auditMasterSafeZoneWidgets(widgets) {
  const violations = [];
  for (const wg of widgets) {
    if (wg.y < MASTER_SAFEZONE_1080X1920.minSafeY) {
      violations.push(`[${wg.widgetId}] Vi phạm Cạnh trên 8% (y=${wg.y} < ${MASTER_SAFEZONE_1080X1920.minSafeY}px)`);
    }
    if (wg.x + wg.w > MASTER_SAFEZONE_1080X1920.maxSafeX) {
      violations.push(`[${wg.widgetId}] Vi phạm Cạnh phải 14% (xEnd=${wg.x + wg.w} > ${MASTER_SAFEZONE_1080X1920.maxSafeX}px)`);
    }
    if (wg.y + wg.h > MASTER_SAFEZONE_1080X1920.maxSafeY) {
      violations.push(`[${wg.widgetId}] Vi phạm Cạnh dưới 27% (yEnd=${wg.y + wg.h} > ${MASTER_SAFEZONE_1080X1920.maxSafeY}px)`);
    }
  }
  return { ok: violations.length === 0, violations };
}
```

---

## 4. Script Sinh Cấu Hình Hybrid GUI/UI Đi Kèm & Danh Sách Nghiệm Thu
- **Sinh cấu hình `hud_theme_layout.json` & kiểm định `SafeZoneFrame (8% / 14% / 27%)`:**
  `node "~/.gemini\config\skills\tiktok-live-game-gui-builder\scripts\generate_hud_safezone_layout.mjs" --out <thu_muc_ui>`
- [x] `<CanvasStageHost />` khóa `React.memo(() => true)` đảm bảo `renderCount === 1` khi điểm số `Zustand` nhảy liên tục.
- [x] `100%` thẻ HUD nằm gọn trong vùng an toàn `X <= 928px, 154px <= Y <= 1401px` và tách bạch âm thanh `?audio=primary` / `?muted=1`.
