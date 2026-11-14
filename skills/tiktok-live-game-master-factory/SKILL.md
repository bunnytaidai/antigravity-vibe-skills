---
name: tiktok-live-game-master-factory
description: "[Đại Tổng Tư Lệnh Node.js Toàn Quy Trình Sản Xuất Game Live TikTok (Clone Đa Nguồn + Master Blueprint Monorepo Cartridge Từ A-Z)] — Tác dụng: Skill To Tổng Hợp điều phối khép kín 7 bước làm Game Live TikTok bằng Node.js cho cả 2 đầu vào (Link YouTube/Livestream/GitHub hoặc Biểu mẫu Đặt hàng 6 mục), tự động gọi phối hợp bộ 4 Skills chuyên sâu (Framework Cartridge, Cloner 2 nhánh + AI bù file, Core StreakGuard, GUI Hybrid React 19 + PixiJS v8) và kiểm định qua 4 cổng nghiệm thu phát sóng OBS — Kích hoạt: Khi muốn làm trọn gói từ A-Z bất kỳ tựa Game Live TikTok nào hoặc mở rộng thêm game mới vào live-game-framework."
---

# KỸ NĂNG TỔNG HỢP TOÀN QUY TRÌNH: `TIKTOK-LIVE-GAME-MASTER-FACTORY` (`MASTER BLUEPRINT + MULTI-SOURCE CLONE ORCHESTRATOR` — `version.5.2.0.0`)

## 1. Bức Tranh Tổng Thể: 1 Skill To Chỉ Huy Trọn Gói Từ A Đến Z (`Master Overview`)
- **Tên định danh (`Identifier`):** `tiktok-live-game-master-factory` *(Đại Tổng Tư Lệnh thống nhất `100%` quy trình sản xuất Game Livestream công nghiệp bằng **`Node.js >= 22/24 ESM`**)*
- **Hiểu đơn giản là gì?** Dù bạn bắt đầu từ **1 đường link mẫu (YouTube / Livestream / GitHub)** hay từ **Biểu mẫu Đặt hàng 6 mục**, bạn chỉ cần gọi duy nhất **Skill To Tổng Hợp** này. Nó tự động điều phối **4 Skills thành phần** lắp vào kiến trúc **`live-game-framework` (`Immutable Core` + `Pluggable Cartridge`)**:
  1. `tiktok-live-framework-cartridge-architect` ➔ Giữ vững lõi bất biến `packages/*` (`Express + ws + Avatar Proxy + Clock Sync`) và nhân bản hộp băng mới `games/<game-slug>/`.
  2. `tiktok-game-source-visual-cloner` *(cùng `computer-vision-opencv` & `game-character-vfx-asset-pipeline`)* ➔ Bóc tách nguồn gốc vào `assets-raw/`, tách **Nhánh A (`Cutout Rig` + `ModularActor2D`)** / **Nhánh B (`Flipbook .webp`)** và gọi AI vẽ bù `100%` file thiếu.
  3. `tiktok-live-game-core-engine` *(đã tích hợp trọn bộ giả lập Offline `MOCK_MODE=true` & `StreakGuard`)* ➔ Lắp luật chơi `IServerGameModule` hưởng sẵn bộ lọc `StreakGuard` (`incremental` / `final_only 4s`).
  4. `tiktok-live-game-gui-builder` ➔ Lắp giao diện 2 làn **Làn chậm `React 19 + Zustand` (`/admin` & `/overlay` Safe-Zone)** ↔ **Làn nhanh `PixiJS v8 60 FPS` (`5 canvas-primitives`)**.

---

## 2. Quy Trình Khép Kín 7 Bước Chuẩn Công Nghiệp (`End-to-End 7-Step Master Pipeline`)
1. **BƯỚC 1 — Tiếp Nhận Đầu Vào & Khóa Hợp Đồng Đặt Hàng (`Intake & 6-Item Order Lock`):**
   - Kích hoạt `strict-input-scope-guard` chốt rõ: **(A) Nguồn Clone** *(link YouTube / Livestream / GitHub)* hoặc **(B) Đặc tả 6 mục** *(Slug & Cổng `30xx`, Core Loop, Ánh xạ Comment/Like/Gift, Luật thắng thua, Nhóm `canvas-primitives` cần bật, Thư mục `assets-raw/`)*.
2. **BƯỚC 2 — Kiểm Tra Khung Monorepo & Nhân Bản Hộp Băng (`Framework & Cartridge Init`):**
   - Nếu dự án chưa có `live-game-framework/`, tự động khởi tạo chuẩn `npm workspaces` (`packages/*`, `shared-assets/`, `MASTER_GAME_BLUEPRINT.md`).
   - Nhân bản `games/_cartridge-template` sang `games/<game-slug>/` (hỗ trợ mặc định `TypeScript .ts/.tsx` hoặc `--lang js`), khóa bảo vệ không chạm vào các game cũ.
3. **BƯỚC 3 — Bóc Tách Đồ Họa Nguồn Mẫu & Đóng Gói 2 Nhánh + AI Bù File (`Asset Synthesis`):**
   - Quét link mẫu hoặc `3–4` ảnh trong `games/<slug>/assets-raw/<entity>/` ➔ tách mảnh `Cutout Rig` ghép `shared-assets/motions/` (cho nhân vật) và `Flipbook .webp + .json` (cho hiệu ứng) ➔ dùng AI sinh bù mọi mảnh/biểu cảm còn thiếu sát `artStyleDna` gốc.
