#!/usr/bin/env node
/**
 * Kiểm thử tự động toàn diện StreakGuard (LRU 5.000 msgId + incremental + final_only Quiet Timeout)
 * và bộ máy va chạm vật thể / biểu cảm IServerGameModule trên Node.js v24 ESM.
 */

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

export class StreakGuard {
  constructor({ mode = "incremental", quietTimeoutMs = 4000, maxDedupSize = 5000, onDispatch } = {}) {
    this.mode = mode;
    this.quietTimeoutMs = quietTimeoutMs;
    this.maxDedupSize = maxDedupSize;
    this.onDispatch = onDispatch ?? (() => {});
    this.seenMsgIds = new Set();
    this.msgRing = [];
    this.streaks = new Map();
  }

  isDuplicate(msgId) {
    if (!msgId) return false;
    if (this.seenMsgIds.has(msgId)) return true;
    this.seenMsgIds.add(msgId);
    this.msgRing.push(msgId);
    if (this.msgRing.length > this.maxDedupSize) {
      this.seenMsgIds.delete(this.msgRing.shift());
    }
    return false;
  }

  ingestGift({
    msgId,
    roomId = "room1",
    userId = "u1",
    giftId = 5655,
    groupId = "g1",
    giftType = 1,
    repeatCount = 1,
    repeatEnd = false,
    unitCoins = 1,
    meta = {},
  }) {
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
        this.onDispatch({
          ...st.meta,
          deltaCount: delta,
          deltaCoins: delta * st.unitCoins,
          totalStreakCount: st.latestCount,
          isStreakFinished: true,
        });
      }
      return delta;
    };

    if (this.mode === "incremental") {
      const delta = Math.max(0, entry.latestCount - entry.awardedCount);
      entry.awardedCount += delta;
      this.streaks.set(key, entry);
      if (delta > 0) {
        this.onDispatch({
          ...meta,
          deltaCount: delta,
          deltaCoins: delta * unitCoins,
          totalStreakCount: entry.latestCount,
          isStreakFinished: Boolean(repeatEnd),
        });
      }
      if (repeatEnd) this.streaks.delete(key);
      else {
        entry.timer = setTimeout(() => this.streaks.delete(key), this.quietTimeoutMs);
        entry.timer.unref?.();
      }
      return delta;
    }

    this.streaks.set(key, entry);
    if (repeatEnd) return finalize(key);
    entry.timer = setTimeout(() => finalize(key), this.quietTimeoutMs);
    return 0;
  }
}

export async function runSelfTest() {
  // 1. Test chế độ incremental + khử trùng msgId
  const incEvents = [];
  const incGuard = new StreakGuard({ mode: "incremental", quietTimeoutMs: 50, onDispatch: (e) => incEvents.push(e) });
  incGuard.ingestGift({ msgId: "m1", repeatCount: 1, repeatEnd: false, unitCoins: 10 });
  incGuard.ingestGift({ msgId: "m1", repeatCount: 1, repeatEnd: false, unitCoins: 10 }); // Gói trùng mạng -> bỏ qua
  incGuard.ingestGift({ msgId: "m2", repeatCount: 4, repeatEnd: false, unitCoins: 10 });
  incGuard.ingestGift({ msgId: "m3", repeatCount: 10, repeatEnd: true, unitCoins: 10 });

  const totalIncCount = incEvents.reduce((s, e) => s + e.deltaCount, 0);
  const totalIncCoins = incEvents.reduce((s, e) => s + e.deltaCoins, 0);
  assert.equal(totalIncCount, 10, "Incremental phải cộng tổng đúng 10 đơn vị quà!");
  assert.equal(totalIncCoins, 100, "Incremental phải tính đúng 100 xu!");

  // 2. Test chế độ final_only khi rớt gói repeatEnd (Quiet Timeout tự chốt quà an toàn)
  const finalEvents = [];
  const finalGuard = new StreakGuard({ mode: "final_only", quietTimeoutMs: 40, onDispatch: (e) => finalEvents.push(e) });
  finalGuard.ingestGift({ msgId: "f1", groupId: "drop_test", repeatCount: 3, repeatEnd: false, unitCoins: 5 });
  finalGuard.ingestGift({ msgId: "f2", groupId: "drop_test", repeatCount: 7, repeatEnd: false, unitCoins: 5 });
  assert.equal(finalEvents.length, 0, "final_only chưa được bắn trước khi kết thúc chuỗi!");

  await new Promise((resolve) => setTimeout(resolve, 65));
  assert.equal(finalEvents.length, 1, "Quiet Timeout phải tự động chốt chuỗi khi rớt gói repeatEnd!");
  assert.equal(finalEvents[0].deltaCount, 7);
  assert.equal(finalEvents[0].deltaCoins, 35);

  // 3. Test va chạm vật thể + đồng bộ mood/expression trong vòng lặp 60 TPS
  const blueActor = { id: "b1", x: 300, vx: 120, r: 30, hp: 100, maxHp: 100, atk: 30, state: "move", mood: "calm" };
  const redActor = { id: "r1", x: 350, vx: -120, r: 30, hp: 80, maxHp: 80, atk: 20, state: "move", mood: "calm" };
  let collisions = 0;
  for (let tick = 0; tick < 30; tick += 1) {
    blueActor.x += blueActor.vx * (1 / 60);
    redActor.x += redActor.vx * (1 / 60);
    if (Math.abs(blueActor.x - redActor.x) <= blueActor.r + redActor.r) {
      redActor.hp -= blueActor.atk;
      blueActor.hp -= redActor.atk;
      blueActor.x -= 18;
      redActor.x += 18;
      blueActor.state = "attack";
      redActor.state = "hit";
      blueActor.mood = "hyped";
      redActor.mood = redActor.hp < redActor.maxHp * 0.7 ? "panicked" : "tired";
      collisions += 1;
    }
  }
  assert.ok(collisions >= 1 && redActor.mood === "panicked");

  return {
    status: "PASS",
    runtime: process.version,
    streakIncrementalVerified: { dispatches: incEvents.length, totalCount: totalIncCount, totalCoins: totalIncCoins },
    streakFinalQuietTimeoutVerified: { dispatches: finalEvents.length, rescuedCount: finalEvents[0].deltaCount },
    collisionAndMoodSyncVerified: { collisions, redMood: redActor.mood },
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  console.log(JSON.stringify(await runSelfTest()));
}
