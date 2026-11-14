---
name: game-character-vfx-asset-pipeline
description: >-
  [Xưởng Node.js Chế Tạo Cây Thư Mục Hành Động Nhân Vật Game, Ảnh Nền Đa Lớp, VFX & Hiệu Ứng Tương Tác] — Tác dụng: Dùng Node.js tạo trọn bộ thư mục hành động nhân vật (idle, walk, shoot, hit, skill, ko), ảnh nền đa lớp (Parallax 9:16 / 16:9), hiệu ứng chiến đấu (VFX) và hiệu ứng tương tác JavaScript (hit-stop, rung camera, nảy sát thương, nổ quà), kiểm định nền trong suốt RGBA và đóng gói Spritesheet vừa khít 6GB VRAM GTX 1660 Ti — Kích hoạt: Khi tạo cấu trúc thư mục hành động nhân vật game, làm ảnh nền, làm hiệu ứng kỹ năng/chiến đấu hoặc hiệu ứng tương tác phản hồi (Game Feel / VFX).
---

# KỸ NĂNG CHUYÊN SÂU: `GAME-CHARACTER-VFX-ASSET-PIPELINE` (`NODE.JS-FIRST` — NHÂN VẬT, ẢNH NỀN, VFX & HIỆU ỨNG TƯƠNG TÁC — `version.5.1.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi (`Newbie-Friendly Overview`)
- **Tên định danh (`Identifier`):** `game-character-vfx-asset-pipeline` *(Tích hợp từ bộ 3 chuẩn `create-game-assets` + `game-feel` + `create-game-vfx`, viết lại thuần **`Node.js / JavaScript`** cho máy Antidv)*
- **Hiểu đơn giản là gì?** Để game `Canvas / PixiJS / Phaser` chạy mượt `60 FPS` không bị lệch chân nhân vật khi đổi từ *đứng* sang *bắn* hay *trúng đạn*, kỹ năng này dùng **`Node.js` (`node:fs/promises`, `sharp` / `Buffer RGBA`)** chuẩn hóa 4 phần:
  1. **Cây thư mục Hành động Nhân vật (`Character Action Folders`):** Tự động tạo `idle` *(đứng)*, `walk` *(đi)*, `shoot` *(bắn)*, `hit` *(trúng đạn)*, `skill` *(tung chiêu)*, `ko` *(hạ gục)* cùng điểm neo dưới chân **`pivot: [0.5, 1.0]`**.
  2. **Ảnh nền đa lớp (`Layered Parallax Backgrounds`):** Chia `01_sky`, `02_midground`, `03_arena_floor`, `04_foreground_fx` chuẩn `9:16 (1080x1920)` hoặc `16:9 (1920x1080)`.
  3. **Hiệu ứng chiến đấu (`Combat VFX`):** `muzzle_flash` *(tia lửa nòng súng)*, `projectile` *(đạn bay)*, `impact_spark` *(tia nổ trúng đích)*, `explosion`, `buff_aura`.
  4. **Hiệu ứng tương tác JavaScript (`Interactive Juice / Game Feel`):** Khựng đòn `Hit-Stop` (`performance.now()` không bị kẹt thời gian), rung chấn camera `trauma^2`, chớp trắng `Hit Flash` và nảy số sát thương.

---

## 2. Quy tắc Tối ưu Riêng Cho Cấu hình Máy Antidv (`Node.js + GTX 1660 Ti Rules`)
1. **Ngân sách Texture Atlas vừa khít `GTX 1660 Ti (6GB VRAM)`:**
   - Mọi tấm `spritesheet.png` đóng gói bằng `Node.js` không vượt quá **`2048x2048 RGBA`**, chiều rộng/cao luôn làm tròn bội số của `4` để tương thích nén `WebGL`, giữ tổng VRAM Texture `< 512MB`.
2. **Kiểm định Nền Trong Suốt `RGBA` Thật (`Anti-Fake-Checkerboard`):**
   - Dùng `scripts/asset_report.mjs --require-alpha` quét kênh `Alpha` của từng ảnh `.png`; chặn đứng lỗi ảnh AI vẽ ô caro xám-trắng giả trong suốt (`alphaMin === 255`). Khi xử lý hàng loạt trong dự án Node.js lớn, ưu tiên thư viện `sharp` (tận dụng đa luồng C++ `libvips` trên `12 nhân Xeon`).
