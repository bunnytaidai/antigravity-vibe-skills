---
name: tiktok-live-framework-cartridge-architect
description: "[Kiến Trúc Sư Khuôn Mẫu Monorepo & Hộp Băng Game Livestream Đa Kịch Bản (Master Blueprint Node.js + React 19 + PixiJS v8)] — Tác dụng: Khởi tạo và bảo vệ bộ khung chuẩn gốc live-game-framework (npm workspaces, packages/* lõi cố định, shared-assets/*) và nhân bản nhanh từng tựa game mới thành Hộp Băng độc lập (games/<slug>/) theo đúng 3 khuôn ổ cắm IServerGameModule, ICanvasWorldController, IReactGameExtension kèm 5 nhóm hoạt ảnh gốc tùy chọn — Kích hoạt: Khi dựng khung nền sản xuất hàng loạt game Livestream hoặc tạo game mới theo khuôn mẫu Master Blueprint."
---

# KỸ NĂNG CHUYÊN SÂU: `TIKTOK-LIVE-FRAMEWORK-CARTRIDGE-ARCHITECT` (`NODE.JS MONOREPO & PLUGGABLE CARTRIDGE` — `version.5.2.0.0`)

## 1. Triết Lý Cốt Lõi: Lõi Bất Biến & Hộp Băng Lắp Ghép (`Master Blueprint Overview`)
- **Tên định danh (`Identifier`):** `tiktok-live-framework-cartridge-architect` *(Chuẩn hóa từ `Master Blueprint v4.0.1.0` trên nền `Node.js >= 22/24 ESM` + `npm workspaces`)*
- **Hiểu đơn giản là gì?** Khi sản xuất `10–20` tựa game TikTok/FB/YouTube Live khác nhau, hạ tầng kỹ thuật bên dưới luôn giống nhau `100%`. Kỹ năng này tách dự án thành **2 vùng độc lập tuyệt đối**:
  1. **Lõi Cố Định (`Immutable Framework Core` — Viết 1 lần tại `packages/*` & `shared-assets/`, CẤM SỬA khi làm game mới):**
     - `packages/shared-contracts`: Hợp đồng `NormalizedLiveEvent`, `WsServerEnvelope v1` (`seq`, `serverTs`), `REST API v1` và 3 giao diện Hộp băng.
     - `packages/server-core`: Máy chủ `Node.js` (`Express + ws + Zod`), `tiktok-live-connector`, bộ lọc `StreakGuard` (`LRU 5.000 msgId` + khóa Combo `4s`), `Atomic JsonStore` và cổng `/api/v1/avatar` (`LRU RAM Cache 300 ảnh` trị dứt điểm lỗi `CORS` trên WebGL).
     - `packages/client-core`: `WS Auto-Reconnect`, đồng bộ lệch giờ `Clock Offset Sync (10s)`, `Zustand Core Store`, `Imperative Action RingBuffer` và `Howler.js Audio Ducking (-10dB)`.
     - `packages/ui-kit-react`: Vỏ quản trị `/admin` (`AdminStudioShell`), khung vùng an toàn `SafeZoneFrame (1080×1920)` và thẻ `GiftToast / Leaderboard`.
     - `packages/canvas-primitives`: **5 nhóm hoạt ảnh `PixiJS v8` tùy chọn** (`particle-pool`, `procedural-motion`, `lighting-shadow`, `modular-actor-2d`, `physics-and-cues`) — game nào cần nhóm nào chỉ `import` đúng nhóm đó.
  2. **Hộp Băng Từng Game (`Pluggable Game Cartridge` tại `games/<game-slug>/`):**
     - Nhân bản từ `games/_cartridge-template/`, chỉ điền đúng **3 mảnh ghép**: **(1) Luật chơi Server (`IServerGameModule`)**, **(2) Sân khấu `60 FPS` (`ICanvasWorldController`)**, và **(3) Khung điểm đặc thù (`IReactGameExtension`)**.

---

## 2. 4 Quy Tắc Kiến Trúc Bất Di Bất Dịch (`Mandatory Framework Rules`)
1. **Rào Chắn Bảo Toàn Lõi (`Zero Core Mutation When Adding Games`):**
   - Khi tạo game thứ `2, 3, ..., N`, chỉ được thao tác bên trong `games/<game-slug>/` (và thêm tài nguyên dùng chung vào `shared-assets/` nếu cần). Nghiêm cấm sửa đổi `packages/*` làm hỏng các game cũ; kiểm chứng tự động bằng cờ `--audit-immutability`.
