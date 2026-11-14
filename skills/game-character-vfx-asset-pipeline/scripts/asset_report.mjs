#!/usr/bin/env node
/**
 * 100% Pure Node.js (v24 ESM, zero external binaries or npm packages) Raster Game Asset QA Inspector.
 * Parses PNG IHDR/PLTE/tRNS/IDAT directly via node:zlib, unfilters scanlines, and verifies real RGBA alpha.
 */

import fs from "node:fs/promises";
import zlib from "node:zlib";

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function decodePngToRgba(pngBuf) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (pngBuf[i] !== sig[i]) throw new Error("Not a valid PNG file");
  }

  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  let palette = null;
  let trns = null;
  const idatChunks = [];

  while (offset < pngBuf.length) {
    const len = pngBuf.readUInt32BE(offset);
    const type = pngBuf.toString("ascii", offset + 4, offset + 8);
    const data = pngBuf.subarray(offset + 8, offset + 8 + len);
    offset += 12 + len;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
      if (bitDepth !== 8 || interlace !== 0) {
        throw new Error(`Unsupported PNG bitDepth=${bitDepth} or interlace=${interlace} (expected 8-bit non-interlaced)`);
      }
    } else if (type === "PLTE") {
      palette = data;
    } else if (type === "tRNS") {
      trns = data;
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  const channelsMap = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const bpp = channelsMap[colorType];
  if (!bpp) throw new Error(`Unsupported PNG colorType=${colorType}`);

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * bpp;
  const recon = new Uint8Array(height * stride);

  for (let y = 0; y < height; y++) {
    const filterType = inflated[y * (stride + 1)];
    const rowIn = y * (stride + 1) + 1;
    const rowOut = y * stride;

    for (let x = 0; x < stride; x++) {
      const raw = inflated[rowIn + x];
      const a = x >= bpp ? recon[rowOut + x - bpp] : 0;
      const b = y > 0 ? recon[rowOut - stride + x] : 0;
      const c = (y > 0 && x >= bpp) ? recon[rowOut - stride + x - bpp] : 0;

      let val = raw;
      if (filterType === 1) val = (raw + a) & 0xff;
      else if (filterType === 2) val = (raw + b) & 0xff;
      else if (filterType === 3) val = (raw + ((a + b) >> 1)) & 0xff;
      else if (filterType === 4) val = (raw + paethPredictor(a, b, c)) & 0xff;
      recon[rowOut + x] = val;
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  const hasAlpha = colorType === 4 || colorType === 6 || Boolean(trns);

  for (let i = 0; i < width * height; i++) {
    const dst = i * 4;
    if (colorType === 6) {
      rgba[dst] = recon[i * 4];
      rgba[dst + 1] = recon[i * 4 + 1];
      rgba[dst + 2] = recon[i * 4 + 2];
      rgba[dst + 3] = recon[i * 4 + 3];
    } else if (colorType === 2) {
      const r = recon[i * 3], g = recon[i * 3 + 1], b = recon[i * 3 + 2];
      rgba[dst] = r; rgba[dst + 1] = g; rgba[dst + 2] = b;
      rgba[dst + 3] = (trns && trns.length >= 6 && r === trns[1] && g === trns[3] && b === trns[5]) ? 0 : 255;
    } else if (colorType === 4) {
      const gray = recon[i * 2];
      rgba[dst] = gray; rgba[dst + 1] = gray; rgba[dst + 2] = gray; rgba[dst + 3] = recon[i * 2 + 1];
    } else if (colorType === 0) {
      const gray = recon[i];
      rgba[dst] = gray; rgba[dst + 1] = gray; rgba[dst + 2] = gray;
      rgba[dst + 3] = (trns && trns.length >= 2 && gray === trns[1]) ? 0 : 255;
    } else if (colorType === 3 && palette) {
      const idx = recon[i];
      rgba[dst] = palette[idx * 3] ?? 0;
      rgba[dst + 1] = palette[idx * 3 + 1] ?? 0;
      rgba[dst + 2] = palette[idx * 3 + 2] ?? 0;
      rgba[dst + 3] = trns && idx < trns.length ? trns[idx] : 255;
    }
  }

  return { width, height, colorType, hasAlpha, rgba };
}

export async function inspectPngFileNode(filePath, maxColors = null) {
  const buf = await fs.readFile(filePath);
  const { width, height, colorType, hasAlpha, rgba } = decodePngToRgba(buf);

  let alphaMin = 255, alphaMax = 0, transparentPixels = 0;
  const colorLimit = maxColors ?? 65535;
  const colorSet = new Set();
  let exceededColors = false;

  const totalPx = width * height;
  for (let i = 0; i < totalPx; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], a = rgba[i * 4 + 3];
    if (a < alphaMin) alphaMin = a;
    if (a > alphaMax) alphaMax = a;
    if (a === 0) transparentPixels++;
    if (!exceededColors) {
      colorSet.add(((r << 24) | (g << 16) | (b << 8) | a) >>> 0);
      if (colorSet.size > colorLimit) exceededColors = true;
    }
  }

  return {
    path: filePath.replaceAll("\\", "/"),
    width,
    height,
    colorType,
    hasAlpha,
    alphaMin,
    alphaMax,
    transparentPixels,
    colorCount: exceededColors ? `>${colorLimit}` : colorSet.size,
  };
}

async function main() {
  const args = process.argv.slice(2);
  let requireAlpha = false, asJson = false, expectSize = null, maxColors = null;
  const files = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--require-alpha") requireAlpha = true;
    else if (a === "--json") asJson = true;
    else if (a === "--expect-size" && args[i + 1]) expectSize = args[++i].toLowerCase().split("x").map(Number);
    else if (a === "--max-colors" && args[i + 1]) maxColors = Number(args[++i]);
    else if (!a.startsWith("--")) files.push(a);
  }

  if (!files.length) {
    console.error("Usage: node asset_report.mjs <img1.png> [...] [--require-alpha] [--expect-size WxH] [--max-colors N] [--json]");
    process.exit(1);
  }

  let failed = false;
  const reports = [];
  for (const f of files) {
    try {
      const rep = await inspectPngFileNode(f, maxColors);
      const problems = [];
      if (expectSize && (rep.width !== expectSize[0] || rep.height !== expectSize[1])) {
        problems.push(`size is ${rep.width}x${rep.height}; expected ${expectSize[0]}x${expectSize[1]}`);
      }
      if (requireAlpha && !rep.hasAlpha) problems.push("image has no alpha channel");
      else if (requireAlpha && rep.alphaMin === 255) problems.push("alpha channel is fully opaque (fake checkerboard)");
      if (maxColors !== null && typeof rep.colorCount === "string") problems.push(`image has more than ${maxColors} colors`);
      rep.problems = problems;
      if (problems.length) failed = true;
      reports.push(rep);
    } catch (err) {
      failed = true;
      reports.push({ path: f.replaceAll("\\", "/"), problems: [err.message] });
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ ok: !failed, runtime: `Node.js ${process.version}`, assets: reports }, null, 2));
  } else {
    for (const r of reports) {
      console.log(`${r.problems?.length ? "FAIL" : "PASS"} ${r.path} ${r.width ?? "?"}x${r.height ?? "?"} alpha=${r.hasAlpha}`);
      for (const p of r.problems ?? []) console.log(`  - ${p}`);
    }
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1]?.endsWith("asset_report.mjs")) {
  main();
}
