---
name: tiktok-game-source-visual-cloner
description: "[Chuyên Gia Node.js Clone Đồ Họa Đa Nguồn & Xử Lý Assets 2 Nhánh Cutout Rig / Flipbook + AI Bù File Thiếu] — Tác dụng: Bóc tách đồ họa gốc, nhân vật, hành động, biểu cảm, hiệu ứng và tương tác vật thể từ link YouTube / Livestream / GitHub hoặc thư mục 3-4 ảnh tham chiếu (assets-raw/), sau đó xử lý theo chuẩn 2 nhánh Master Blueprint (Nhánh A: Tách mảnh Cutout Rig + Trộn biểu cảm ModularActor2D; Nhánh B: Grid SpriteSheet .webp) và dùng AI vẽ bù file thiếu — Kích hoạt: Khi clone hình ảnh/chuyển động game từ YouTube, Livestream, GitHub hoặc đóng gói assets-raw/ cho Hộp Băng Game."
---

# KỸ NĂNG CHUYÊN SÂU: `TIKTOK-GAME-SOURCE-VISUAL-CLONER` (`NODE.JS` — CLONE ĐA NGUỒN, 2 NHÁNH `CUTOUT RIG / FLIPBOOK` & AI BÙ FILE — `version.5.2.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi (`Master Blueprint Asset Pipeline`)
- **Tên định danh (`Identifier`):** `tiktok-game-source-visual-cloner` *(Thuần **`Node.js ESM`** — nạp nguyên liệu trực tiếp cho `games/<slug>/assets-raw/` và `packages/canvas-primitives`)*
- **Hiểu đơn giản là gì?** Khi bạn đưa vào **link video YouTube**, **link Livestream**, **link kho GitHub**, hoặc **thư mục `assets-raw/<entity>/` chứa `3–4` ảnh mẫu**, nếu bảo AI vẽ rời rạc từng khung hình thì mặt mũi và quần áo nhân vật sẽ bị méo nhấp nháy. Kỹ năng này giải quyết triệt để bằng **Dây Chuyền 3 Tầng Chuẩn Công Nghiệp**:
  1. **Thu hoạch & Đo ADN Nguồn Gốc (`Tri-Source Extractor`):** Dùng `Node.js` (`yt-dlp`, `ffmpeg`, `sharp`, `@techstark/opencv-js`, `repomix`) bóc tách **Đồ họa gốc (`artStyleDna`)**, **Giao diện**, **Nhân vật**, **Hành động**, **Biểu cảm** và **Ma trận tương tác giữa các vật thể**.
  2. **Phân luồng Xử lý 2 Nhánh Chống Méo Hình (`2-Branch Asset Compiler`):**
     - **Nhánh A — Cắt Khớp Ghép Mảnh (`Cutout Rig` cho `85%` nhân vật/thú cưng):** Từ `3–4` ảnh tham chiếu, tách các mảnh PNG trong suốt (`body`, `head`, `arm_L`, `arm_R`, `leg_L`, `leg_R`) + lớp biểu cảm rời (`eyes_normal/blink/happy/shock`, `mouth_idle/talk/cheer`). Nạp thẳng chuyển động từ `shared-assets/motions/` (`idle_breathe.json`, `walk.json`, `cheer_jump.json`, `hit_recoil.json`) vào mô-đun `ModularActor2D` — giữ `100%` nét vẽ gốc, tự chớp mắt mỗi `2.5–5.5s` theo `mood`.
     - **Nhánh B — Dải Khung Hình Ngắn (`SpriteSheet Flipbook` cho VFX / Biến hình):** Sinh chuỗi `6–12` khung đồng bộ trên một lưới (`Grid SpriteSheet`) và đóng gói thành `.webp + .json` (`1 Draw Call` trên GPU).
  3. **Kiểm toán File Thiếu & Dùng AI Vẽ Bù Sát Gốc (`Style-Locked AI Gap-Fill`):** Thiếu mảnh bộ phận, biểu cảm hay hạt hiệu ứng nào thì lập hàng đợi gọi AI vẽ bù khóa chặt bảng màu gốc và tách nền `RGBA` thật bằng `sharp`.

