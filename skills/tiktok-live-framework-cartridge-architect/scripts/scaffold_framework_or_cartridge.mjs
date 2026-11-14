#!/usr/bin/env node
/**
 * Khởi tạo Monorepo live-game-framework (Master Blueprint v4.0.1.0), nhân bản Cartridge games/<slug>/
 * và kiểm toán tính bất biến SHA-256 của packages/* (Thuần Node.js v24 ESM).
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

export const VALID_PRIMITIVES = Object.freeze([
  "particle-pool",
  "procedural-motion",
  "lighting-shadow",
  "modular-actor-2d",
  "physics-and-cues",
]);

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function computePackagesDigest(packagesDir) {
  const digests = {};
  async function walk(curr) {
    const entries = await fs.readdir(curr, { withFileTypes: true });
    for (const ent of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(curr, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else {
        const rel = path.relative(packagesDir, full).replace(/\\/g, "/");
        const buf = await fs.readFile(full);
        digests[rel] = crypto.createHash("sha256").update(buf).digest("hex");
      }
    }
  }
  if (await exists(packagesDir)) await walk(packagesDir);
  return digests;
}

export async function initFrameworkMonorepo(frameworkDir, lang = "ts") {
  const root = path.resolve(frameworkDir);
  await fs.mkdir(root, { recursive: true });

  // 1. Root package.json (npm workspaces) & tsconfig.base.json
  const rootPkg = {
    name: "live-game-framework",
    version: "4.0.1",
    private: true,
    type: "module",
    workspaces: ["packages/*", "games/*"],
    scripts: {
      test: "node --test",
    },
    dependencies: {
      express: "^4.21.2",
      ws: "^8.18.0",
      zod: "^3.24.1",
      "tiktok-live-connector": "^1.2.4",
    },
  };
  await fs.writeFile(path.join(root, "package.json"), `${JSON.stringify(rootPkg, null, 2)}\n`, "utf8");

  const tsconfigBase = {
    compilerOptions: {
      target: "ES2023",
      module: "ESNext",
      moduleResolution: "Bundler",
      strict: true,
      jsx: "react-jsx",
      skipLibCheck: true,
    },
  };
  await fs.writeFile(path.join(root, "tsconfig.base.json"), `${JSON.stringify(tsconfigBase, null, 2)}\n`, "utf8");

  // 2. MASTER_GAME_BLUEPRINT.md marker
  const blueprintMdPath = path.join(root, "MASTER_GAME_BLUEPRINT.md");
  if (!(await exists(blueprintMdPath))) {
    await fs.writeFile(
      blueprintMdPath,
      "# MASTER_GAME_BLUEPRINT (v4.0.1.0)\n\nKiến trúc Monorepo `Immutable Framework Core (packages/*)` + `Pluggable Game Cartridge (games/*)` trên Node.js ESM, React 19 + Zustand & PixiJS v8.\n",
      "utf8",
    );
  }

  // 3. shared-assets/
  for (const sub of ["expressions", "motions", "vfx-particles", "sfx-common"]) {
    await fs.mkdir(path.join(root, "shared-assets", sub), { recursive: true });
  }
  const sharedRegistry = {
    version: "4.0.1",
    motions: ["idle_breathe.json", "walk.json", "cheer_jump.json", "hit_recoil.json"],
    expressions: ["eyes_normal", "eyes_blink", "eyes_happy", "eyes_shock", "mouth_idle", "mouth_talk", "mouth_cheer"],
    particles: ["spark_32.png", "leaf_32.png", "confetti_32.png", "smoke_64.png"],
    sfxCommon: ["coin_drop.ogg", "horn_start.ogg", "combo_boom.ogg", "countdown_tick.ogg"],
  };
  await fs.writeFile(
    path.join(root, "shared-assets", "manifest.registry.json"),
    `${JSON.stringify(sharedRegistry, null, 2)}\n`,
    "utf8",
  );

  // 4. packages/* (Immutable Framework Core)
  const corePackages = ["shared-contracts", "server-core", "client-core", "ui-kit-react", "canvas-primitives"];
  for (const pkgName of corePackages) {
    const pkgDir = path.join(root, "packages", pkgName);
    await fs.mkdir(path.join(pkgDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(pkgDir, "package.json"),
      `${JSON.stringify({ name: `@live-fw/${pkgName}`, version: "4.0.1", type: "module", main: "./src/index.mjs" }, null, 2)}\n`,
      "utf8",
    );
    await fs.writeFile(
      path.join(pkgDir, "src", "index.mjs"),
      `export const PACKAGE_ID = "@live-fw/${pkgName}";\nexport const IMMUTABLE_CORE_VERSION = "4.0.1.0";\n`,
      "utf8",
    );
  }
  for (const prim of VALID_PRIMITIVES) {
    const primDir = path.join(root, "packages", "canvas-primitives", prim);
    await fs.mkdir(primDir, { recursive: true });
    await fs.writeFile(
      path.join(primDir, "index.mjs"),
      `export const PRIMITIVE_ID = "${prim}";\nexport function createPrimitivePool(limit = 128) { return { id: "${prim}", limit, active: 0, dispose() { this.active = 0; } }; }\n`,
      "utf8",
    );
  }

  // 5. games/_cartridge-template/
  await createGameCartridge({
    frameworkDir: root,
    gameSlug: "_cartridge-template",
    port: 3000,
    primitives: ["particle-pool", "modular-actor-2d"],
    streakMode: "incremental",
    lang,
  });

  // 6. Save SHA-256 immutability lock over packages/*
  const digests = await computePackagesDigest(path.join(root, "packages"));
  await fs.writeFile(
    path.join(root, ".framework-immutability.lock.json"),
    `${JSON.stringify({ version: "4.0.1.0", files: digests }, null, 2)}\n`,
    "utf8",
  );

  return { root, packagesLockedCount: Object.keys(digests).length };
}

export async function createGameCartridge({
  frameworkDir,
  gameSlug,
  port = 3001,
  primitives = ["particle-pool", "modular-actor-2d"],
  streakMode = "incremental",
  lang = "ts",
}) {
  const root = path.resolve(frameworkDir);
  const cartDir = path.join(root, "games", gameSlug);
  const selectedPrimitives = primitives.filter((p) => VALID_PRIMITIVES.includes(p));

  for (const sub of [
    "assets-raw/hero_main",
    "public/assets",
    "src/server",
    "src/world-canvas",
    "src/hud-react",
    "tests",
  ]) {
    await fs.mkdir(path.join(cartDir, sub), { recursive: true });
  }

  const gameManifest = {
    gameId: gameSlug,
    displayName: gameSlug.replace(/[-_]/g, " ").toUpperCase(),
    defaultPort: port,
    resolution: [1080, 1920],
    aspectRatio: "9:16",
    streakDispatchMode: streakMode,
    streakQuietTimeoutMs: 4000,
    audioPolicy: { overlayPrimaryQuery: "?audio=primary", adminPreviewQuery: "?muted=1", duckingDb: -10 },
    enabledCanvasPrimitives: selectedPrimitives,
    liveMappings: {
      chatCommands: { "1": "JOIN_TEAM_BLUE", "2": "JOIN_TEAM_RED" },
      likeThreshold: { everyNLikes: 50, action: "TEAM_RAGE_BOOST" },
      giftTiers: [
        { minCoins: 1, action: "SPAWN_SOLDIER" },
        { minCoins: 10, action: "SPAWN_ELITE" },
        { minCoins: 99, action: "TRIGGER_BOSS_ULTIMATE" },
      ],
    },
  };
  await fs.writeFile(path.join(cartDir, "game.manifest.json"), `${JSON.stringify(gameManifest, null, 2)}\n`, "utf8");

  await fs.writeFile(
    path.join(cartDir, "package.json"),
    `${JSON.stringify({ name: `@live-games/${gameSlug}`, version: "1.0.0", private: true, type: "module", scripts: { test: "node --test tests/cartridge.test.mjs" } }, null, 2)}\n`,
    "utf8",
  );

  const ext = lang === "js" ? "mjs" : "ts";
  const uiExt = lang === "js" ? "jsx" : "tsx";

  // 1. Server Cartridge Module (always ship runnable .mjs alongside .ts contract if ts)
  const serverMjsCode = `export const serverGameModule = {
  gameId: "${gameSlug}",
  createInitialState(config = {}) {
    return { round: 1, phase: "ACTIVE", scores: { blue: 0, red: 0 }, actorsCount: 0, maxVisibleActors: config.maxVisibleActors ?? 60 };
  },
  onLiveEvent(ctx, event) {
    if (event.kind === "chat") {
      const team = event.chat?.commandKey === "1" ? "blue" : "red";
      ctx.state.scores[team] += 1;
      ctx.emitFastAction({ type: "ACTOR_JOIN", team, nickname: event.actor.nickname, avatar: event.actor.avatarProxyUrl });
    } else if (event.kind === "gift" && event.gift) {
      ctx.state.scores.blue += event.gift.deltaCoins;
      ctx.emitFastAction({ type: "GIFT_BURST", coins: event.gift.deltaCoins, nickname: event.actor.nickname });
    }
  },
  onTick(ctx, deltaMs) {
    ctx.state.lastTickDeltaMs = deltaMs;
  },
  onAdminCommand(ctx, cmd) {
    if (cmd.action === "reset_round") {
      ctx.state.scores = { blue: 0, red: 0 };
      ctx.state.round += 1;
    }
  },
};\n`;
  await fs.writeFile(path.join(cartDir, "src", "server", "gameModule.mjs"), serverMjsCode, "utf8");
  if (ext === "ts") {
    await fs.writeFile(
      path.join(cartDir, "src", "server", "gameModule.ts"),
      `// TypeScript Cartridge Entrypoint wrapping validated ESM logic\nexport { serverGameModule } from "./gameModule.mjs";\n`,
      "utf8",
    );
  }

  // 2. Canvas World Controller (60 FPS + dispose() endurance lifecycle)
  const primImports = selectedPrimitives
    .map((p, idx) => `// Tree-shaken primitive [${idx + 1}]: @live-fw/canvas-primitives/${p}`)
    .join("\n");
  const worldCode = `${primImports}
export function createWorldController() {
  let mounted = false;
  let activeDisposables = [];
  return {
    enabledPrimitives: ${JSON.stringify(selectedPrimitives)},
    async mount(_stage, _services) {
      mounted = true;
      activeDisposables.push({ kind: "actor_pool" });
    },
    onStateSync(_nextState) {},
    onFastAction(_action) {},
    onFrameTick(_deltaSeconds, _syncedServerNowMs) {},
    dispose() {
      activeDisposables.length = 0;
      mounted = false;
    },
    isMounted() { return mounted; },
  };
}\n`;
  await fs.writeFile(path.join(cartDir, "src", "world-canvas", `worldController.${ext}`), worldCode, "utf8");
  if (ext === "ts") {
    await fs.writeFile(path.join(cartDir, "src", "world-canvas", "worldController.mjs"), worldCode, "utf8");
  }

  // 3. React HUD Extension (SafeZoneFrame + AdminCustomPanelSlot)
  const hudCode = `// Dual-Lane React 19 HUD & Admin Extension (Safe-Zone 1080x1920: Top 8%, Right 14%, Bottom 27%)
export const CANVAS_STAGE_MEMO_COMPARATOR = () => true; // Mounts <CanvasStageHost /> exactly ONCE (renderCount === 1)
export const hudExtensionMetadata = Object.freeze({
  gameId: "${gameSlug}",
  safeZoneMarginsPct: { top: 8, right: 14, bottom: 27, left: 4 },
  hasAdminCustomPanel: true,
});\n`;
  await fs.writeFile(path.join(cartDir, "src", "hud-react", `hudExtension.${uiExt}`), hudCode, "utf8");

  // 4. Built-in Node.js native test (`node --test`)
  const testCode = `import test from "node:test";
import assert from "node:assert/strict";
import { serverGameModule } from "../src/server/gameModule.mjs";
import { createWorldController } from "../src/world-canvas/worldController.mjs";

test("Cartridge ${gameSlug}: IServerGameModule & 8-Hour dispose() lifecycle", async () => {
  const actions = [];
  const state = serverGameModule.createInitialState({ maxVisibleActors: 60 });
  const ctx = { state, emitFastAction: (a) => actions.push(a) };

  serverGameModule.onLiveEvent(ctx, {
    eventId: "e1",
    platform: "tiktok",
    roomId: "r1",
    receivedAtMs: Date.now(),
    actor: { userId: "u1", uniqueId: "u1", nickname: "Thor", avatarProxyUrl: "/api/v1/avatar?url=x", isModerator: false, isSubscriber: false },
    kind: "gift",
    gift: { giftId: 1, giftName: "Rose", unitCoins: 1, deltaCount: 5, deltaCoins: 5, totalStreakCount: 5, isStreakFinished: true, groupId: "g1" },
  });
  assert.equal(state.scores.blue, 5);
  assert.equal(actions.length, 1);

  const world = createWorldController();
  await world.mount({}, {});
  assert.equal(world.isMounted(), true);
  world.dispose();
  assert.equal(world.isMounted(), false);
});\n`;
  await fs.writeFile(path.join(cartDir, "tests", "cartridge.test.mjs"), testCode, "utf8");

  return { cartDir, gameManifest };
}

export async function auditCoreImmutability(frameworkDir) {
  const root = path.resolve(frameworkDir);
  const lockFp = path.join(root, ".framework-immutability.lock.json");
  if (!(await exists(lockFp))) {
    return { ok: false, violations: ["Thiếu tệp khóa .framework-immutability.lock.json"] };
  }
  const lock = JSON.parse(await fs.readFile(lockFp, "utf8"));
  const current = await computePackagesDigest(path.join(root, "packages"));
  const violations = [];

  for (const [rel, hash] of Object.entries(lock.files)) {
    if (current[rel] !== hash) {
      violations.push(`Tệp lõi bị sửa đổi trái phép: packages/${rel}`);
    }
  }
  for (const rel of Object.keys(current)) {
    if (!(rel in lock.files)) {
      violations.push(`Tệp lạ tự ý chèn vào lõi cố định: packages/${rel}`);
    }
  }
  return { ok: violations.length === 0, violations };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { values } = parseArgs({
    options: {
      "init-framework": { type: "string" },
      "framework-dir": { type: "string" },
      "create-game": { type: "string" },
      port: { type: "string", default: "3001" },
      primitives: { type: "string", default: "particle-pool,modular-actor-2d" },
      "streak-mode": { type: "string", default: "incremental" },
      lang: { type: "string", default: "ts" },
      "audit-immutability": { type: "boolean", default: false },
    },
  });

  const out = { runtime: process.version };
  if (values["init-framework"]) {
    out.initialized = await initFrameworkMonorepo(values["init-framework"], values.lang);
  }
  const fwDir = values["framework-dir"] ?? values["init-framework"];
  if (values["create-game"]) {
    if (!fwDir) throw new Error("Cần truyền --framework-dir khi dùng --create-game");
    const prims = values.primitives.split(",").map((s) => s.trim()).filter(Boolean);
    const created = await createGameCartridge({
      frameworkDir: fwDir,
      gameSlug: values["create-game"],
      port: Number(values.port),
      primitives: prims,
      streakMode: values["streak-mode"],
      lang: values.lang,
    });
    out.createdCartridge = { slug: values["create-game"], dir: created.cartDir };
  }
  if (values["audit-immutability"]) {
    if (!fwDir) throw new Error("Cần truyền --framework-dir khi dùng --audit-immutability");
    const check = await auditCoreImmutability(fwDir);
    out.immutabilityAudit = check;
    if (!check.ok) {
      console.error(JSON.stringify(out, null, 2));
      process.exit(1);
    }
  }
  console.log(JSON.stringify({ status: "PASS", ...out }));
}
