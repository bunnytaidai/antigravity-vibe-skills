#!/usr/bin/env node
/**
 * validate_skills.mjs — Bộ kiểm định toàn cục kho Skills Antigravity IDE (version.5.2.0.0)
 * Hỗ trợ đọc chuẩn xác YAML đơn dòng & đa dòng (>- / > / | / |-) + kiểm tra chú thích Tiếng Việt + đồng bộ manifest.json.
 */
import fs from "node:fs";
import path from "node:path";

const GLOBAL_DIR = "~/.gemini\\config\\skills";
const PLUGINS_DIR = "~/.gemini\\config\\plugins";
const MANIFEST_PATH = path.join(GLOBAL_DIR, "manifest.json");

const VIET_CHAR_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

export function parseSkillFrontmatter(rawText) {
  const match = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const lines = match[1].split(/\r?\n/);
  const data = {};
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawVal] = kv;
    const trimmed = rawVal.trim();
    if ([">-", ">", "|", "|-"].includes(trimmed)) {
      const block = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
        block.push(lines[++i].trim());
      }
      data[key] = block.join(" ").trim();
    } else {
      data[key] = trimmed.replace(/^["']|["']$/g, "");
    }
  }
  return data;
}

export function validateAntigravitySkill(skillMdPath) {
  const errors = [];
  const warnings = [];
  if (!fs.existsSync(skillMdPath)) {
    return { ok: false, errors: ["Không tìm thấy tệp SKILL.md"], warnings, meta: null };
  }
  const text = fs.readFileSync(skillMdPath, "utf8");
  const fm = parseSkillFrontmatter(text);
  const folderName = path.basename(path.dirname(skillMdPath));

  if (!fm) {
    errors.push("Thiếu khối YAML Frontmatter mở đầu bằng ---");
  } else {
    if (!fm.name || fm.name !== folderName) {
      errors.push(`Trường name ('${fm.name ?? ""}') không khớp tên thư mục '${folderName}'`);
    }
    if (!fm.description || fm.description.length < 20) {
      errors.push(`Trường description quá ngắn (${fm.description?.length ?? 0} ký tự) hoặc bị thiếu`);
    } else if (!VIET_CHAR_RE.test(fm.description)) {
      warnings.push("Trường description chưa được chú thích Tiếng Việt");
    }
  }

  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  if (!VIET_CHAR_RE.test(body)) {
    warnings.push("Phần thân SKILL.md chưa có chú thích Tiếng Việt");
  }

  return { ok: errors.length === 0, errors, warnings, meta: fm };
}

function main() {
  const targets = [];

  if (fs.existsSync(GLOBAL_DIR)) {
    for (const d of fs.readdirSync(GLOBAL_DIR, { withFileTypes: true })) {
      if (d.isDirectory()) {
        targets.push({ scope: "global", id: d.name, path: path.join(GLOBAL_DIR, d.name, "SKILL.md") });
      }
    }
  }

  if (fs.existsSync(PLUGINS_DIR)) {
    for (const p of fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })) {
      if (!p.isDirectory()) continue;
      const skillsSub = path.join(PLUGINS_DIR, p.name, "skills");
      if (!fs.existsSync(skillsSub)) continue;
      for (const s of fs.readdirSync(skillsSub, { withFileTypes: true })) {
        if (s.isDirectory()) {
          targets.push({ scope: `plugin:${p.name}`, id: s.name, path: path.join(skillsSub, s.name, "SKILL.md") });
        }
      }
    }
  }

  let failed = 0;
  let warnCount = 0;
  const manifest = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")).skills ?? {}
    : {};

  for (const t of targets) {
    const res = validateAntigravitySkill(t.path);
    if (t.scope === "global") {
      const mEntry = manifest[t.id];
      if (!mEntry || mEntry.status !== "installed" || mEntry.error !== null) {
        res.errors.push(`Chưa đồng bộ trạng thái 'installed' sạch lỗi trong manifest.json`);
        res.ok = false;
      }
    }
    if (!res.ok) {
      failed++;
      console.error(`❌ [FAIL] [${t.scope}] ${t.id}: ${res.errors.join(" | ")}`);
    } else if (res.warnings.length > 0) {
      warnCount++;
      console.warn(`⚠️ [WARN] [${t.scope}] ${t.id}: ${res.warnings.join(" | ")}`);
    }
  }

  console.log(
    `✅ Đã kiểm định ${targets.length} Skills (Global + Plugin): ${targets.length - failed}/${targets.length} PASS | ${failed} lỗi | ${warnCount} cảnh báo chú thích.`
  );
  process.exit(failed > 0 ? 1 : 0);
}

main();
