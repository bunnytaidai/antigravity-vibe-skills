#!/usr/bin/env node
/**
 * Đại Tổng Tư Lệnh Node.js điều phối toàn bộ quy trình 7 bước:
 * Khởi tạo/kiểm tra live-game-framework -> Nhân bản Hộp Băng games/<slug>/ -> Kiểm toán Clone 2 nhánh (Cutout Rig / Flipbook)
 * -> Sinh bố cục Dual-Lane Safe-Zone HUD -> Kiểm toán bất biến SHA-256 packages/* -> Chạy node --test nghiệm thu!
 */

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify, parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const SKILLS_ROOT = "~/.gemini\\config\\skills";

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function orchestrateMasterCartridge({
  projectDir,
  gameSlug = "pk-arena-live",
  port = 3001,
  primitives = ["particle-pool", "modular-actor-2d", "physics-and-cues"],
  streakMode = "incremental",
  characters = ["hero_blue", "boss_red"],
  sourceUrl = "",
  lang = "ts",
  mode = "monorepo-cartridge",
}) {
  const root = path.resolve(projectDir);
  const architectScript = path.join(
    SKILLS_ROOT,
    "tiktok-live-framework-cartridge-architect",
    "scripts",
    "scaffold_framework_or_cartridge.mjs",
  );
  const clonerScript = path.join(
    SKILLS_ROOT,
    "tiktok-game-source-visual-cloner",
    "scripts",
    "audit_and_plan_clone_assets.mjs",
  );
  const guiScript = path.join(
    SKILLS_ROOT,
    "tiktok-live-game-gui-builder",
    "scripts",
    "generate_hud_safezone_layout.mjs",
  );

  if (mode === "standalone") {
    for (const sub of ["assets", "src/bridge", "src/core", "src/ui"]) {
      await fs.mkdir(path.join(root, sub), { recursive: true });
    }
    await execFileAsync(process.execPath, [
      clonerScript,
      "--assets-dir",
      path.join(root, "assets"),
      "--characters",
      characters.join(","),
      "--source-url",
      sourceUrl,
    ]);
    await execFileAsync(process.execPath, [guiScript, "--out", path.join(root, "src", "ui")]);
    return { mode, root, targetDir: root };
  }

  // Chế độ chuẩn Master Blueprint: monorepo-cartridge
  const lockFp = path.join(root, ".framework-immutability.lock.json");
  if (!(await pathExists(lockFp))) {
    await execFileAsync(process.execPath, [architectScript, "--init-framework", root, "--lang", lang]);
  }

  // Nhân bản Cartridge mới vào games/<gameSlug>
  await execFileAsync(process.execPath, [
    architectScript,
    "--framework-dir",
    root,
    "--create-game",
    gameSlug,
    "--port",
    String(port),
    "--primitives",
    primitives.join(","),
    "--streak-mode",
    streakMode,
    "--lang",
    lang,
  ]);

  const cartDir = path.join(root, "games", gameSlug);

  // Chạy Cloner 2 nhánh trên assets-raw của Cartridge
  await execFileAsync(process.execPath, [
    clonerScript,
    "--assets-dir",
    path.join(cartDir, "assets-raw"),
    "--characters",
    characters.join(","),
    "--source-url",
    sourceUrl,
    "--pipeline-mode",
    "two-branch",
  ]);

  // Chạy GUI Builder xuất hud_theme_layout.json chuẩn Safe-Zone (Top 8%, Right 14%, Bottom 27%) vào src/hud-react
  await execFileAsync(process.execPath, [guiScript, "--out", path.join(cartDir, "src", "hud-react")]);

  // Lưu project-wiring.manifest.json ngay trong Cartridge để khóa liên kết nội bộ
  const wiringManifest = {
    blueprintVersion: "4.0.1.0",
    mode: "monorepo-cartridge",
    gameSlug,
    lang,
    port,
    streakDispatchMode: streakMode,
    enabledCanvasPrimitives: primitives,
    characters,
    bindings: {
      gameManifest: "game.manifest.json",
      assetsBlueprint: "assets-raw/clone_fidelity_blueprint.json",
      hudSafeZoneLayout: "src/hud-react/hud_theme_layout.json",
      serverModule: "src/server/gameModule.mjs",
      worldController: "src/world-canvas/worldController.mjs",
      unitTest: "tests/cartridge.test.mjs",
    },
  };
  await fs.writeFile(
    path.join(cartDir, "project-wiring.manifest.json"),
    `${JSON.stringify(wiringManifest, null, 2)}\n`,
    "utf8",
  );

  return { mode, root, targetDir: cartDir, wiringManifest };
}

