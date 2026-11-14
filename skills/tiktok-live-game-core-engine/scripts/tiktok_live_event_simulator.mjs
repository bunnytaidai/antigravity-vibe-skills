#!/usr/bin/env node
/**
 * Pure Node.js (v24 ESM) TikTok Live Interactive Game Event Aggregator & Stress Simulator.
 * Designed for tiktok-live-connector + ws + HTML5 Canvas / PixiJS / Phaser (9:16 1080x1920 OBS).
 */

import fs from "node:fs/promises";
import { performance } from "node:perf_hooks";

export const TIKTOK_SAFE_ZONE_1080X1920 = Object.freeze({
  resolution: { width: 1080, height: 1920, aspect: "9:16" },
  safeZones: {
    notificationToastXYWH: [60, 180, 900, 110],
    hpBarRedVsBlueXYWH: [60, 310, 880, 48],
    characterArenaXYWH: [40, 380, 890, 880],
  },
  occludedByTikTokUi: {
    topStreamerHeaderYMax: 165,
    rightActionButtonsXMin: 940,
    bottomLiveChatYMin: 1320,
  },
});

export class StreakSafeLiveAggregator {
  constructor() {
    this.activeStreaks = new Map();
    this.pendingLikes = 0;
    this.teamVotes = { blue: 0, red: 0 };
    this.queuedActions = [];
  }

  ingestLike(likeCount = 1) {
    this.pendingLikes += Math.max(0, Number(likeCount) || 0);
  }

  ingestComment(nickname, comment) {
    const cmd = String(comment || "").trim().toLowerCase();
    if (["1", "blue", "xanh", "!xanh"].includes(cmd)) {
      this.teamVotes.blue++;
      this.queuedActions.push({ type: "JOIN_OR_SHOOT", team: "blue", user: nickname });
      return "blue";
    }
    if (["2", "red", "do", "đỏ", "!do"].includes(cmd)) {
      this.teamVotes.red++;
      this.queuedActions.push({ type: "JOIN_OR_SHOOT", team: "red", user: nickname });
      return "red";
    }
    return null;
  }

  /** Matches tiktok-live-connector gift payload shape ({ userId, nickname, giftId, giftName, diamondCount, repeatCount, giftType, repeatEnd }) */
  ingestGift(data) {
    const key = `${data.userId}:${data.giftId}`;
    const isStreakable = data.giftType === 1;
    let delta = 0;

    if (isStreakable) {
      const prev = this.activeStreaks.get(key) ?? 0;
      delta = Math.max(0, data.repeatCount - prev);
      if (data.repeatEnd) this.activeStreaks.delete(key);
      else this.activeStreaks.set(key, data.repeatCount);
    } else {
      delta = Math.max(1, data.repeatCount ?? 1);
    }

    if (delta > 0) {
      const diamondsDelta = (data.diamondCount ?? 1) * delta;
      const fxTier = diamondsDelta >= 500 ? "ultimate" : diamondsDelta >= 50 ? "heavy" : "light";
      this.queuedActions.push({
        type: "GIFT_TRIGGER",
        user: data.nickname,
        gift: data.giftName,
        countDelta: delta,
        diamondsDelta,
        fxTier,
      });
    }
    return delta;
  }

  flushTick() {
    const batch = {
      likesDelta: this.pendingLikes,
      teamVotes: { ...this.teamVotes },
      actionsCount: this.queuedActions.length,
      actions: this.queuedActions,
    };
    this.pendingLikes = 0;
    this.queuedActions = [];
    return batch;
  }
}

export async function runSimulationNode(stressEvents = 500, exportPath = null) {
  const t0 = performance.now();
  const agg = new StreakSafeLiveAggregator();

  // Verify streakable Rose combo x1 -> x4 -> x10 counts exact 10 (never 15!)
  const d1 = agg.ingestGift({ userId: "u1", nickname: "Tho_Viewer", giftId: 5655, giftName: "Rose", diamondCount: 1, repeatCount: 1, giftType: 1, repeatEnd: false });
  const d2 = agg.ingestGift({ userId: "u1", nickname: "Tho_Viewer", giftId: 5655, giftName: "Rose", diamondCount: 1, repeatCount: 4, giftType: 1, repeatEnd: false });
  const d3 = agg.ingestGift({ userId: "u1", nickname: "Tho_Viewer", giftId: 5655, giftName: "Rose", diamondCount: 1, repeatCount: 10, giftType: 1, repeatEnd: true });
  if (d1 + d2 + d3 !== 10) {
    throw new Error(`Streak deduplication failed: ${d1}+${d2}+${d3} !== 10`);
  }

  // Non-streakable Ultimate gift (Galaxy = 1000 diamonds)
  const dBig = agg.ingestGift({ userId: "u2", nickname: "VIP_NodeJS", giftId: 5879, giftName: "Galaxy", diamondCount: 1000, repeatCount: 1, giftType: 0, repeatEnd: true });
  if (dBig !== 1) throw new Error("Non-streakable gift failed");

  for (let i = 0; i < stressEvents; i++) {
    agg.ingestLike(15);
    agg.ingestComment(`viewer_${i}`, i % 2 === 0 ? "1" : "2");
  }

  const batch = agg.flushTick();
  const elapsedMs = Number((performance.now() - t0).toFixed(2));

  const summary = {
    ok: true,
    runtime: `Node.js ${process.version}`,
    streakComboTest: { packetsSent: [1, 4, 10], exactCountedRoses: d1 + d2 + d3 },
    stressEventsProcessed: stressEvents,
    likesAggregated: batch.likesDelta,
    teamVotes: batch.teamVotes,
    batchedActions: batch.actionsCount,
    processingTimeMs: elapsedMs,
    safeZoneSpec: TIKTOK_SAFE_ZONE_1080X1920,
  };

  if (exportPath) {
    await fs.writeFile(exportPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  }
  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--stress-events");
  const stressEvents = idx >= 0 && args[idx + 1] ? Number(args[idx + 1]) : 500;
  const expIdx = args.indexOf("--export-spec");
  const exportPath = expIdx >= 0 && args[expIdx + 1] ? args[expIdx + 1] : null;
  const res = await runSimulationNode(stressEvents, exportPath);
  console.log(JSON.stringify(res, null, 2));
}

if (process.argv[1]?.endsWith("tiktok_live_event_simulator.mjs")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
