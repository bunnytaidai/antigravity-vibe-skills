---
name: skill-creator-pro
description: >-
  [Nhà Máy Thiết Kế & Kiểm Định Kỹ Năng Mới (SKILL.md)] — Tác dụng: Tự động soạn thảo, nâng cấp và kiểm tra chất lượng các tệp kỹ năng SKILL.md đảm bảo đúng chuẩn Antigravity IDE, có code mẫu chạy được ngay — Kích hoạt: Khi tạo kỹ năng mới, nâng cấp chú thích hoặc kiểm tra kho Skills.
---

# KỸ NĂNG CHUYÊN SÂU: `SKILL-CREATOR-PRO` (NHÓM 4: AI AGENT, PROMPT ENGINEERING & MCP SYSTEM — `version.5.2.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `skill-creator-pro`
- **Vai trò:** Kiến trúc sư Thiết kế, Kiểm định Đa Dòng YAML & Chuẩn hóa Kỹ năng Antigravity (`Antigravity Skill Factory & Multi-line YAML QA Validator`)
- **Trọng tâm nhiệm vụ:** Tự động thiết kế, kiểm duyệt siêu dữ liệu `YAML Frontmatter` (`name`, `description` đơn dòng & đa dòng `>-` / `|`), chuẩn hóa chú thích Tiếng Việt (`[Tiêu đề] — Tác dụng: ... — Kích hoạt: ...`), phân định đúng Runtime (`Node.js ESM` mặc định vs `Python` cho `google-antigravity-sdk` / `run-workflow` / `.venv`), và kiểm chứng toàn bộ kho `SKILL.md` qua CLI `scripts/validate_skills.mjs`.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Mọi tệp `SKILL.md` bắt buộc mở đầu bằng khối `---` YAML Frontmatter chứa đúng `name` (khớp `100%` với tên thư mục chứa nó) và `description` Tiếng Việt theo chuẩn `[Tiêu đề Tiếng Việt] — Tác dụng: ... — Kích hoạt: ...`.
2. **Xử lý chuẩn xác YAML Đa Dòng (`Multiline Folded/Literal Block Scalar`):** Bộ kiểm định bắt buộc đọc trọn vẹn các dòng thụt lề bên dưới `description: >-` hoặc `description: |` (tuyệt đối không dùng regex đơn dòng `^description:\s*(.+)$` làm bắt nhầm ký tự `>-` báo lỗi giả).
3. **Nghiêm cấm sao chép rập khuôn (`Zero Template Cloning`) & Tôn trọng Runtime Gốc:** Mặc định viết script phụ trợ bằng `Node.js ESM` (`.mjs`), nhưng **bắt buộc giữ nguyên `Python`** cho các kỹ năng thuộc hệ sinh thái `google-antigravity-sdk`, `run-workflow`, `ios-pentesting-skill` (`.venv`), `ag-docs-sync` và nhóm kỹ năng Python chuyên sâu.
4. Giữ độ dài tệp `SKILL.md` tinh gọn (`40 - 160 dòng`), tách tài liệu dài sang `references/` và công cụ chạy thực tế sang `scripts/` (`Progressive Disclosure`).

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern — Node.js ESM & Multiline YAML`)
- **Công cụ CLI đi kèm:** Chạy `node "~/.gemini\config\skills\skill-creator-pro\scripts\validate_skills.mjs"` để quét kiểm định toàn bộ kho Global & Plugin Skills + đối chiếu `manifest.json`.

```javascript
// validate_skill_unit.mjs — Kiểm định chuẩn xác YAML đơn dòng & đa dòng (>- / > / |)
import fs from "node:fs";
import path from "node:path";

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
  if (!fs.existsSync(skillMdPath)) return { ok: false, errors: ["Không tìm thấy tệp SKILL.md"] };
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
      errors.push("Trường description quá ngắn (< 20 ký tự) hoặc bị thiếu");
    }
  }
  return { ok: errors.length === 0, errors, meta: fm };
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Chạy `node scripts/validate_skills.mjs` đạt `PASS 100%` (`Exit Code: 0`) trên toàn bộ thư mục `~/.gemini\config\skills\` và `~/.gemini\config\plugins\`.
- [x] Kiểm tra mã băm `SHA-256` phần thân của toàn bộ các Skills đảm bảo không trùng lặp rập khuôn và đồng bộ `manifest.json` qua `skill-repair`.
- [x] Bảng mã lưu file đạt chuẩn `UTF-8` hiển thị tiếng Việt hoàn hảo, không còn lỗi đọc sót `description: >-`.