2. **Chuẩn Cổng Giao Tiếp `REST API v1` & `WsServerEnvelope v1`:**
   - Mọi game dùng chung đường dẫn: `GET /api/v1/health`, `POST /api/v1/session/connect|disconnect`, `GET|PATCH /api/v1/game/config`, `POST /api/v1/game/command`, `POST /api/v1/sim/inject|stress`, `GET /api/v1/avatar?url=...`.
   - Khung gói tin `/ws` bắt buộc có `{ v: 1, seq, serverTs, channel: 'lifecycle'|'state_sync'|'action_fast'|'hud_event'|'audio_cue', type, payload }` kèm `clock_ping / clock_pong` mỗi `10 giây` tính `getSyncedServerTime()`.
3. **Khóa Âm Thanh Đơn Kênh & Chịu Tải Phiên Live `8 Tiếng` (`Endurance Standard`):**
   - Chỉ `/overlay?audio=primary` trên OBS được phát tiếng; khung xem trước `<iframe>` trong `/admin` bắt buộc gắn `?muted=1` chống vọng âm kép. Mọi `ICanvasWorldController` phải cài đặt `dispose()` dọn sạch `Texture`, `Particle`, `Timer` và `Matter.js Body`.
4. **Hỗ Trợ Song Song `TypeScript (.ts/.tsx)` & `JavaScript ESM (.mjs/.jsx + JSDoc)`:**
   - Mặc định sinh hợp đồng `.ts/.tsx` chặt chẽ cho AI Agent, đồng thời hỗ trợ cờ `--lang js` nếu người dùng muốn viết thuần JavaScript chạy trực tiếp trên `Node.js v24`.

---

## 3. Mẫu Hợp Đồng 3 Ổ Cắm Hộp Băng Game (`Pluggable Cartridge Contract`)
```typescript
export interface IServerGameModule<TPublicState = Record<string, unknown>, TConfig = Record<string, unknown>, TFastAction = unknown> {
  readonly gameId: string;
  createInitialState(config: TConfig): TPublicState;
  onLiveEvent(ctx: IGameServerContext<TPublicState, TConfig, TFastAction>, event: NormalizedLiveEvent): void;
  onTick?(ctx: IGameServerContext<TPublicState, TConfig, TFastAction>, deltaMs: number): void;
  onAdminCommand?(ctx: IGameServerContext<TPublicState, TConfig, TFastAction>, cmd: { action: string; data?: unknown }): void;
}

export interface ICanvasWorldController<TPublicState = Record<string, unknown>, TFastAction = unknown> {
  mount(stage: unknown, services: Record<string, unknown>): Promise<void>;
  onStateSync(nextState: TPublicState): void;
  onFastAction(action: TFastAction): void;
  onFrameTick(deltaSeconds: number, syncedServerNowMs: number): void;
  dispose(): void;
}

export interface IReactGameExtension<FC = unknown> {
  OverlayHudSlot: FC;
  AdminCustomPanelSlot?: FC;
}
```

---

## 4. Biểu Mẫu Đặt Hàng 6 Mục & Công Cụ CLI `Node.js` Đi Kèm (`CLI & QA Checklist`)
- **6 thông tin đầu vào chuẩn khi tạo Hộp băng mới:** `(1) Slug & Cổng 30xx`, `(2) Core Loop`, `(3) Ánh xạ Comment/Like/Gift`, `(4) Luật tính điểm`, `(5) Tích chọn từ 5 nhóm canvas-primitives`, `(6) Thư mục assets-raw/ (3–4 ảnh mẫu/nhóm)`.
- **Khởi tạo bộ khung Monorepo gốc:**
  `node "~/.gemini\config\skills\tiktok-live-framework-cartridge-architect\scripts\scaffold_framework_or_cartridge.mjs" --init-framework <duong_dan_framework>`
- **Nhân bản nhanh 1 Hộp băng Game mới & kiểm toán bất biến `packages/*`:**
  `node "~/.gemini\config\skills\tiktok-live-framework-cartridge-architect\scripts\scaffold_framework_or_cartridge.mjs" --framework-dir <duong_dan_framework> --create-game <game-slug> --port 3001 --primitives particle-pool,modular-actor-2d --audit-immutability`
- [x] Bảo toàn `100%` mã băm `SHA-256` của `packages/*` khi thêm game mới (`0` rò rỉ logic riêng vào lõi chung).
- [x] Mỗi Cartridge tạo ra có sẵn đủ `game.manifest.json`, `assets-raw/`, `src/server/`, `src/world-canvas/`, `src/hud-react/` và `tests/`.
