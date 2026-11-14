---
name: computer-vision-opencv
description: >-
  [Chuyên Gia Thị Giác Máy Tính Node.js + OpenCV.js / FFmpeg Mổ Băng Video Game Mẫu & Đo Tọa Độ HUD] — Tác dụng: Ưu tiên dùng Node.js (v24 + FFmpeg + @techstark/opencv-js / sharp) trên máy Antidv (Xeon 24 luồng, 64GB RAM, GTX 1660 Ti) để đọc video quay màn hình game mẫu, tự động cắt khung hình nhân vật đứng (idle), bắn (shoot), trúng đạn (hit) và đo chính xác tọa độ (X, Y, W, H) thanh máu, khung thông báo — Kích hoạt: Khi cần đọc/phân tích video game mẫu, tự động cắt frame hành động nhân vật hoặc đo tọa độ thanh máu, nút bấm, khung thông báo UI.
---

# KỸ NĂNG CHUYÊN SÂU: `COMPUTER-VISION-OPENCV` (`NODE.JS-FIRST` — PHÂN TÍCH VIDEO GAME MẪU & ĐO TỌA ĐỘ HUD — `version.5.1.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi (`Newbie-Friendly Overview`)
- **Tên định danh (`Identifier`):** `computer-vision-opencv` *(Tối ưu ưu tiên tuyệt đối **`Node.js v24`** cho máy trạm Antidv; chỉ dùng `opencv-python` dự phòng khi bài toán không thể chạy trên Node)*
- **Hiểu đơn giản là gì?** Khi bạn có **video quay màn hình game mẫu** (`.mp4`, `.mkv`, `.mov`), kỹ năng này dùng **`Node.js` (`node:child_process` gọi `ffmpeg`/`ffprobe` + bộ xử lý mảng pixel `Uint8Array` / `@techstark/opencv-js` / `sharp`)** để làm 2 việc hoàn toàn bằng JavaScript:
  1. **Tự động cắt khung hình hành động (`Action Keyframe Slicing`):** Đọc luồng khung hình vào bộ nhớ đệm, đo biến thiên chuyển động (`Motion Diff`) và tia chớp sáng (`Flash Ratio`) để tách riêng khoảnh khắc nhân vật **đứng yên (`idle`)**, **bắn (`shoot`)**, **trúng đạn (`hit`)**, kèm lọc chống trùng lặp (`dHash`).
  2. **Đo tọa độ giao diện chuẩn xác (`HUD Bounding-Box Profiler`):** Tự động dò dải màu `HSV` và xuất file `hud_layout_coords.json` kèm ảnh đối chứng `hud_debug_overlay.png` ghi rõ tọa độ `(X, Y, W, H)` và tỷ lệ `%` của **thanh máu (`HP Bar`)** và **khung thông báo quà (`Notification Box`)**.

---

## 2. Quy tắc Tối ưu Riêng Cho Cấu hình Máy Antidv (`Node.js Workstation Rules`)
1. **Luật Ưu Tiên `Node.js` (`Node.js v24 + FFmpeg + V8 TypedArray`):**
   - Dùng `ffmpeg -f rawvideo -pix_fmt rgb24 pipe:1` bơm thẳng luồng pixel sang `Node.js Buffer` trên **`64GB RAM`** kết hợp `node:worker_threads` (chia tối đa `12 luồng` khớp `12 nhân vật lý Xeon E5-2678 v3`) để quét hàng trăm khung hình trong vài phần mười giây mà không làm đơ luồng chính (`Event Loop`).
2. **Khi nào dùng thêm gói npm bổ trợ?**
   - Xử lý nhanh không cần cài thêm: chạy trực tiếp script chuẩn `scripts/extract_game_frames_and_hud.mjs` (thuần `Node.js` tích hợp sẵn `node:zlib` + `ffmpeg`).
   - Khi cần thuật toán `Canny`, `Contours`, `Template Matching` nâng cao trong dự án Node: cài `@techstark/opencv-js` *(bản WebAssembly chạy thẳng trên Node không cần biên dịch C++)* cùng `sharp`. Chỉ đổi sang Python khi bắt buộc chạy mô hình `CUDA` đặc thù mà `Node.js` không có binding.
3. **Bảo vệ trần `6GB VRAM` của `GTX 1660 Ti`:** Giải mã video bằng CPU đa luồng hoặc `-hwaccel d3d11va` gọn nhẹ, luôn đóng sạch tiến trình con `ffmpeg` khi kết thúc để không rò rỉ bộ nhớ.

---

## 3. Mẫu Triển Khai Chuẩn Thực Chiến Thuần `Node.js` (`ESM Production Pattern`)
```javascript
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";

/** Đọc 1 khung hình RGB24 từ video mẫu qua FFmpeg và đo nhanh tọa độ (X, Y, W, H) thanh máu bằng Node.js */
export async function measureHpBarFromVideoNode(videoPath, width, height, timestampSec = "00:00:01") {
  const rawRgb = execFileSync("ffmpeg", [
    "-v", "error", "-ss", timestampSec, "-i", videoPath,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
  ], { maxBuffer: width * height * 4 });

  let minX = width, minY = height, maxX = -1, maxY = -1;
  const maxScanY = Math.floor(height * 0.45); // Quét nửa trên màn hình nơi đặt HUD/Thanh máu
  for (let y = 0; y < maxScanY; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const r = rawRgb[idx], g = rawRgb[idx + 1], b = rawRgb[idx + 2];
      const isRedHp = r > 180 && g < 70 && b < 70;
      const isGreenHp = g > 175 && r < 95 && b < 95;
      if (isRedHp || isGreenHp) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const hpBar = maxX >= minX ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null;
  await fs.writeFile("hud_layout_coords.json", JSON.stringify({ resolution: [width, height], hpBar }, null, 2));
  return hpBar;
}
```

---

## 4. Công Cụ `Node.js` Đi Kèm & Danh Sách Nghiệm Thu (`CLI & Verification Checklist`)
- **Chạy ngay bằng `Node.js` (không cần cài thêm gói ngoài):**
  `node "~/.gemini\config\skills\computer-vision-opencv\scripts\extract_game_frames_and_hud.mjs" --video <duong_dan.mp4> --out <thu_muc_xuat>`
- [x] `100%` quy trình đọc video, cắt frame (`idle`, `shoot`, `hit`) và đo tọa độ `(X, Y, W, H)` chạy mượt trực tiếp trên `Node.js v24` (`Exit Code: 0`).
- [x] Sinh đầy đủ tệp `hud_layout_coords.json` (tọa độ pixel + phần trăm `%`) kèm ảnh kiểm chứng `hud_debug_overlay.png` vẽ khung viền trực quan.
- [x] Bộ lọc `dHash 64-bit` bằng `BigInt` trên JavaScript loại bỏ hoàn toàn các frame đứng yên bị trùng lặp.
