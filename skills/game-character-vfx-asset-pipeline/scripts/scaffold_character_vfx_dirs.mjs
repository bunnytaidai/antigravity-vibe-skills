#!/usr/bin/env node
/**
 * Pure Node.js (v24 ESM) Game Character Action Folders, Layered Backgrounds, VFX & Spritesheet Packer.
 * Optimized for Antidv Workstation (Xeon 24T + 64GB RAM + GTX 1660 Ti 6GB VRAM).
 */

import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { decodePngToRgba } from "./asset_report.mjs";

const ACTION_STATES = ["idle", "walk", "shoot", "hit", "skill", "ko"];
const BG_LAYERS = ["01_sky", "02_midground", "03_arena_floor", "04_foreground_fx"];
const VFX_CATEGORIES = ["muzzle_flash", "projectile", "impact_spark", "explosion", "buff_aura"];

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(typeStr, dataBuf) {
  const typeBuf = Buffer.from(typeStr, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, dataBuf])), 0);
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
}

export function encodeRgbaToPng(rgbaBuf, width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const outRow = y * (stride + 1);
    raw[outRow] = 0;
    rgbaBuf.copy(raw, outRow + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);
}

async function decodePngFileNode(filePath) {
  const buf = await fs.readFile(filePath);
  return decodePngToRgba(buf);
}

export function buildInteractiveFxPresets() {
  return {
    runtime: "Node.js / Browser ES2024 (Canvas / PixiJS / Phaser)",
    hardwareBudget: {
      gpuTarget: "NVIDIA GTX 1660 Ti (6GB VRAM)",
      maxAtlasSize: [2048, 2048],
      maxActiveParticles: 120,
      maxFlashHz: 3,
    },
    tiers: {
      smallTapOrLike: { trauma: 0.12, hitStopMs: 0, particles: 4, squashStretch: [1.08, 0.92] },
      mediumShootOrHit: {
        trauma: 0.38, hitStopMs: 45, whiteFlashMs: 60, particles: 10,
        squashStretch: [1.22, 0.8], damagePop: { ease: "backOut", risePx: 42, durationMs: 450 },
      },
      largeBossOrGiftUltimate: {
        trauma: 0.82, hitStopMs: 110, whiteFlashMs: 90, cameraZoomPunch: 1.06,
        particles: 36, bannerAnnounceMs: 2200,
      },
    },
  };
}

export async function scaffoldAssetTree({ rootDir, characters, stages, resolution }) {
  let dirCount = 0;
  for (const charName of characters) {
    for (const st of [...ACTION_STATES, "build"]) {
      await fs.mkdir(path.join(rootDir, "characters", charName, st), { recursive: true });
      dirCount++;
    }
  }
  for (const stage of stages) {
    const stageDir = path.join(rootDir, "backgrounds", stage);
    await fs.mkdir(stageDir, { recursive: true });
    dirCount++;
    await fs.writeFile(
      path.join(stageDir, "layers_spec.json"),
      JSON.stringify({
        stage,
        targetResolution: resolution,
        expectedLayers: BG_LAYERS.map((l) => `${l}.png`),
        parallaxScrollFactors: { "01_sky": 0.1, "02_midground": 0.45, "03_arena_floor": 1.0, "04_foreground_fx": 1.25 },
      }, null, 2) + "\n",
      "utf8",
    );
  }
  for (const vfx of VFX_CATEGORIES) {
    await fs.mkdir(path.join(rootDir, "vfx", vfx), { recursive: true });
    dirCount++;
  }
  const ifxDir = path.join(rootDir, "interactive_fx");
  await fs.mkdir(ifxDir, { recursive: true });
  const presetsPath = path.join(ifxDir, "presets.json");
  await fs.writeFile(presetsPath, JSON.stringify(buildInteractiveFxPresets(), null, 2) + "\n", "utf8");

  const manifestPath = path.join(rootDir, "asset-manifest.json");
  const charactersMap = Object.fromEntries(
    characters.map((c) => [c, { states: ACTION_STATES, cellSize: [256, 256], atlas: `characters/${c}/build/atlas.json` }]),
  );
  await fs.writeFile(
    manifestPath,
    JSON.stringify({
      schemaVersion: "1.1.0",
      runtime: `Node.js ${process.version}`,
      targetResolution: { width: resolution[0], height: resolution[1] },
      pivotStandard: [0.5, 1.0],
      characters: charactersMap,
      stages,
      vfxCategories: VFX_CATEGORIES,
      interactivePresets: "interactive_fx/presets.json",
    }, null, 2) + "\n",
    "utf8",
  );

  return {
    ok: true,
    runtime: `Node.js ${process.version}`,
    root: rootDir.replaceAll("\\", "/"),
    directoriesCreated: dirCount,
    manifest: manifestPath.replaceAll("\\", "/"),
    interactivePresets: presetsPath.replaceAll("\\", "/"),
  };
}

