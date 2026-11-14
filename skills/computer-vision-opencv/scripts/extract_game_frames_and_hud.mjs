#!/usr/bin/env node
/**
 * Pure Node.js (v24 ESM) Gameplay Video Analyzer for Antidv Workstation (Xeon 24T + 64GB RAM).
 * Uses built-in node:child_process (ffmpeg/ffprobe) + node:zlib lossless PNG encoder (zero npm deps).
 * Slices character frames into actions/{idle,shoot,hit} with 64-bit dHash deduplication,
 * and measures exact (X, Y, W, H) coordinates of HP Bars & transient Notification Boxes.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

// Fast CRC32 table for pure Node.js PNG encoding
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
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

function encodeRgb24ToPng(rgbBuf, width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 2; // RGB color type
  const stride = width * 3;
  const rawScanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOut = y * (stride + 1);
    rawScanlines[rowOut] = 0; // Filter type 0 (None)
    rgbBuf.copy(rawScanlines, rowOut + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(rawScanlines, { level: 6 });
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function cropRgb(rgbBuf, fullW, rx, ry, rw, rh) {
  const out = Buffer.alloc(rw * rh * 3);
  for (let y = 0; y < rh; y++) {
    const srcStart = ((ry + y) * fullW + rx) * 3;
    rgbBuf.copy(out, y * rw * 3, srcStart, srcStart + rw * 3);
  }
  return out;
}

function drawRectRgb(rgbBuf, fullW, fullH, rx, ry, rw, rh, [r, g, b], thickness = 2) {
  const x2 = Math.min(fullW - 1, rx + rw - 1);
  const y2 = Math.min(fullH - 1, ry + rh - 1);
  const x1 = Math.max(0, rx);
  const y1 = Math.max(0, ry);
  for (let t = 0; t < thickness; t++) {
    for (let x = x1; x <= x2; x++) {
      for (const yy of [y1 + t, y2 - t]) {
        if (yy >= 0 && yy < fullH) {
          const i = (yy * fullW + x) * 3;
          rgbBuf[i] = r; rgbBuf[i + 1] = g; rgbBuf[i + 2] = b;
        }
      }
    }
    for (let y = y1; y <= y2; y++) {
      for (const xx of [x1 + t, x2 - t]) {
        if (xx >= 0 && xx < fullW) {
          const i = (y * fullW + xx) * 3;
          rgbBuf[i] = r; rgbBuf[i + 1] = g; rgbBuf[i + 2] = b;
        }
      }
    }
  }
}

function computeDHash64(rgbCrop, w, h) {
  // Sample 9x8 luminance grid for 64-bit perceptual difference hash
  const lum = new Float64Array(9 * 8);
  for (let gy = 0; gy < 8; gy++) {
    const sy = Math.min(h - 1, Math.floor(((gy + 0.5) * h) / 8));
    for (let gx = 0; gx < 9; gx++) {
      const sx = Math.min(w - 1, Math.floor(((gx + 0.5) * w) / 9));
      const i = (sy * w + sx) * 3;
      lum[gy * 9 + gx] = 0.299 * rgbCrop[i] + 0.587 * rgbCrop[i + 1] + 0.114 * rgbCrop[i + 2];
    }
  }
  let bits = 0n;
  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 8; gx++) {
      bits = (bits << 1n) | (lum[gy * 9 + gx + 1] > lum[gy * 9 + gx] ? 1n : 0n);
    }
  }
  return bits;
}

function popcount64(x) {
  let c = 0;
  let v = x;
  while (v > 0n) { v &= v - 1n; c++; }
  return c;
}

function medianInt(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function decodeVideoFramesToRgb24Buffer(videoPath, sampleEvery = 2) {
  const ffmpegBin = process.env.FFMPEG_PATH || "ffmpeg";
  const ffprobeBin = process.env.FFPROBE_PATH || "ffprobe";
  try {
    const out = execFileSync(ffprobeBin, [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
      "-of", "json", videoPath,
    ], { encoding: "utf8" });
    const stream = JSON.parse(out).streams[0];
    const [num, den] = String(stream.r_frame_rate || "30/1").split("/").map(Number);
    const meta = {
      width: Number(stream.width),
      height: Number(stream.height),
      fps: Number(((num || 30) / (den || 1)).toFixed(2)),
      totalFrames: Number(stream.nb_frames || 0),
      decoder: "ffmpeg",
    };
    const rawAll = execFileSync(ffmpegBin, [
      "-v", "error", "-i", videoPath,
      "-vf", `select='not(mod(n\\,${Math.max(1, sampleEvery)}))'`,
      "-vsync", "vfr", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
    ], { maxBuffer: 512 * 1024 * 1024 });
    return { meta, rawAll };
  } catch {
    // Fallback ONLY when system ffmpeg.exe symlink is broken & ffmpeg-static is not set:
    // Use opencv_videoio_ffmpeg DLL ONLY as raw RGB24 byte demuxer; 100% CV & PNG logic stays in Node.js!
    const pyDemux = [
      "import cv2, json, sys",
      "cap = cv2.VideoCapture(sys.argv[1])",
      "step = int(sys.argv[2])",
      "w, h = int(cap.get(3)), int(cap.get(4))",
      "fps, total = float(cap.get(5) or 30.0), int(cap.get(7) or 0)",
      "chunks, idx = [], 0",
      "while True:",
      "    ok, f = cap.read()",
      "    if not ok: break",
      "    if idx % step == 0: chunks.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB).tobytes())",
      "    idx += 1",
      "cap.release()",
      "hdr = (json.dumps({'width': w, 'height': h, 'fps': round(fps,2), 'totalFrames': total, 'decoder': 'opencv_videoio_dll_pipe'}) + '\\n').encode('utf-8')",
      "sys.stdout.buffer.write(hdr + b''.join(chunks))",
    ].join("\n");
    const combined = execFileSync("python", ["-c", pyDemux, videoPath, String(Math.max(1, sampleEvery))], {
      maxBuffer: 512 * 1024 * 1024,
    });
    const nl = combined.indexOf(10);
    const meta = JSON.parse(combined.subarray(0, nl).toString("utf8"));
    const rawAll = combined.subarray(nl + 1);
    return { meta, rawAll };
  }
}

export async function analyzeGameplayVideoNode({ videoPath, outDir, roi = null, maxPerState = 25, sampleEvery = 2 }) {
  const { meta, rawAll } = decodeVideoFramesToRgb24Buffer(videoPath, sampleEvery);
  const { width, height } = meta;
  const charRoi = roi ?? [
    Math.floor(width * 0.2),
    Math.floor(height * 0.25),
    Math.floor(width * 0.6),
    Math.floor(height * 0.6),
  ];
  const [rx, ry, rw, rh] = charRoi;

  for (const st of ["idle", "shoot", "hit"]) {
    await fs.mkdir(path.join(outDir, "actions", st), { recursive: true });
  }

  const frameBytes = width * height * 3;
  const sampledCount = Math.floor(rawAll.length / frameBytes);

  const hpBoxes = [];
  const toastBoxes = [];
  const savedHashes = { idle: [], shoot: [], hit: [] };
  const counts = { idle: 0, shoot: 0, hit: 0 };

  let prevHudGray = null;
  let prevRoiGray = null;
  let debugBaseFrame = null;

  const hudMaxY = Math.floor(height * 0.38);

  for (let f = 0; f < sampledCount; f++) {
    const frame = rawAll.subarray(f * frameBytes, (f + 1) * frameBytes);
    if (!debugBaseFrame) debugBaseFrame = Buffer.from(frame);

    // 1. Scan HUD top region for horizontal Red / Green HP Bar
    let hpMinX = width, hpMinY = hudMaxY, hpMaxX = -1, hpMaxY = -1;
    const hudGray = new Uint8Array(width * hudMaxY);

    for (let y = 0; y < hudMaxY; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 3;
        const r = frame[idx], g = frame[idx + 1], b = frame[idx + 2];
        hudGray[y * width + x] = (r * 77 + g * 150 + b * 29) >> 8;

        const isGreenBar = g > 175 && r < 100 && b < 100;
        const isRedBar = r > 185 && g < 75 && b < 75;
        if (isGreenBar || isRedBar) {
          if (x < hpMinX) hpMinX = x;
          if (x > hpMaxX) hpMaxX = x;
          if (y < hpMinY) hpMinY = y;
          if (y > hpMaxY) hpMaxY = y;
        }
      }
    }

    if (hpMaxX > hpMinX) {
      const bw = hpMaxX - hpMinX + 1;
      const bh = hpMaxY - hpMinY + 1;
      if (bw >= Math.floor(width * 0.12) && bh >= 5 && bw / Math.max(1, bh) >= 3.5) {
        hpBoxes.push([hpMinX, hpMinY, bw, bh]);
      }
    }

    // 2. Detect transient Notification / Gift Popup Box via HUD temporal diff (excluding known HP strip)
    if (prevHudGray) {
      const hpY1 = hpBoxes.length ? hpBoxes[hpBoxes.length - 1][1] - 4 : -999;
      const hpY2 = hpBoxes.length ? hpY1 + hpBoxes[hpBoxes.length - 1][3] + 8 : -999;
      let tMinX = width, tMinY = hudMaxY, tMaxX = -1, tMaxY = -1, changedPx = 0;
      for (let y = 0; y < hudMaxY; y++) {
        if (y >= hpY1 && y <= hpY2) continue;
        for (let x = 0; x < width; x++) {
          const p = y * width + x;
          if (Math.abs(hudGray[p] - prevHudGray[p]) > 35) {
            changedPx++;
            if (x < tMinX) tMinX = x;
            if (x > tMaxX) tMaxX = x;
            if (y < tMinY) tMinY = y;
            if (y > tMaxY) tMaxY = y;
          }
        }
      }
      const tw = tMaxX - tMinX + 1;
      const th = tMaxY - tMinY + 1;
      if (changedPx > 400 && tw >= Math.floor(width * 0.18) && th >= 22 && tw / Math.max(1, th) >= 1.8) {
        toastBoxes.push([tMinX, tMinY, tw, th]);
        debugBaseFrame = Buffer.from(frame);
      }
    }
    prevHudGray = hudGray;

    // 3. Slice Character ROI into idle / shoot / hit
    const crop = cropRgb(frame, width, rx, ry, rw, rh);
    const roiGray = new Uint8Array(rw * rh);
    let brightCount = 0;
    let redFlashCount = 0;
    for (let p = 0; p < rw * rh; p++) {
      const r = crop[p * 3], g = crop[p * 3 + 1], b = crop[p * 3 + 2];
      roiGray[p] = (r * 77 + g * 150 + b * 29) >> 8;
      if (r >= 242 || g >= 242 || b >= 242) brightCount++;
      if (r > 210 && b < 90 && g < 90) redFlashCount++;
    }

    if (prevRoiGray) {
      let diffSum = 0;
      for (let p = 0; p < roiGray.length; p++) diffSum += Math.abs(roiGray[p] - prevRoiGray[p]);
      const motion = diffSum / roiGray.length;
      const brightRatio = brightCount / roiGray.length;
      const redRatio = redFlashCount / roiGray.length;

      let state = "idle";
      if ((brightRatio > 0.08 || redRatio > 0.08) && motion > 8.0) state = "hit";
      else if (motion > 3.5 || brightRatio > 0.025) state = "shoot";

      if (counts[state] < maxPerState) {
        const hash = computeDHash64(crop, rw, rh);
        const isUnique = savedHashes[state].every((oldH) => popcount64(hash ^ oldH) >= 2);
        if (isUnique) {
          const outPng = path.join(outDir, "actions", state, `${state}_f${String(f * sampleEvery).padStart(5, "0")}.png`);
          await fs.writeFile(outPng, encodeRgb24ToPng(crop, rw, rh));
          savedHashes[state].push(hash);
          counts[state]++;
        }
      }
    }
    prevRoiGray = roiGray;
  }

  const formatBox = (boxes) => {
    if (!boxes.length) return null;
    const x = medianInt(boxes.map((b) => b[0]));
    const y = medianInt(boxes.map((b) => b[1]));
    const w = medianInt(boxes.map((b) => b[2]));
    const h = medianInt(boxes.map((b) => b[3]));
    return {
      x, y, width: w, height: h,
      centerXY: [x + Math.floor(w / 2), y + Math.floor(h / 2)],
      normalizedPct: {
        xPct: Number(((x / width) * 100).toFixed(2)),
        yPct: Number(((y / height) * 100).toFixed(2)),
        wPct: Number(((w / width) * 100).toFixed(2)),
        hPct: Number(((h / height) * 100).toFixed(2)),
      },
    };
  };

  const hpBar = formatBox(hpBoxes);
  const notificationBox = formatBox(toastBoxes);
  const overlayPath = path.join(outDir, "hud_debug_overlay.png");

  if (debugBaseFrame) {
    drawRectRgb(debugBaseFrame, width, height, rx, ry, rw, rh, [0, 210, 255], 2);
    if (hpBar) drawRectRgb(debugBaseFrame, width, height, hpBar.x, hpBar.y, hpBar.width, hpBar.height, [0, 255, 80], 3);
    if (notificationBox) drawRectRgb(debugBaseFrame, width, height, notificationBox.x, notificationBox.y, notificationBox.width, notificationBox.height, [255, 150, 0], 3);
    await fs.writeFile(overlayPath, encodeRgb24ToPng(debugBaseFrame, width, height));
  }

  const report = {
    runtime: `Node.js ${process.version}`,
    video: videoPath.replaceAll("\\", "/"),
    resolution: meta,
    characterRoiXYWH: charRoi,
    hpBar,
    notificationBox,
    extractedActionFrames: counts,
    debugOverlay: overlayPath.replaceAll("\\", "/"),
  };

  await fs.writeFile(path.join(outDir, "hud_layout_coords.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, fallback = null) => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
  };
  const videoPath = getArg("--video");
  const outDir = getArg("--out");
  if (!videoPath || !outDir) {
    console.error("Usage: node extract_game_frames_and_hud.mjs --video <input.mp4> --out <output_dir> [--roi X,Y,W,H]");
    process.exit(1);
  }
  const roiStr = getArg("--roi");
  const roi = roiStr ? roiStr.split(",").map((n) => Number(n.trim())) : null;
  const maxPerState = Number(getArg("--max-per-state", "25"));
  const report = await analyzeGameplayVideoNode({ videoPath, outDir, roi, maxPerState });
  console.log(JSON.stringify(report, null, 2));
}

if (import.meta.url === `file:///${process.argv[1].replaceAll("\\", "/")}` || process.argv[1]?.endsWith("extract_game_frames_and_hud.mjs")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