3. **Hiệu ứng tương tác `60 FPS` không rác bộ nhớ (`Zero-GC Object Pool`):**
   - Trong JavaScript, tái sử dụng mảng hạt nổ (`Particle Pool <= 120 hạt`), chỉ dịch chuyển `cameraOffset` khi rung màn hình (không dịch tọa độ vật lý nhân vật) và dùng `requestAnimationFrame` với thời gian thực `performance.now()` cho `Hit-Stop`.

---

## 3. Mẫu Code `Node.js` & Bộ Hiệu Ứng Tương Tác JavaScript (`ESM Production Pattern`)
```javascript
import fs from "node:fs/promises";
import path from "node:path";

/** Tạo chuẩn cây thư mục hành động nhân vật, nền đa lớp & cấu hình hiệu ứng tương tác bằng Node.js */
export async function scaffoldGameAssetsNode(rootDir, characters = ["hero_blue", "boss_red"]) {
  const states = ["idle", "walk", "shoot", "hit", "skill", "ko"];
  const vfxList = ["muzzle_flash", "projectile", "impact_spark", "explosion", "buff_aura"];
  for (const charName of characters) {
    for (const st of [...states, "build"]) {
      await fs.mkdir(path.join(rootDir, "characters", charName, st), { recursive: true });
    }
  }
  for (const fx of vfxList) await fs.mkdir(path.join(rootDir, "vfx", fx), { recursive: true });
  await fs.mkdir(path.join(rootDir, "backgrounds", "arena_main"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "interactive_fx"), { recursive: true });
}

/** Bộ điều khiển Hit-Stop & Rung màn hình Trauma mượt 60 FPS trên Canvas / PixiJS / Phaser */
export class GameFeelController {
  constructor() { this.trauma = 0; this.hitStopUntilMs = 0; this.timeMs = 0; }
  triggerImpact({ traumaAdd = 0.4, hitStopMs = 50 } = {}, nowMs = performance.now()) {
    this.trauma = Math.min(1, this.trauma + traumaAdd);
    // Lấy mốc kết thúc muộn nhất để 2 đòn trúng liên tiếp không làm kẹt hoặc hủy sớm Hit-Stop
    this.hitStopUntilMs = Math.max(this.hitStopUntilMs, nowMs + hitStopMs);
  }
  stepRealTime(realDtSec, nowMs = performance.now()) {
    this.trauma = Math.max(0, this.trauma - 1.25 * realDtSec);
    this.timeMs += realDtSec * 30;
    const shake = this.trauma * this.trauma;
    return {
      isFrozen: nowMs < this.hitStopUntilMs,
      cameraOffsetX: shake > 0 ? Math.round(12 * shake * Math.sin(this.timeMs * 1.7)) : 0,
      cameraOffsetY: shake > 0 ? Math.round(8 * shake * Math.sin(this.timeMs * 2.3)) : 0,
    };
  }
}
```

---

## 4. Bộ Script `Node.js` Đi Kèm & Danh Sách Nghiệm Thu (`Node CLI & QA Checklist`)
- **Tạo cây thư mục + Đóng gói `spritesheet.png` & `atlas.json`:**
  `node "~/.gemini\config\skills\game-character-vfx-asset-pipeline\scripts\scaffold_character_vfx_dirs.mjs" --root <thu_muc_assets> --characters hero_blue,boss_red --resolution 1080x1920`
- **Kiểm tra nền trong suốt `RGBA` thật bằng `Node.js`:**
  `node "~/.gemini\config\skills\game-character-vfx-asset-pipeline\scripts\asset_report.mjs" <anh.png> --require-alpha --json`
- **Tài liệu tham chiếu:** `references/raster-pipeline.md` & `references/feedback-recipes.md`.
- [x] Toàn bộ script tạo thư mục, đóng gói Atlas và kiểm định `RGBA` chạy thuần trên `Node.js v24` (`Exit Code: 0`).
- [x] `GameFeelController` đảm bảo trả `cameraOffset` về đúng `(0, 0)` và thoát `Hit-Stop` chính xác `100%` khi dồn sát thương liên thanh.
