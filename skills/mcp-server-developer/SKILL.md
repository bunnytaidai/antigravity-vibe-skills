---
name: mcp-server-developer
description: >-
  [Kỹ Sư Cầu Nối & Chế Tạo Máy Chủ MCP Server Chuẩn Anthropic (27 Active MCPs — 141K+ Installs)] — Tác dụng: Quản trị kết nối 27 MCP Servers trên máy Antidv, đồng bộ mcp_config.json và xây dựng MCP Server mới chất lượng cao bằng Node.js/TypeScript (@modelcontextprotocol/server v2) hoặc Python (FastMCP) theo quy trình 4 Pha chính chủ Anthropic — Kích hoạt: Khi kiểm tra kết nối MCP, sửa lỗi công cụ hoặc lập trình MCP Server mới.
---

# KỸ NĂNG CHUYÊN SÂU: `MCP-SERVER-DEVELOPER` (HỢP NHẤT `ANTHROPICS/MCP-BUILDER` + HỆ THỐNG `27 MCP SERVERS` ANTIDV — `version.5.3.0.0`)

> [!NOTE]
> **📌 Chú thích Tiếng Việt cho Newbie:**
> - **Tác dụng kép:** Vừa quản trị an toàn **27 MCP Servers (`750+ Tools`)** đang kết nối sẵn trên máy trạm Antidv, vừa tích hợp trọn bộ **Quy trình 4 Pha chế tạo MCP Server mới chính chủ từ Anthropic** (`141.9K+` lượt cài trên `skills.sh`, tài liệu chuyên sâu nằm trong `./reference/`).
> - **Ưu tiên Runtime khi viết MCP Server mới:** Mặc định ưu tiên **`Node.js / TypeScript`** (`@modelcontextprotocol/server` v2 hoặc `@modelcontextprotocol/sdk` v1) theo chuẩn `Node.js-First`; dùng **`Python` (`FastMCP` / `mcp`)** khi cần bọc trực tiếp thư viện C++/Python đặc thù.

---

## 1. 4 Quy Tắc Sống Còn Khi Vận Hành & Phát Triển MCP (`Mandatory Rules`)

1. **Cấm Tuyệt Đối Ghi Bẩn Ra `stdout` Trên Giao Thức `stdio` (`Zero Stdout Pollution`):**
   - Trong máy chủ MCP chạy qua `stdio`, luồng `stdout` chỉ được truyền gói tin `JSON-RPC 2.0` thuần khiết. Tuyệt đối **CẤM dùng `console.log()` (Node.js) hoặc `print()` (Python)** — mọi dòng log gỡ lỗi bắt buộc ghi ra **`console.error()` / `process.stderr` / `sys.stderr`**.
2. **Đọc Schema Trước Khi Gọi (`Schema-First Invocation`):**
   - Trước khi gọi bất kỳ công cụ MCP dạng `Lazy` nào qua `call_mcp_tool`, Agent bắt buộc dùng `read_file` đọc tệp Schema tại `~/.gemini\antigravity\mcp\<serverName>\<toolName>.json` để truyền khớp `100%` tên tham số và kiểu dữ liệu.
3. **Đồng Bộ Cấu Hình Kép (`Dual Config Sync`):**
   - Giữ đồng bộ giữa [`~/.gemini\config\mcp_config.json`](file:///~/.gemini/config/mcp_config.json) và [`~/.gemini\antigravity\mcp_config.json`](file:///~/.gemini/antigravity/mcp_config.json), ưu tiên đường dẫn tuyệt đối tới trình thực thi (`windows-mcp.exe`, `ida-pro-mcp.exe`, `github-mcp-server.exe`, `node`, `npx`).
4. **Quy Trình 4 Pha Chế Tạo MCP Server Mới (`Anthropic 4-Phase MCP Builder`):**
   - **Pha 1 (Thiết kế):** Đặt tên công cụ nhất quán có tiền tố dịch vụ (`service_action_resource`), hỗ trợ phân trang/lọc dữ liệu gọn nhẹ.
   - **Pha 2 (Lập trình):** Kiểm tra đầu vào bằng **`Zod`** (Node.js/TS — xem [`./reference/node_mcp_server_v2.md`](file:///~/.gemini/config/skills/mcp-server-developer/reference/node_mcp_server_v2.md)) hoặc **`Pydantic`** (Python — xem [`./reference/python_mcp_server.md`](file:///~/.gemini/config/skills/mcp-server-developer/reference/python_mcp_server.md)); gắn đầy đủ nhãn an toàn `annotations` (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) và trả lỗi `isError: true` kèm gợi ý cách sửa rõ ràng thay vì làm sập server.
   - **Pha 3 & 4 (Kiểm thử & Đánh giá):** Kiểm tra biên dịch, test qua `npx @modelcontextprotocol/inspector` và bộ tiêu chí tại [`./reference/mcp_best_practices.md`](file:///~/.gemini/config/skills/mcp-server-developer/reference/mcp_best_practices.md) & [`./reference/evaluation.md`](file:///~/.gemini/config/skills/mcp-server-developer/reference/evaluation.md).

---

## 2. Mẫu Triển khai Chuẩn Thực chiến (`Node.js ESM MCP Safe Logger & Schema Auditor`)
```javascript
// mcp_health_utils.mjs — Ghi log an toàn qua stderr & kiểm kê toàn bộ kho Schema MCP trên máy Antidv
import fs from "node:fs";
import path from "node:path";

export function logMcpStderr(message) {
  // BẮT BUỘC ghi ra stderr để bảo toàn tuyệt đối luồng JSON-RPC 2.0 trên stdout
  process.stderr.write(`[MCP-SERVER] ${message}\n`);
}

export function verifyMcpSchemaInventory(mcpRoot = "~/.gemini\\antigravity\\mcp") {
  const inventory = {};
  if (!fs.existsSync(mcpRoot)) return inventory;
  for (const srv of fs.readdirSync(mcpRoot, { withFileTypes: true })) {
    if (srv.isDirectory()) {
      inventory[srv.name] = fs.readdirSync(path.join(mcpRoot, srv.name)).filter((f) => f.endsWith(".json")).length;
    }
  }
  return inventory;
}
```

## 3. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Luồng `stdout` sạch `100%`, chỉ phát duy nhất các gói tin `JSON-RPC 2.0` hợp lệ; mọi log nằm ở `stderr`.
- [x] Mọi công cụ mới đều có `inputSchema` chặt chẽ (`Zod` / `Pydantic`), nhãn `readOnlyHint` / `destructiveHint` rõ ràng và bắt lỗi trả về `isError: true` êm ái.
- [x] Tệp `mcp_config.json` hợp lệ JSON `100%` và gọi thử thành công qua `call_mcp_tool`.
