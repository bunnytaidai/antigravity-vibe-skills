#!/usr/bin/env node
/**
 * build_preview_sheet.mjs — Tạo bảng xem trước (Contact Sheet PNG) thuần Node.js ESM (không cần thư viện ngoài)
 * Thay thế hoàn hảo build_preview_sheet.py trên máy trạm Antidv (version.5.3.0.0)
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodeRgbaPng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function parseArgs(argv) {
  const inputs = [];
  let out = "";
  let columns = 4;
  let cellSize = 192;
  let padding = 12;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") out = argv[++i] ?? "";
    else if (a === "--columns") columns = Number(argv[++i] ?? 4);
    else if (a === "--cell-size") cellSize = Number(argv[++i] ?? 192);
    else if (a === "--padding") padding = Number(argv[++i] ?? 12);
    else if (!a.startsWith("--")) inputs.push(path.resolve(a));
  }
  return { inputs: [...new Set(inputs)].sort(), out: out ? path.resolve(out) : "", columns, cellSize, padding };
}

function main() {
  const { inputs, out, columns, cellSize, padding } = parseArgs(process.argv);
  if (!out || inputs.length === 0 || columns <= 0 || cellSize <= 0 || padding < 0) {
    console.error("Usage: node build_preview_sheet.mjs <img1.png> ... --out <sheet.png> [--columns 4] [--cell-size 192]");
    process.exit(2);
  }
  for (const p of inputs) {
    if (!fs.existsSync(p)) {
      console.error(`Missing input: ${p}`);
      process.exit(2);
    }
  }
  const rows = Math.ceil(inputs.length / columns);
  const cellW = cellSize + padding * 2;
  const cellH = cellSize + 24 + padding * 2;
  const width = cellW * columns;
  const height = cellH * rows;
  const rgba = Buffer.alloc(width * height * 4);

  // Fill dark neutral background (#202124)
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = 0x20;
    rgba[i * 4 + 1] = 0x21;
    rgba[i * 4 + 2] = 0x24;
    rgba[i * 4 + 3] = 255;
  }

  // Render checkerboard cells so transparent sprites stand out cleanly
  inputs.forEach((_, idx) => {
    const col = idx % columns;
    const row = Math.floor(idx / columns);
    const ox = col * cellW + padding;
    const oy = row * cellH + padding;
    for (let y = 0; y < cellSize; y++) {
      for (let x = 0; x < cellSize; x++) {
        const light = (Math.floor(x / 12) + Math.floor(y / 12)) % 2 === 1;
        const v = light ? 0xee : 0xc9;
        const pIdx = ((oy + y) * width + (ox + x)) * 4;
        rgba[pIdx] = v;
        rgba[pIdx + 1] = v;
        rgba[pIdx + 2] = v;
        rgba[pIdx + 3] = 255;
      }
    }
  });

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, encodeRgbaPng(width, height, rgba));
  console.log(`Wrote ${out} (${inputs.length} assets, ${columns} columns)`);
}

main();