4. **BƯỚC 4 — Lập Trình Luật Chơi Máy Chủ (`Server Cartridge Implementation`):**
   - Điền luật chơi vào `games/<slug>/src/server/gameModule` (`IServerGameModule`), cấu hình `streakDispatchMode` (`incremental` hoặc `final_only`) và lưu cấu hình qua `Atomic JsonStore`.
5. **BƯỚC 5 — Lắp Ráp Sân Khấu `60 FPS` & Giao Diện `React HUD / Admin` (`Dual-Lane Wiring`):**
   - Lắp `src/world-canvas/worldController` (`ICanvasWorldController`, chỉ `import` đúng các mô-đun trong `5 canvas-primitives` đã chọn, cài đủ `dispose()`) và `src/hud-react/hudExtension` (`SafeZoneFrame` né Top `8%`, Right `14%`, Bottom `27%`; khóa âm thanh `?audio=primary` / `?muted=1`).
6. **BƯỚC 6 — Kiểm Toán Khớp Nối Liên Tầng & Tính Bất Biến Lõi (`Cross-Wiring & Immutability Audit`):**
   - Đối chiếu `game.manifest.json` ↔ `public/assets/` ↔ `src/server/` ↔ `src/world-canvas/` đảm bảo `0` đường dẫn gãy và xác minh mã băm `SHA-256` của `packages/*` nguyên vẹn `100%`.
7. **BƯỚC 7 — Vượt Qua 4 Cổng Nghiệm Thu Phát Sóng OBS (`4-Gate Broadcast Verification`):**
   - **(Cổng 1)** `node --test` đạt `Exit Code: 0` trên `StreakGuard`, `REST v1`, `WS Envelope`, `Avatar CORS Proxy` và `cartridge.test.mjs`.
   - **(Cổng 2)** `<CanvasStageHost />` giữ đúng `renderCount === 1` khi `Zustand HUD` cập nhật điểm liên tục.
   - **(Cổng 3)** Bơm chịu tải `/api/v1/sim/stress` (`50 sự kiện/giây`) giữ vững `60 FPS` và hàm `dispose()` giải phóng sạch bộ nhớ cho phiên Live `8 tiếng`.
   - **(Cổng 4)** Kiểm toán phạm vi tệp (`0%` tác động ngoài vùng cho phép).

---

## 3. Cây Thư Mục Toàn Cục Do Skill To Điều Phối (`Master Workspace Blueprint`)
```text
live-game-framework/                  # [MONOREPO GỐC — npm workspaces: ["packages/*", "games/*"]]
├── MASTER_GAME_BLUEPRINT.md          # Bản đặc tả chuẩn gốc để AI Agent luôn bám sát
├── shared-assets/                    # Biểu cảm (expressions/), chuyển động (motions/), hạt VFX & âm thanh dùng chung
├── packages/                         # [LÕI CỐ ĐỊNH — DÙNG LẠI 100%, BẢO VỆ BẰNG SHA-256 LOCK]
│   ├── shared-contracts/  server-core/  client-core/  ui-kit-react/
│   └── canvas-primitives/            # particle-pool | procedural-motion | lighting-shadow | modular-actor-2d | physics-and-cues
└── games/                            # [DANH SÁCH HỘP BĂNG TỪNG GAME]
    └── <game-slug>/                  # Tựa game mới được sản xuất / clone tự động
        ├── game.manifest.json        # Cổng chạy, chế độ StreakGuard, nhóm primitives bật & ánh xạ Quà/Comment
        ├── assets-raw/ & public/assets/ # Ảnh mẫu gốc + Cutout Rig / Atlas .webp + clone_fidelity_blueprint.json
        ├── src/server/               # gameModule (IServerGameModule)
        ├── src/world-canvas/         # worldController (ICanvasWorldController 60 FPS + dispose())
        ├── src/hud-react/            # hudExtension (SafeZoneFrame + AdminCustomPanelSlot) & hud_theme_layout.json
        └── tests/cartridge.test.mjs  # Bài kiểm thử tự động riêng của game (node --test)
```

---

## 4. Công Cụ Tổng Chỉ Huy `Node.js` Đi Kèm & Danh Sách Nghiệm Thu
- **Sản xuất & ghép nối trọn gói 1 tựa Game mới vào `live-game-framework` (kèm kiểm định 4 cổng):**
  `node "~/.gemini\config\skills\tiktok-live-game-master-factory\scripts\wire_tiktok_live_game_workspace.mjs" --project-dir <duong_dan_framework> --game-slug <ten-game> --port 3001 --primitives particle-pool,modular-actor-2d,physics-and-cues --source-url "<link_youtube_hoac_github>" --verify-wiring`
- *(Tùy chọn)* Thêm `--lang js` nếu muốn sinh Cartridge thuần JavaScript `.mjs/.jsx`, hoặc `--mode standalone` nếu muốn dựng thư mục lẻ ngoài Monorepo.
- [x] Khớp nối thông suốt `100%` toàn bộ dây chuyền `5 Skills` bằng `Node.js v24` (`Exit Code: 0`).
- [x] Đảm bảo `packages/*` bất biến `100%` khi đẻ thêm game thứ `2, 3, ..., N` và sẵn sàng phát sóng ngay trên `OBS Browser Source (1080×1920)`.
