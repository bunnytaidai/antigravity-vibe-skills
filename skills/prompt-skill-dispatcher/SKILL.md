---
name: prompt-skill-dispatcher
description: >-
  [Tổng Đài Phân Tích Prompt 4 Chiều, Thiết Kế System Rules & Điều Phối 82 Skills + 27 MCP Servers] — Tác dụng: Hợp nhất phân tích câu lệnh 4 chiều, thiết kế System Prompt/Rules (<identity>/<rules>), khóa phạm vi Input và tự động chọn đúng bộ công cụ trong 82 Kỹ năng + 27 MCP Servers (phân luồng chuẩn Node.js vs Python Agent SDK) — Kích hoạt: Luôn chạy đầu tiên ở Bước 1 với mọi câu lệnh hoặc khi thiết kế quy tắc cho AI.
---

# KỸ NĂNG CHUYÊN SÂU: `PROMPT-SKILL-DISPATCHER` (HỢP NHẤT `PROMPT-ENGINEERING-MASTER` + `GLOBAL DISPATCHER` — `version.5.3.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `prompt-skill-dispatcher` *(Đã hợp nhất trọn vẹn năng lực phân tích 4 chiều & thiết kế System Prompt của `prompt-engineering-master`)*
- **Vai trò:** Tổng Công Trình Sư Phân Tích Prompt, Thiết Kế System Rules, Phân Luồng Runtime (`Node.js` / `Python SDK`) & Điều Phối Toàn Cục (`Master Prompt Architect, Runtime Guard & Global Skill/MCP Router`)
- **Trọng tâm nhiệm vụ:** Phân tích đa chiều yêu cầu (`4D Prompt Analysis`) ngay ở Bước 1, kích hoạt mặc định **`strict-input-scope-guard`**, đối chiếu đồng thời với toàn bộ **82 Active Skills** trong kho (`66 Global` tại `~/.gemini\config\skills\` + `8 Plugin` tại `~/.gemini\config\plugins\` + `8 Built-in` tại `~/.gemini\antigravity\builtin\skills\`) VÀ **27 MCP Servers đang kết nối** (`750+ MCP Tools`), phát tín hiệu ngầm `[AG_BG_DISPATCH]` sang `Antigravity Background Tasks` và thiết kế các bộ `System Prompt / Rules` chuẩn bảo mật.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. **Phân tích Prompt 4 Chiều & Khóa Phạm Vi Ngay Ở Bước 1 (`4D Prompt Analysis + Scope Lock`):**
   - Bóc tách mọi câu lệnh theo 4 chiều: **(1) Mục tiêu cốt lõi & Hợp đồng phạm vi (`strict-input-scope-guard` — Luật 4 KHÔNG)**, **(2) Miền công nghệ & Runtime (`Node.js` vs `Python SDK`)**, **(3) Định tuyến Kỹ năng & MCP (`82 Skills + 27 MCPs`)**, và **(4) Tiêu chí nghiệm thu thực tế (`verification-before-completion`)**.
2. **Thiết Kế System Prompt & Chống Chèn Lệnh Độc (`Meta-Prompting & Prompt Injection Defense`):**
   - Khi viết hoặc nâng cấp quy tắc hệ thống (`GEMINI.md`, `rules/*.md`, Agent Prompt), bắt buộc phân tách ngữ nghĩa rõ ràng bằng thẻ `<identity>`, `<context>`, `<rules>`, `<examples>`, `<output_format>` để AI không bao giờ nhầm dữ liệu đầu vào với mệnh lệnh hệ thống; giữ dung lượng gọn dưới ngưỡng `<truncated>`.
3. **Luật Cổng Kiểm Tra 1% Cho Cả Skill & MCP (`1% Skill & MCP Trigger Rule`):** Nếu có dù chỉ `1%` khả năng một `Skill` trong kho hoặc một `MCP Server` đã kết nối phù hợp với yêu cầu, bắt buộc chọn kích hoạt đồng bộ cả `Skill` (`read_file` tệp `SKILL.md`) lẫn `MCP Server` (`read_file` Schema `.json` ➔ `call_mcp_tool`).
4. **Luật Phân Luồng Runtime Thông Minh (`Smart Runtime Routing: Node.js-First vs Python Agent SDK`):**
   - **Nhánh `Python` Bắt Buộc (`Mandatory Python`):** Khi yêu cầu liên quan đến **`google-antigravity-sdk`** (`google-antigravity` Python SDK), **`run-workflow`** (công cụ `run_workflow` chạy tiến trình `python3`), **`ios-pentesting-skill`** (`.venv\Scripts\python.exe`), **`ag-docs-sync`** (`sync_docs.py`), `ui-ux-pro-max` (`scripts/search.py`), hoặc dự án/kỹ năng Python chuyên biệt (`python-fastapi-pro`, `managing-python-dependencies`, `background-worker-celery`) ➔ **BẮT BUỘC giữ nguyên Python**, tuyệt đối không ép chuyển sang Node.js.
   - **Nhánh `Node.js` Mặc Định (`Node.js-First Default`):** Mọi tác vụ Web/React/Next.js, Backend Express/Fastify, Game Live TikTok, xử lý ảnh/video OpenCV/FFmpeg và script CLI đa năng đều mặc định ưu tiên **`Node.js ESM` (`.mjs`)**.
5. **Giao thức `Zero Chat Banner` & Tiết kiệm Token (`Progressive Disclosure`):** Chỉ gọi `read_file` nạp các tệp `SKILL.md` và Schema MCP thực sự được chọn kích hoạt; phát đúng 1 dòng log `[AG_BG_DISPATCH] SKILLS=... | MCPS=... | SCOPE=...` ở dòng đầu tiên của `thinking` (tuyệt đối không in bảng điều phối lên khung Chat).
6. **Cầu nối Mở rộng Hệ sinh thái Mở (`External Ecosystem Escalation via find-skills`):** Khi người dùng hỏi tìm/so sánh/cài đặt kỹ năng mới trên mạng, tự động kích hoạt **`find-skills`** để tra cứu bảng xếp hạng `https://skills.sh/` (`npx skills find`), thẩm định độ uy tín (`>= 1K installs`) và hỏi ý kiến người dùng trước khi ghi đè skill tự tạo.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern — Node.js ESM Ecosystem Scanner`)
- **Công cụ CLI đi kèm:** Chạy `node "~/.gemini\config\skills\prompt-skill-dispatcher\scripts\dispatch_audit.mjs"` để thống kê tức thì toàn bộ Global, Plugin, Built-in Skills và 27 MCP Servers.

```javascript
// discover_ecosystem.mjs — Quét đủ 3 tầng Skills (Global + Plugin + Built-in) & 27 MCP Servers
import fs from "node:fs";
import path from "node:path";

export function discoverSkillsAndMcpEcosystem({
  globalDir = "~/.gemini\\config\\skills",
  pluginsDir = "~/.gemini\\config\\plugins",
  builtinDir = "~/.gemini\\antigravity\\builtin\\skills",
  mcpDir = "~/.gemini\\antigravity\\mcp",
} = {}) {
  const seen = new Set();
  const skills = [];

  const collectSkill = (skillMd, tier) => {
    if (!fs.existsSync(skillMd)) return;
    const text = fs.readFileSync(skillMd, "utf8");
    const nameMatch = text.match(/^name:\s*(.+)$/m);
    const id = nameMatch ? nameMatch[1].trim().replace(/^["']|["']$/g, "") : path.basename(path.dirname(skillMd));
    if (seen.has(id)) return; // Global overrides Built-in cleanly
    seen.add(id);
    skills.push({ id, tier, path: skillMd });
  };

  if (fs.existsSync(globalDir)) {
    for (const d of fs.readdirSync(globalDir, { withFileTypes: true })) {
      if (d.isDirectory()) collectSkill(path.join(globalDir, d.name, "SKILL.md"), "global");
    }
  }
  if (fs.existsSync(pluginsDir)) {
    for (const p of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
      const sRoot = path.join(pluginsDir, p.name, "skills");
      if (p.isDirectory() && fs.existsSync(sRoot)) {
        for (const s of fs.readdirSync(sRoot, { withFileTypes: true })) {
          if (s.isDirectory()) collectSkill(path.join(sRoot, s.name, "SKILL.md"), `plugin:${p.name}`);
        }
      }
    }
  }
  if (fs.existsSync(builtinDir)) {
    for (const b of fs.readdirSync(builtinDir, { withFileTypes: true })) {
      if (b.isDirectory()) collectSkill(path.join(builtinDir, b.name, "SKILL.md"), "builtin");
    }
  }

  const mcpServers = {};
  if (fs.existsSync(mcpDir)) {
    for (const srv of fs.readdirSync(mcpDir, { withFileTypes: true })) {
      if (srv.isDirectory()) {
        mcpServers[srv.name] = fs.readdirSync(path.join(mcpDir, srv.name))
          .filter((f) => f.endsWith(".json"))
          .map((f) => path.basename(f, ".json"));
      }
    }
  }

  return { totalActiveSkills: skills.length, skills, totalMcpServers: Object.keys(mcpServers).length, mcpServers };
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Quét đầy đủ `100%` kho kỹ năng 3 tầng (`66 Global + 8 Plugin + 8 Built-in = 82 Active Skills`) và `27 MCP Servers`.
- [x] Phân luồng chuẩn xác `Python` cho `google-antigravity-sdk` / `run-workflow` / `.venv` và `Node.js ESM` cho các tác vụ còn lại.
- [x] Ghi nhận ngầm tên kỹ năng và MCP Server đang kích hoạt qua `[AG_BG_DISPATCH]` sang kênh `Output ➔ Antigravity Background Tasks` (tuyệt đối không in bảng điều phối lên Chat).
