#!/usr/bin/env node
/**
 * Sinh & kiểm định bố cục Dual-Lane Hybrid GUI/UI (React 19 + Zustand <-> PixiJS v8)
 * theo chuẩn tỷ lệ vùng cấm Master Blueprint 1080x1920 (Top 8%, Right 14%, Bottom 27%).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

export const MASTER_SAFEZONE_1080X1920 = Object.freeze({
  width: 1080,
  height: 1920,
  minSafeY: Math.ceil(1920 * 0.08),        // 154px
  maxSafeX: Math.floor(1080 * (1 - 0.14)), // 928px
  maxSafeY: Math.floor(1920 * (1 - 0.27)), // 1401px
});

export const DEFAULT_SAFE_HUD = Object.freeze([
  { widgetId: "top_gift_combo_toast", lane: "react_hud_15hz", role: "Banner nổ quà Combo động (x2..x99)", x: 48, y: 168, w: 860, h: 92, zIndex: 30 },
  { widgetId: "dual_faction_hp_bar", lane: "react_hud_15hz", role: "Thanh máu đối kháng PK + lớp máu trễ", x: 48, y: 274, w: 864, h: 64, zIndex: 25 },
  { widgetId: "match_timer_badge", lane: "react_hud_15hz", role: "Đồng hồ ván đấu đồng bộ getSyncedServerTime()", x: 410, y: 264, w: 140, h: 84, zIndex: 28 },
  { widgetId: "canvas_stage_host", lane: "pixijs_60fps_memo_once", role: "Sân khấu PixiJS v8 mount đúng 1 lần (renderCount === 1)", x: 40, y: 356, w: 876, h: 820, zIndex: 10 },
  { widgetId: "gift_action_legend_dock", lane: "react_hud_15hz", role: "Bảng chỉ dẫn Quà tặng & Mã lệnh Comment", x: 44, y: 1192, w: 868, h: 190, zIndex: 25 },
]);

export function auditHudSafeZone(widgets = DEFAULT_SAFE_HUD) {
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

export async function buildHudLayoutFile(outDir) {
  const { ok, violations } = auditHudSafeZone(DEFAULT_SAFE_HUD);
  if (!ok) {
    throw new Error(`Bố cục GUI/UI vi phạm vùng an toàn Master Blueprint: ${violations.join("; ")}`);
  }

  const resolvedOut = path.resolve(outDir);
  await fs.mkdir(resolvedOut, { recursive: true });

  const payload = {
    runtime: "nodejs-esm",
    architecture: "dual-lane-hybrid-react19-zustand-pixijs8",
    canvasResolution: [1080, 1920],
    aspectRatio: "9:16",
    safeZoneVerified: true,
    safeZoneBounds: MASTER_SAFEZONE_1080X1920,
    debugOverlayQuery: "?debug=safezone",
    audioRouting: {
      obsOverlayPrimary: "/overlay?audio=primary",
      adminIframeMuted: "/overlay?muted=1",
      duckingDb: -10,
      duckingDurationMs: 600,
    },
    canvasStageMemoRenderCount: 1,
    themeTokens: {
      "--faction-blue": "#2563eb",
      "--faction-red": "#e11d48",
      "--ghost-damage-bar": "#fef08a",
      "--hud-gold": "#f59e0b",
      "--panel-glass": "rgba(15, 23, 42, 0.78)",
    },
    widgets: DEFAULT_SAFE_HUD,
  };

  const fp = path.join(resolvedOut, "hud_theme_layout.json");
  await fs.writeFile(fp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { status: "PASS", runtime: process.version, layoutFile: fp, widgetsCount: DEFAULT_SAFE_HUD.length };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { values } = parseArgs({ options: { out: { type: "string" } } });
  if (!values.out) {
    console.error("Thiếu tham số --out");
    process.exit(1);
  }
  console.log(JSON.stringify(await buildHudLayoutFile(values.out)));
}
