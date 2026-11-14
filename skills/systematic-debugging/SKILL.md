---
name: systematic-debugging
description: >-
  [Phương Pháp Gỡ Lỗi Khoa Học 4 Pha & Phẫu Thuật Khoanh Vùng Dòng Lỗi Gốc] — Tác dụng: Cấm tuyệt đối đoán mò sửa đại; bắt buộc đi qua 4 pha: (1) Đọc Stack Trace & khoanh vùng dòng lỗi gốc bằng AST Code Graph ➔ (2) Đối chiếu mẫu ➔ (3) Kiểm tra giả thuyết tối thiểu ➔ (4) Phẫu thuật đúng phạm vi (Surgical Scope Lock) kèm 4 lớp bảo vệ & giữ nguyên 100% tính năng khác — Kích hoạt: Khi phần mềm báo lỗi, văng ứng dụng (Crash), test thất bại hoặc cần truy tìm nhanh dòng code gây lỗi.
---

# KỸ NĂNG CHUYÊN SÂU: `SYSTEMATIC-DEBUGGING` (`OBRA/SUPERPOWERS` + `SURGICAL ROOT-CAUSE DEBUGGER` — `version.5.2.0.0`)

## 1. Tổng Quan & 2 Luật Thép Bất Di Bất Dịch (`Overview & The Twin Iron Laws`)
- **Tên định danh (`Identifier`):** `systematic-debugging` *(Hợp nhất tinh hoa từ `obra/superpowers/systematic-debugging` + `systematic-root-cause-debugger`)*
- **Nguyên lý cốt lõi (`Core Principle`):** **LUÔN LUÔN tìm ra nguyên nhân gốc rễ (`Root Cause`) trước khi thử sửa lỗi VÀ chỉ phẫu thuật đúng phạm vi dòng lỗi được yêu cầu (`Strict Surgical Scope Lock`). Vá triệu chứng ngọn (`Symptom Fixes`) là thất bại.**
- **Tối ưu hóa riêng cho phần cứng máy trạm Antidv:**
  - **Hệ điều hành:** Windows 10/11 Pro (`PowerShell`, đường dẫn chuẩn `~\`).
  - **CPU:** Intel Xeon E5-2678 v3 (`12 nhân / 24 luồng`) — cho phép chạy kiểm thử cô lập (`Bisection / Parallel Test Runner`) tốc độ cao.
  - **RAM:** `64GB DDR4` — thoải mái thu thập `Heap Snapshot`, `Stack Trace` sâu và chạy đồng thời nhiều tiến trình kiểm chứng.
  - **GPU:** NVIDIA GTX 1660 Ti (`6GB VRAM`) — luôn kiểm tra giới hạn `6GB VRAM` khi gỡ lỗi AI/PyTorch/Ollama (`CUDA Out of Memory`).
  - **Hệ thống 27 MCP Servers phối hợp:** Tận dụng trực tiếp `code-graph` (truy vết đồ thị hàm), `sequential-thinking` (lập giả thuyết khoa học), `windows-mcp` (soi tiến trình/cửa sổ Windows), `chrome-devtools-mcp` / `browsentic` (soi Console/Network Web), `postgres-mcp` / `sqlite` (kiểm tra dữ liệu DB) và `ida-pro-mcp` / `ghidra-mcp` / `rea` / `frida` / `ios-mcp` (dịch ngược, iPhone & hook runtime).

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║  2 LUẬT THÉP BẤT DI BẤT DỊCH (THE TWIN IRON LAWS):                           ║
║  1. CẤM ĐOÁN MÒ SỬA BỪA: Không sửa code khi chưa điều tra xong Gốc Rễ (Pha 1)║
║  2. KHOANH VÙNG PHẪU THUẬT (STRICT SURGICAL SCOPE LOCK):                     ║
║     Chỉ sửa đúng 100% lỗi trong Prompt Input; CẤM tự ý thêm tính năng lạ,    ║
║     CẤM tự ý xóa/sửa/đổi tên hàm, biến, UI, comment đang hoạt động tốt!      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Khi Nào Bắt Buộc Kích Hoạt (`When to Use`)
Sử dụng cho **BẤT KỲ** sự cố kỹ thuật nào:
- Bài kiểm thử thất bại (`Test failures`), lỗi văng ứng dụng (`Crash / Exception`).
- Hành vi phần mềm sai lệch (`Unexpected behavior`), lỗi giao diện hoặc sai dữ liệu.
- Tắc nghẽn hiệu năng (`Performance bottleneck`), rò rỉ RAM (`Memory leak`) hoặc tràn `6GB VRAM` trên GTX 1660 Ti.
- Lỗi biên dịch/đóng gói (`Build failures`) hoặc lỗi tích hợp đa tầng (`API ➔ Backend ➔ Database / MCP / iPhone`).

**ĐẶC BIỆT BẮT BUỘC DÙNG KHI:**
- Đang chịu áp lực thời gian (càng gấp gáp càng dễ đoán mò làm hỏng thêm code).
- Nghĩ rằng *"chỉ cần sửa nhanh 1 dòng này là xong"* (`"Just one quick fix"`).
- Đã thử sửa `1 - 2 lần` nhưng lỗi vẫn còn hoặc phát sinh lỗi mới.

---

## 3. Quy Trình Gỡ Lỗi Khoa Học 4 Pha Bắt Buộc (`The Four Phases`)

Bạn **BẮT BUỘC** phải hoàn thành từng pha theo đúng thứ tự trước khi chuyển sang pha tiếp theo:

### 🔍 PHA 1: Điều Tra Nguyên Nhân Gốc Rễ (`Phase 1: Root Cause Investigation`)
**TRƯỚC KHI thử bất kỳ thay đổi code nào:**

1. **Đọc Kỹ Toàn Bộ Thông Báo Lỗi (`Read Error Messages Carefully`):**
   - Không bỏ qua bất kỳ dòng cảnh báo (`Warning`) hay lỗi (`Error`) nào.
   - Đọc trọn vẹn `Stack Trace` từ đầu đến cuối; ghi nhận chính xác tên file, số dòng (`line number`), tên hàm và mã lỗi.
2. **Tái Hiện Lỗi Nhất Quán (`Reproduce Consistently`):**
   - Xác định các bước chính xác để tái hiện lỗi (`Reproduction Steps`).
   - Nếu lỗi chập chờn (`Flaky`), tuyệt đối không đoán mò — hãy thu thập thêm dữ liệu hoặc xem tài liệu [`condition-based-waiting.md`](file:///~/.gemini/config/skills/systematic-debugging/condition-based-waiting.md).
3. **Kiểm Tra Các Thay Đổi Gần Đây (`Check Recent Changes`):**
   - Dùng MCP `git` (`git_status`, `git_diff`, `git_log`) để xem các thay đổi mã nguồn, cấu hình `.env` hoặc thư viện vừa cập nhật.
4. **Thu Thập Bằng Chứng Ở Hệ Thống Đa Tầng (`Gather Evidence in Multi-Component Systems`):**
   - Khi hệ thống có nhiều lớp (`UI ➔ API ➔ Service ➔ Database` hoặc `Agent ➔ MCP Server ➔ Windows OS / iPhone`), hãy chèn log chẩn đoán ở **biên giới mỗi tầng** trước khi đề xuất sửa:
   ```powershell
   # Ví dụ chẩn đoán đa tầng bằng PowerShell trên Windows 10/11 (Máy Antidv):
   Write-Host "=== [Tầng 1] Kiểm tra Biến môi trường & Cấu hình ===" -ForegroundColor Cyan
   Write-Host "PYTHONIOENCODING: $env:PYTHONIOENCODING"

   Write-Host "=== [Tầng 2] Kiểm tra Tài nguyên CPU Xeon (24 luồng) & RAM (64GB) ===" -ForegroundColor Cyan
   Get-Process python -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, WorkingSet64

   Write-Host "=== [Tầng 3] Kiểm tra VRAM GPU NVIDIA GTX 1660 Ti (6GB) ===" -ForegroundColor Cyan
   nvidia-smi --query-gpu=memory.used,memory.free,memory.total --format=csv
   ```
5. **Truy Vết Ngược Luồng Dữ Liệu & Khoanh Vùng Khung Lỗi Gốc (`Trace Data Flow Backward & Extract Root Frame`):**
   - Dùng MCP `code-graph` (`get_call_graph`, `find_references`) kết hợp quy trình trong [`root-cause-tracing.md`](file:///~/.gemini/config/skills/systematic-debugging/root-cause-tracing.md) để lần ngược từ nơi phát nổ lỗi về đúng **nơi khởi phát dữ liệu sai (`Original Trigger`)**.
   - Áp dụng mẫu trích xuất khung lỗi gốc (`RootCauseReport`) và khóa phạm vi dòng được phép sửa (`allowedScopeLines`) cho cả **Node.js ESM** (mặc định) lẫn **Python Agent SDK**:

```javascript
// extract_root_frame.mjs — Khoanh vùng chính xác dòng lỗi gốc cho dự án Node.js / TypeScript
export function extractJsRootFrame(err, padding = 5) {
  const stackLines = String(err?.stack ?? "").split(/\r?\n/);
  const frameLine = stackLines.find((l) => /\bat\s+.*:\d+:\d+/.test(l) && !l.includes("node:internal")) ?? "";
  const match = frameLine.match(/(?:at\s+(?:(.+?)\s+\()?)?(.+?):(\d+):(\d+)\)?$/);
  const lineNumber = match ? Number(match[3]) : 0;
  return {
    errorType: err?.name ?? "Error",
    functionName: match?.[1] ?? "<anonymous>",
    filePath: match?.[2] ?? "<unknown>",
    lineNumber,
    message: err?.message ?? String(err),
    allowedScopeLines: [Math.max(1, lineNumber - padding), lineNumber + padding],
  };
}
```

```python
import traceback
from dataclasses import dataclass

@dataclass
class RootCauseReport:
    error_type: str
    file_path: str
    line_number: int
    function_name: str
    message: str
    allowed_scope_lines: tuple[int, int]  # Chỉ cho phép sửa trong phạm vi dòng lỗi này

def extract_root_frame(exc: BaseException, padding: int = 5) -> RootCauseReport:
    tb_list = traceback.extract_tb(exc.__traceback__)
    last = tb_list[-1] if tb_list else None
    lineno = last.lineno if (last and last.lineno) else 0
    return RootCauseReport(
        error_type=type(exc).__name__,
        file_path=last.filename if last else "<unknown>",
        line_number=lineno,
        function_name=last.name if last else "<module>",
        message=str(exc),
        allowed_scope_lines=(max(1, lineno - padding), lineno + padding),
    )
```

---

### 🧩 PHA 2: Phân Tích Mẫu Đối Chiếu (`Phase 2: Pattern Analysis`)
1. **Tìm Mẫu Đang Chạy Tốt (`Find Working Examples`):** Dùng `code-graph` (`semantic_code_search`, `ast_search`) tìm các hàm/module tương tự trong dự án đang hoạt động đúng.
2. **Đối Chiếu Với Tài Liệu Chuẩn (`Compare Against References`):** Đọc trọn vẹn tài liệu/schema gốc (không đọc lướt).
3. **Liệt Kê Mọi Điểm Khác Biệt (`Identify Differences`):** So sánh từng dòng giữa nhánh chạy tốt và nhánh bị lỗi (kiểu dữ liệu, đường dẫn Windows `\` vs `/`, bảng mã `UTF-8`, quyền truy cập).
4. **Hiểu Rõ Phụ Thuộc (`Understand Dependencies`):** Kiểm tra toàn bộ nơi gọi hàm (`find_references`) để không làm gãy tính năng khác.

---

### 🧪 PHA 3: Lập Giả Thuyết & Kiểm Thử Tối Thiểu (`Phase 3: Hypothesis and Testing`)
Áp dụng phương pháp khoa học (kết hợp MCP `sequential-thinking`):
1. **Lập Một Giả Thuyết Rõ Ràng (`Form Single Hypothesis`):**
   - Phát biểu cụ thể: *"Tôi xác định `X` tại `file:dòng` là nguyên nhân gốc gây ra lỗi vì bằng chứng `Y`."*
2. **Thử Nghiệm Nhỏ Nhất Có Thể (`Test Minimally`):**
   - Chỉ thay đổi **MỘT biến số duy nhất** tại một thời điểm để kiểm chứng giả thuyết.
   - Tuyệt đối không sửa gộp nhiều chỗ cùng lúc.
3. **Kiểm Chứng Trước Khi Đi Tiếp (`Verify Before Continuing`):**
   - Nếu đúng ➔ Chuyển sang **Pha 4**.
   - Nếu sai ➔ **Hoàn tác (`Revert`) ngay lập tức**, quay lại phân tích bằng chứng mới và lập giả thuyết mới. Không chồng chất các bản vá lỗi lên nhau!

---

### 🛠️ PHA 4: Thực Thi Bản Vá Chuẩn Phẫu Thuật & Nghiệm Thu (`Phase 4: Surgical Implementation & Verification`)
1. **Tạo Bài Kiểm Thử Tái Hiện Lỗi (`Create Failing Test Case`):**
   - Viết bài test tự động (`pytest` / `vitest` / script tái hiện) chứng minh lỗi đang xảy ra trước khi sửa.
2. **Thực Thi Bản Vá Đơn Lẻ & Khóa Phạm Vi Phẫu Thuật (`Single Fix + Strict Surgical Scope Lock`):**
   - Sửa ngay tại **nguồn gốc phát sinh lỗi (`Root Cause`)**, không vá víu ở ngọn.
   - **LUẬT THÉP KHOANH VÙNG PHẪU THUẬT:** Chỉ thực hiện đúng `100%` yêu cầu sửa lỗi hoặc nâng cấp được nêu trong Prompt Input. **TUYỆT ĐỐI CẤM bịa thêm tính năng ngoài yêu cầu (`No Unrequested Features`), CẤM tự ý xóa, đổi tên, định dạng lại hoặc sửa các hàm, biến, giao diện, comment, cấu hình hay chi tiết logic đang hoạt động bình thường.**
   - Bổ sung **4 lớp phòng vệ sâu (`Defense-in-Depth`)** theo [`defense-in-depth.md`](file:///~/.gemini/config/skills/systematic-debugging/defense-in-depth.md) để lỗi không bao giờ tái diễn.
3. **Kiểm Chứng Thực Tế & Kiểm Toán `git_diff` (`Verify Fix & Zero-Regression Audit`):**
   - Chạy lại bài test vừa tạo (bắt buộc `PASS 100%`, `Exit Code: 0`) và chạy bộ test hồi quy (`Regression Test`) để chắc chắn không làm hỏng tính năng cũ (`100% Regression-Free`).
   - Kiểm tra bằng `git_diff` để xác nhận **100% các thay đổi chỉ nằm đúng ở phần được yêu cầu trong Prompt Input** (không có bất kỳ dòng code ngoài phạm vi nào bị xóa hay thay đổi ngoài ý muốn), đồng thời nâng cấp số phiên bản `version.x.x.x.x`.
4. **Quy Tắc Dừng Khi Thất Bại ≥ 3 Lần (`The 3-Strike Architecture Rule`):**
   - Nếu đã thử sửa **3 lần (`3 fixes`)** mà vẫn thất bại hoặc sửa chỗ này lại lòi ra lỗi chỗ khác: **DỪNG LẠI NGAY (`STOP`)!**
   - Đây là dấu hiệu của **vấn đề thiết kế kiến trúc (`Architectural Problem`)**, không phải lỗi đơn lẻ. Hãy báo cáo rõ ràng và thảo luận lại kiến trúc với người dùng trước khi thử lần thứ 4.

---

## 4. Cờ Đỏ Cảnh Báo & Danh Sách Nghiệm Thu (`Red Flags & Verification Checklist`)

| Dấu Hiệu Cờ Đỏ (`Red Flag` — Phải Dừng Lại Ngay!) | Hành Động Bắt Buộc (`Mandatory Action`) |
| :--- | :--- |
| *"Cứ sửa đại chỗ này xem có chạy không"* (`Shotgun Debugging`) | **DỪNG LẠI!** Quay về Pha 1 đọc `Stack Trace` & truy vết nguồn lỗi. |
| *"Sửa gộp 3-4 chỗ một lúc cho nhanh"* | **DỪNG LẠI!** Tách riêng từng giả thuyết, mỗi lần chỉ thử 1 thay đổi. |
| *"Tiện tay xóa/sửa luôn hàm bên cạnh cho đẹp"* | **DỪNG LẠI!** Vi phạm `Strict Surgical Scope Lock` — chỉ sửa đúng dòng lỗi trong Input. |
| *"Bỏ qua viết test, nhìn bằng mắt là được"* | **DỪNG LẠI!** Bắt buộc chạy script/test kiểm chứng thực tế. |
| *"Dùng `sleep(5)` / `setTimeout` để chờ hết lỗi bất đồng bộ"* | **DỪNG LẠI!** Áp dụng chờ theo điều kiện ([`condition-based-waiting.md`](file:///~/.gemini/config/skills/systematic-debugging/condition-based-waiting.md)). |
| *"Thử sửa thêm lần thứ 4 xem sao"* (sau khi đã thất bại 3 lần) | **DỪNG LẠI!** Đánh giá lại kiến trúc tổng thể và hỏi ý kiến người dùng. |

### Danh Sách Nghiệm Thu Bắt Buộc (`Verification Checklist`):
- [x] Chỉ rõ chính xác tên file, tên hàm, số dòng và nguyên nhân gốc gây ra lỗi trước khi sửa.
- [x] Kiểm tra `git_diff` xác nhận **100% các thay đổi chỉ nằm đúng ở phần được yêu cầu trong Prompt Input** (không tự ý xóa/sửa/bịa thêm bất kỳ chi tiết nào khác).
- [x] Các chức năng hiện có được giữ nguyên vẹn và hoạt động ổn định (`Zero Regression`).

### Bộ Tài Liệu & Công Cụ Đi Kèm Trong Thư Mục Này (`Supporting Techniques`):
- [`root-cause-tracing.md`](file:///~/.gemini/config/skills/systematic-debugging/root-cause-tracing.md) — Kỹ thuật truy vết ngược `Call Stack` tìm điểm kích hoạt lỗi ban đầu.
- [`defense-in-depth.md`](file:///~/.gemini/config/skills/systematic-debugging/defense-in-depth.md) — Kỹ thuật gia cố 4 lớp kiểm duyệt dữ liệu (`Entry ➔ Business ➔ Environment ➔ Debug`).
- [`condition-based-waiting.md`](file:///~/.gemini/config/skills/systematic-debugging/condition-based-waiting.md) & [`condition-based-waiting-example.ts`](file:///~/.gemini/config/skills/systematic-debugging/condition-based-waiting-example.ts) — Kỹ thuật thay thế `sleep`/`setTimeout` cảm tính bằng hàm chờ điều kiện thực tế.
- [`find-polluter.ps1`](file:///~/.gemini/config/skills/systematic-debugging/find-polluter.ps1) & [`find-polluter.sh`](file:///~/.gemini/config/skills/systematic-debugging/find-polluter.sh) — Script tự động chạy cô lập từng bài test trên Windows PowerShell / Bash để bắt tận tay bài test gây ô nhiễm trạng thái (`State/File Polluter`).
