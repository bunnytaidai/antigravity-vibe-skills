---
name: tiktok-live-game-core-engine
description: "[Kiến Trúc Sư Node.js Logic Core & StreakGuard Chuẩn Master Blueprint (IServerGameModule / NormalizedLiveEvent / 60 TPS)] — Tác dụng: Xây dựng tầng xử lý sự kiện trung tâm và luật chơi Hộp Băng (IServerGameModule) thuần Node.js gồm bộ lọc StreakGuard 2 chế độ (incremental & final_only 4.000ms Quiet Timeout + LRU 5.000 msgId), chuẩn gói tin WsServerEnvelope v1, va chạm vật lý đồng bộ biểu cảm nhân vật và Atomic JsonStore — Kích hoạt: Khi viết logic server-core hoặc luật chơi IServerGameModule cho Game Live TikTok bằng Node.js."
---

# KỸ NĂNG CHUYÊN SÂU: `TIKTOK-LIVE-GAME-CORE-ENGINE` (`NODE.JS` — `STREAKGUARD` & `ISERVERGAMEMODULE` 60 TPS — `version.5.2.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi (`Master Blueprint Server & Gameplay Core`)
- **Tên định danh (`Identifier`):** `tiktok-live-game-core-engine` *(Thuần **`Node.js ESM`** — chuẩn hóa tầng `packages/server-core` và mô-đun luật chơi `games/<slug>/src/server/gameModule`)*
- **Hiểu đơn giản là gì?** Mọi nguồn phát (`TikTok`, `Facebook`, `YouTube`, hoặc `Admin Simulator`) trước khi chạm vào luật chơi đều đi qua **Cửa Ngõ Chuẩn Hóa & Khóa Chống Trùng Tuyệt Đối**, sau đó rót vào khuôn `IServerGameModule` của từng game:
  1. **Chuẩn Hóa Đa Nền Tảng (`NormalizedLiveEvent`):** Chuyển mọi sự kiện `chat`, `gift`, `like`, `share`, `follow`, `member_join` về 1 cấu trúc duy nhất, tự động bọc ảnh đại diện qua `/api/v1/avatar?url=...` (`LRU RAM Cache 300 ảnh`) để vẽ thẳng lên WebGL không lỗi `CORS`.
  2. **Bộ Lọc Chuỗi Quà 2 Chế Độ (`StreakGuard Contract`):**
     - **Khử trùng gói tin `O(1)`:** Lưu `LRU Ring Buffer` chứa `5.000` mã `msgId` gần nhất, chặn đứng gói lặp mạng.
     - **Chế độ `incremental` *(Game PK / Hành động nhanh)*:** Tính ngay `deltaCount = Math.max(0, repeatCount - awardedCount)` theo khóa `${roomId}:${userId}:${giftId}:${groupId}` để nhân vật tung đòn ngay từng cú bấm tay.
     - **Chế độ `final_only` *(Game Gacha / Triệu hồi tổng)*:** Đợi `repeatEnd === true` hoặc **hẹn giờ tĩnh lặng `4.000ms` (`Quiet Timeout`)** mới chốt tổng `deltaCount` 1 lần (không bao giờ mất quà khi TikTok rớt gói cuối!).
  3. **Truyền Tải 2 Tốc Độ Qua `WsServerEnvelope v1`:** Bắn `state_sync` (`1–15 Hz` kèm `seq` tăng dần) cho React HUD và bắn `action_fast` tức thì cho sân khấu `PixiJS 60 FPS`.

---

## 2. 4 Quy Tắc Bắt Buộc Khi Viết Logic Core Trên `Node.js` (`Mandatory Rules`)
1. **Không Bao Giờ Đoán Mò Giá Trị Xu (`Zero Coin Hallucination`):** Nếu `unitCoins` chưa xác định từ gói tin gốc, gán `0` và ghi log kiểm tra chứ tuyệt đối không tự bịa số xu.
2. **Lưu Cấu Hình Bền Vững Bằng `Atomic JsonStore`:** Khi trang `/admin` gọi `PATCH /api/v1/game/config`, bắt buộc ghi ra tệp tạm `.tmp` rồi `fs.rename()` đè sang tệp chính để mất điện đột ngột không làm hỏng file cấu hình.
3. **Đồng Bộ 3 Chiều `Va Chạm ➔ Hành Động ➔ Biểu Cảm (Mood)` Ở Nhịp Cố Định `dt`: `16.67ms`:**
   - Trong `onTick(ctx, deltaMs)` hoặc `physics-and-cues`, khi các thực thể va chạm nhau phải tính phản lực `Knockback`, phát tín hiệu `hitStopMs` và chuyển đổi cảm xúc nhân vật (`calm | hyped | panicked | tired`) cùng bảng điểm `MVP`.