export async function verifyFullMasterPipeline(projectDir, gameSlug, mode = "monorepo-cartridge") {
  const root = path.resolve(projectDir);
  if (mode === "standalone") {
    const ok = await pathExists(path.join(root, "src", "ui", "hud_theme_layout.json"));
    return { ok, errors: ok ? [] : ["Thiếu hud_theme_layout.json"] };
  }

  const errors = [];
  const architectScript = path.join(
    SKILLS_ROOT,
    "tiktok-live-framework-cartridge-architect",
    "scripts",
    "scaffold_framework_or_cartridge.mjs",
  );

  // Cổng kiểm tra bất biến SHA-256 trên packages/*
  try {
    await execFileAsync(process.execPath, [architectScript, "--framework-dir", root, "--audit-immutability"]);
  } catch (err) {
    errors.push(`Vi phạm tính bất biến packages/*: ${err.message}`);
  }

  // Kiểm tra đủ các tệp liên kết trong games/<gameSlug>
  const cartDir = path.join(root, "games", gameSlug);
  const manifestFp = path.join(cartDir, "project-wiring.manifest.json");
  if (!(await pathExists(manifestFp))) {
    return { ok: false, errors: [`Thiếu ${manifestFp}`] };
  }
  const spec = JSON.parse(await fs.readFile(manifestFp, "utf8"));
  for (const [key, rel] of Object.entries(spec.bindings)) {
    if (!(await pathExists(path.join(cartDir, rel)))) {
      errors.push(`Thiếu tệp khớp nối [${key}]: games/${gameSlug}/${rel}`);
    }
  }

  // Chạy node --test trực tiếp trên bài kiểm thử của Cartridge (Cổng nghiệm thu số 1 & 3)
  try {
    await execFileAsync(process.execPath, ["--test", path.join(cartDir, "tests", "cartridge.test.mjs")]);
  } catch (err) {
    errors.push(`Bài test Cartridge thất bại: ${err.stderr || err.message}`);
  }

  return { ok: errors.length === 0, errors };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { values } = parseArgs({
    options: {
      "project-dir": { type: "string" },
      "game-slug": { type: "string", default: "pk-arena-live" },
      "game-name": { type: "string" },
      port: { type: "string", default: "3001" },
      primitives: { type: "string", default: "particle-pool,modular-actor-2d,physics-and-cues" },
      "streak-mode": { type: "string", default: "incremental" },
      characters: { type: "string", default: "hero_blue,boss_red" },
      "source-url": { type: "string", default: "" },
      lang: { type: "string", default: "ts" },
      mode: { type: "string", default: "monorepo-cartridge" },
      "verify-wiring": { type: "boolean", default: false },
    },
  });

  if (!values["project-dir"]) {
    console.error("Thiếu tham số --project-dir");
    process.exit(1);
  }
  const slug = (values["game-name"] ?? values["game-slug"]).toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  const primitives = values.primitives.split(",").map((s) => s.trim()).filter(Boolean);
  const characters = values.characters.split(",").map((s) => s.trim()).filter(Boolean);

  const result = await orchestrateMasterCartridge({
    projectDir: values["project-dir"],
    gameSlug: slug,
    port: Number(values.port),
    primitives,
    streakMode: values["streak-mode"],
    characters,
    sourceUrl: values["source-url"],
    lang: values.lang,
    mode: values.mode,
  });

  let verify = { ok: true, errors: [] };
  if (values["verify-wiring"]) {
    verify = await verifyFullMasterPipeline(values["project-dir"], slug, values.mode);
    if (!verify.ok) {
      console.error(JSON.stringify(verify, null, 2));
      process.exit(1);
    }
  }

  console.log(JSON.stringify({
    status: verify.ok ? "PASS" : "FAIL",
    runtime: process.version,
    mode: values.mode,
    gameSlug: slug,
    targetDir: result.targetDir,
    wiringAndTestsVerified: verify.ok,
    errors: verify.errors,
  }));
}