export async function packCharacterAtlasNode(charDir, cellW = 256, cellH = 256, cols = 8) {
  const framesMeta = [];
  const cells = [];

  for (const state of ACTION_STATES) {
    const stDir = path.join(charDir, state);
    let entries = [];
    try { entries = (await fs.readdir(stDir)).filter((f) => f.toLowerCase().endsWith(".png")).sort(); } catch { continue; }
    for (let idx = 0; idx < entries.length; idx++) {
      const pngPath = path.join(stDir, entries[idx]);
      const { width, height, rgba } = await decodePngFileNode(pngPath);
      const cell = Buffer.alloc(cellW * cellH * 4, 0);
      const copyW = Math.min(cellW, width);
      const copyH = Math.min(cellH, height);
      const ox = Math.max(0, Math.floor((cellW - copyW) / 2));
      const oy = Math.max(0, cellH - copyH); // Bottom-center anchor [0.5, 1.0]

      for (let y = 0; y < copyH; y++) {
        for (let x = 0; x < copyW; x++) {
          const srcIdx = (y * width + x) * 4;
          const dstIdx = ((oy + y) * cellW + (ox + x)) * 4;
          cell[dstIdx] = rgba[srcIdx];
          cell[dstIdx + 1] = rgba[srcIdx + 1];
          cell[dstIdx + 2] = rgba[srcIdx + 2];
          cell[dstIdx + 3] = rgba[srcIdx + 3];
        }
      }
      cells.push(cell);
      framesMeta.push({ state, frame: idx, source: entries[idx] });
    }
  }

  if (!cells.length) return { ok: false, frames: 0 };

  const usedCols = Math.min(cells.length, cols);
  const rows = Math.ceil(cells.length / cols);
  const sheetW = Math.ceil((usedCols * cellW) / 4) * 4;
  const sheetH = Math.ceil((rows * cellH) / 4) * 4;
  const sheet = Buffer.alloc(sheetW * sheetH * 4, 0);

  for (let i = 0; i < cells.length; i++) {
    const cx = (i % cols) * cellW;
    const cy = Math.floor(i / cols) * cellH;
    const cell = cells[i];
    for (let y = 0; y < cellH; y++) {
      cell.copy(sheet, ((cy + y) * sheetW + cx) * 4, y * cellW * 4, (y + 1) * cellW * 4);
    }
    Object.assign(framesMeta[i], { x: cx, y: cy, w: cellW, h: cellH, pivot: [0.5, 1.0] });
  }

  const buildDir = path.join(charDir, "build");
  await fs.mkdir(buildDir, { recursive: true });
  const sheetPath = path.join(buildDir, "spritesheet.png");
  const atlasPath = path.join(buildDir, "atlas.json");
  await fs.writeFile(sheetPath, encodeRgbaToPng(sheet, sheetW, sheetH));
  await fs.writeFile(
    atlasPath,
    JSON.stringify({
      character: path.basename(charDir),
      sheet: "spritesheet.png",
      sheetSize: [sheetW, sheetH],
      cellSize: [cellW, cellH],
      frames: framesMeta,
    }, null, 2) + "\n",
    "utf8",
  );
  return { ok: true, frames: cells.length, sheet: sheetPath.replaceAll("\\", "/"), atlas: atlasPath.replaceAll("\\", "/") };
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, fallback = null) => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
  };
  const rootDir = getArg("--root");
  if (!rootDir) {
    console.error("Usage: node scaffold_character_vfx_dirs.mjs --root <assets_dir> [--characters a,b] [--resolution 1080x1920] [--pack-character <dir>]");
    process.exit(1);
  }
  const characters = getArg("--characters", "hero_blue,boss_red").split(",").map((s) => s.trim()).filter(Boolean);
  const stages = getArg("--stages", "arena_main").split(",").map((s) => s.trim()).filter(Boolean);
  const [rw, rh] = getArg("--resolution", "1080x1920").toLowerCase().split("x").map(Number);
  const result = await scaffoldAssetTree({ rootDir, characters, stages, resolution: [rw, rh] });

  const packChar = getArg("--pack-character");
  if (packChar) {
    const [cw, ch] = getArg("--cell-size", "256x256").toLowerCase().split("x").map(Number);
    result.packed = await packCharacterAtlasNode(packChar, cw, ch);
  }
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith("scaffold_character_vfx_dirs.mjs")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