4. **Hàng Đợi Cuốn Chiếu Chống Ngợp Sân Khấu (`8-Hour Endurance Cap`):** Giới hạn cứng `maxVisibleActors` (ví dụ `<= 60`); sự kiện vượt ngưỡng đưa vào `Pending Queue` hoặc gộp cấp (`Tier-Up Merge`) để giữ `Event Loop` `< 5ms` trên `Xeon 24 luồng`.
5. **Chế Độ Giả Lập Quà Offline & Chạy Độc Lập (`MOCK_MODE=true` — Tích hợp `tiktok_live_event_simulator.mjs`):** Mọi server Node.js đều tích hợp sẵn cổng `POST /api/v1/mock-event` (hoặc `/api/mock-event`), gom gói `like/chat` mỗi `100ms` và hỗ trợ phím tắt bàn phím (`1`, `2`, `L`, `R`, `U`) trên màn hình `/admin` hoặc `/overlay` để test ngay ở `localhost` không cần lên Live thật.

---

## 3. Mẫu Triển Khai `StreakGuard` 2 Chế Độ Chuẩn `Node.js ESM` (`Production Pattern`)
```javascript
export class StreakGuard {
  constructor({ mode = "incremental", quietTimeoutMs = 4000, maxDedupSize = 5000, onDispatch } = {}) {
    this.mode = mode; // "incremental" | "final_only"
    this.quietTimeoutMs = quietTimeoutMs;
    this.maxDedupSize = maxDedupSize;
    this.onDispatch = onDispatch ?? (() => {});
    this.seenMsgIds = new Set();
    this.msgRing = [];
    this.streaks = new Map(); // streakKey -> { awardedCount, latestCount, unitCoins, meta, timer }
  }

  isDuplicate(msgId) {
    if (!msgId) return false;
    if (this.seenMsgIds.has(msgId)) return true;
    this.seenMsgIds.add(msgId);
    this.msgRing.push(msgId);
    if (this.msgRing.length > this.maxDedupSize) this.seenMsgIds.delete(this.msgRing.shift());
    return false;
  }

  ingestGift({ msgId, roomId, userId, giftId, groupId = "0", giftType = 1, repeatCount = 1, repeatEnd = false, unitCoins = 0, meta = {} }) {
    if (this.isDuplicate(msgId)) return 0;
    if (giftType !== 1) {
      const count = Math.max(1, repeatCount);
      this.onDispatch({ ...meta, deltaCount: count, deltaCoins: count * unitCoins, totalStreakCount: count, isStreakFinished: true });
      return count;
    }
    const key = `${roomId}:${userId}:${giftId}:${groupId}`;
    const entry = this.streaks.get(key) ?? { awardedCount: 0, latestCount: 0, unitCoins, meta, timer: null };
    entry.latestCount = Math.max(entry.latestCount, repeatCount);
    entry.unitCoins = unitCoins;
    if (entry.timer) clearTimeout(entry.timer);

    const finalize = (keyToClose) => {
      const st = this.streaks.get(keyToClose);
      if (!st) return 0;
      if (st.timer) clearTimeout(st.timer);
      this.streaks.delete(keyToClose);
      const delta = Math.max(0, st.latestCount - st.awardedCount);
      if (delta > 0) {
        this.onDispatch({ ...st.meta, deltaCount: delta, deltaCoins: delta * st.unitCoins, totalStreakCount: st.latestCount, isStreakFinished: true });
      }
      return delta;
    };

    if (this.mode === "incremental") {
      const delta = Math.max(0, entry.latestCount - entry.awardedCount);
      entry.awardedCount += delta;
      this.streaks.set(key, entry);
      if (delta > 0) {
        this.onDispatch({ ...meta, deltaCount: delta, deltaCoins: delta * unitCoins, totalStreakCount: entry.latestCount, isStreakFinished: Boolean(repeatEnd) });
      }
      if (repeatEnd) this.streaks.delete(key);
      else entry.timer = setTimeout(() => this.streaks.delete(key), this.quietTimeoutMs);
      return delta;
    }

    // Chế độ final_only: đợi repeatEnd hoặc Quiet Timeout 4.000ms cứu quà khi rớt gói cuối
    this.streaks.set(key, entry);
    if (repeatEnd) return finalize(key);
    entry.timer = setTimeout(() => finalize(key), this.quietTimeoutMs);
    return 0;
  }
}
```

---

## 4. Script Kiểm Thử Tự Động `Node.js` Đi Kèm & Danh Sách Nghiệm Thu
- **Chạy kiểm định `StreakGuard` (cả 2 chế độ + `Quiet Timeout`) & Va chạm `IServerGameModule`:**
  `node "~/.gemini\config\skills\tiktok-live-game-core-engine\scripts\core_engine_self_test.mjs"`
- [x] `StreakGuard` khử trùng `LRU 5.000 msgId` chuẩn `100%`, tính đúng `deltaCount` ở cả `incremental` lẫn `final_only` (kể cả khi mất gói `repeatEnd`).
- [x] Khuôn `IServerGameModule` tách biệt hoàn toàn luật chơi khỏi hạ tầng mạng `Express / ws`.