---

## 2. Quy Tắc Bám Sát Nguồn Gốc & Kết Nối `5 Canvas Primitives` (`Mandatory Rules`)
1. **Khóa ADN Đồ Họa & Chặn Đứng Nền Caro Giả (`Alpha & Palette Gate`):**
   - Dùng `sharp` trích xuất `5–8` mã màu chủ đạo từ ảnh tham chiếu trong `assets-raw/`; mọi ảnh AI vẽ bù phải có kênh `Alpha` thật (`alphaMin < 255`) và cùng điểm neo `pivot: [0.5, 1.0]`.
2. **Ánh Xạ Tự Động Tương Tác Vật Thể Sang `packages/canvas-primitives`:**
   - Hạt môi trường/nổ ➔ gắn vào `particle-pool` (`32×32px`, `Zero-GC`).
   - Đung đưa/nảy đàn hồi (`squash & stretch` giữ `scaleX * scaleY ≈ 1`) ➔ gắn vào `procedural-motion`.
   - Hào quang nâng cấp & bóng đổ elip dưới chân ➔ gắn vào `lighting-shadow` (`BlendMode add/multiply`).
   - Va chạm nảy bật, cầm vũ khí vào khớp tay (`handSocket`) ➔ gắn vào `physics-and-cues` (`Matter.js`).

---

## 3. Mẫu Code `Node.js ESM` Phân Luồng `assets-raw/` & Lập Kế Hoạch AI Bù File
```javascript
import fs from "node:fs/promises";
import path from "node:path";

export const CUTOUT_RIG_PARTS = Object.freeze([
  "body.png", "head.png", "arm_L.png", "arm_R.png", "leg_L.png", "leg_R.png",
  "eyes_normal.png", "eyes_blink.png", "eyes_happy.png", "eyes_shock.png",
  "mouth_idle.png", "mouth_talk.png", "mouth_cheer.png",
]);

export async function planTwoBranchCartridgeAssets(cartridgeDir, entities = [{ id: "hero_main", branch: "cutout_rig" }]) {
  const missingAiJobs = [];
  for (const ent of entities) {
    const rawDir = path.join(cartridgeDir, "assets-raw", ent.id);
    await fs.mkdir(rawDir, { recursive: true });
    if (ent.branch === "cutout_rig") {
      for (const part of CUTOUT_RIG_PARTS) {
        const fp = path.join(rawDir, "rig_parts", part);
        try { await fs.access(fp); }
        catch { missingAiJobs.push({ entity: ent.id, branch: "A_CUTOUT_RIG", target: `assets-raw/${ent.id}/rig_parts/${part}` }); }
      }
    } else {
      const sheetFp = path.join(cartridgeDir, "public", "assets", `${ent.id}_flipbook.webp`);
      try { await fs.access(sheetFp); }
      catch { missingAiJobs.push({ entity: ent.id, branch: "B_FLIPBOOK_SHEET", target: `public/assets/${ent.id}_flipbook.webp` }); }
    }
  }
  return { entitiesCount: entities.length, missingCount: missingAiJobs.length, missingAiJobs };
}
```

---

## 4. Script `Node.js` Đi Kèm & Danh Sách Nghiệm Thu (`Node CLI & QA Checklist`)
- **Quét nguồn Clone / `assets-raw/` & xuất hồ sơ 2 nhánh + hàng đợi AI bù file:**
  `node "~/.gemini\config\skills\tiktok-game-source-visual-cloner\scripts\audit_and_plan_clone_assets.mjs" --assets-dir <duong_dan_assets_hoac_cartridge> --characters hero_blue,boss_red --pipeline-mode two-branch`
- [x] Phân luồng chính xác **Nhánh A (`Cutout Rig` + `shared-assets/motions/`)** chống biến dạng nhân vật và **Nhánh B (`Flipbook .webp + .json`)** cho hiệu ứng ngắn.
- [x] Bóc tách đầy đủ `6` trụ cột từ YouTube / Livestream / GitHub (Đồ họa gốc, UI, Nhân vật, Hành động, Biểu cảm, Tương tác vật thể) trên `Node.js v24`.
