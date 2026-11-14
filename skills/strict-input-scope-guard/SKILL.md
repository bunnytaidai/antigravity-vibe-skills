---
name: strict-input-scope-guard
description: >-
  [Chốt Chặn Khóa Chặt Phạm Vi Input - Luật 4 KHÔNG] — Tác dụng: Ép AI chỉ được làm đúng 100% những gì bạn yêu cầu; TUYỆT ĐỐI CẤM tự ý thêm tính năng lạ, cấm tự ý sửa code đang chạy tốt, cấm tự ý xóa hàm/comment cũ và cấm bịa đặt — Kích hoạt: Luôn chạy ở Bước 1 trước mọi thao tác viết mới, sửa lỗi hay nâng cấp code.
---

# KỸ NĂNG CHUYÊN SÂU: `STRICT-INPUT-SCOPE-GUARD` (NHÓM ĐẶC BIỆT: AGENT PROMPT LOCK & ZERO UNREQUESTED CHANGES — `version.5.2.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `strict-input-scope-guard`
- **Vai trò:** Chốt Chặn Khóa Chặt Phạm Vi Đầu Vào & Kiểm Soát Vi Phạm Phạm Vi (`Step-1 Strict Input-Adherence, AST Scope Freeze & Anti-Hallucination Enforcer`)
- **Trọng tâm nhiệm vụ:** Giải quyết triệt để căn bệnh tự ý vẽ vời (`Scope Creep / Gold Plating`), tự ý xóa/sửa code đang chạy tốt (`Collateral Damage`) và đoán mò (`Hallucination`) của AI. Kích hoạt **ngay ở Bước 1 với mọi Prompt** để thiết lập **Hợp đồng Phạm vi Đầu vào (`Input Scope Contract`)** khóa cứng mọi thành phần ngoài yêu cầu trước khi bất kỳ công cụ sửa file nào (`edit_file`, `write_file`) được phép thực thi.

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║  LUẬT THÉP 4 KHÔNG (THE FOUR ZERO-TOLERANCE PROHIBITIONS):                   ║
║  1. KHÔNG TỰ Ý THÊM (No Unrequested Additions): Cấm thêm hàm, nút bấm,       ║
║     trường dữ liệu, hiệu ứng hay tính năng phụ không được yêu cầu trong Input║
║  2. KHÔNG TỰ Ý SỬA (No Unrequested Edits): Cấm đổi tên biến/hàm/class,       ║
║     cấm sửa câu chữ UI, cấm format lại các dòng code ngoài vùng yêu cầu.     ║
║  3. KHÔNG TỰ Ý XÓA (No Unrequested Deletions): Cấm xóa hàm cũ, nhánh logic   ║
║     cũ, cấu hình, docstring hay comment đang có sẵn khi chưa được yêu cầu.   ║
║  4. KHÔNG BỊA ĐẶT (Zero Hallucination): Cấm đoán mò tên file, hàm, bảng DB   ║
║     khi chưa dùng công cụ (read_file, code-graph, postgres-mcp) đọc thực tế. ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory 3-Stage Enforcement Rules`)

### 🔒 Giai Đoạn 1: Lập Hợp Đồng Phạm Vi Ngay Ở Bước 1 (`Stage 1: Pre-Execution Input Scope Contract`)
Trước khi chạm vào bất kỳ tệp mã nguồn nào, Agent **BẮT BUỘC** xác định rõ 2 danh sách:
1. **Danh Sách Cho Phép (`Allowed Target Scope`):**
   - Liệt kê chính xác những yêu cầu người dùng nêu trực tiếp trong `<USER_REQUEST>`.
   - Xác định rõ tên file, tên hàm/class và khoảng dòng (`line range`) được phép thêm/sửa.
2. **Danh Sách Đóng Băng Bất Khả Xâm Phạm (`Frozen Read-Only Zone`):**
   - Toàn bộ các file khác, các hàm khác trong cùng file, chữ ký hàm công khai (`Public Function Signatures`), giao diện hiện có, câu thông báo, biến môi trường và comment không được nhắc tới trong Prompt đều ở trạng thái **`FROZEN (CHỈ ĐỌC — CẤM CHẠM)`**.
   - Nếu yêu cầu của người dùng có điểm mơ hồ dẫn đến nhiều cách hiểu: **Hỏi lại ngay (`ask_question` hoặc văn bản ngắn gọn)** chứ tuyệt đối không tự suy diễn làm bừa.

### 🔬 Giai Đoạn 2: Khảo Sát Thực Tế & Thực Thi Phẫu Thuật (`Stage 2: Grounded Surgical Execution`)
1. **Bắt buộc đọc trước khi sửa (`Read-Before-Write`):** Luôn gọi `read_file` và MCP `code-graph` (`get_ast_node`, `find_references`) để xem chính xác mã nguồn thực tế trước khi gọi `edit_file`.
2. **Thao tác tối thiểu (`Minimal Diff Principle`):** Chỉ truyền đúng đoạn văn bản nhỏ nhất cần thay thế vào `Target` của `edit_file`. Không ghi đè toàn bộ file lớn bằng `write_file(Overwrite=true)` khi chỉ cần sửa vài dòng.

### 🧾 Giai Đoạn 3: Kiểm Toán `git_diff` Trước Khi Hoàn Tất (`Stage 3: Pre-Completion Diff Audit`)
Ngay sau khi sửa file (kết hợp cùng kỹ năng `verification-before-completion`):
1. Kiểm tra lại toàn bộ các dòng vừa thêm (`+`) và xóa (`-`).
2. Đặt câu hỏi kiểm toán cho **từng dòng thay đổi**: *"Dòng thay đổi này phục vụ cho câu chữ nào trong Prompt Input của người dùng?"*
3. Nếu bất kỳ dòng thay đổi nào không trả lời được câu hỏi trên ➔ **Bắt buộc hoàn tác (`Revert`) dòng đó ngay lập tức** trước khi phản hồi người dùng.

---

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern: Input-to-Diff Scope Auditor — Node.js ESM & Python`)
- **Luật Bảo vệ Runtime Gốc (`Runtime Boundary Lock`):** Khi người dùng yêu cầu ưu tiên một ngôn ngữ (ví dụ `Node.js`), Agent bắt buộc kiểm tra ranh giới kỹ thuật trước khi đổi: **TUYỆT ĐỐI CẤM tự ý ép chuyển sang Node.js** đối với các thành phần khóa cứng trên Python như `google-antigravity-sdk` (`google-antigravity`), `run-workflow` (`python3`), hoặc môi trường `.venv` có thư viện C++ đặc thù (`lief` trong `ios-pentesting-skill`).

```javascript
// scope_auditor.mjs — Kiểm toán tự động đảm bảo 0% thay đổi ngoài phạm vi Prompt Input (Node.js ESM)
export function verifyDiffAgainstContract({
  allowedFiles = [],
  allowDeletion = false,
  modifiedFiles = [],
  deletedSymbols = [],
  unrequestedAddedSymbols = [],
}) {
  const allowedSet = new Set(allowedFiles);
  const violations = [];

  for (const file of modifiedFiles) {
    if (!allowedSet.has(file)) {
      violations.push(`[VI PHẠM PHẠM VI FILE] Tự ý sửa file không được yêu cầu: ${file}`);
    }
  }
  if (!allowDeletion && deletedSymbols.length > 0) {
    violations.push(`[VI PHẠM TỰ Ý XÓA] Tự ý xóa hàm/biến cũ khi chưa xin phép: ${deletedSymbols.join(", ")}`);
  }
  if (unrequestedAddedSymbols.length > 0) {
    violations.push(`[VI PHẠM TỰ Ý BỊA THÊM] Tự ý thêm hàm/tính năng ngoài Prompt: ${unrequestedAddedSymbols.join(", ")}`);
  }
  return { ok: violations.length === 0, violations };
}
```

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class InputScopeContract:
    """Hợp đồng khóa chặt phạm vi thực thi theo đúng Prompt Input (dành cho Python Agent SDK)."""
    explicit_user_requests: tuple[str, ...]
    allowed_files: tuple[str, ...]
    allowed_symbols: tuple[str, ...]
    allow_deletion: bool = False  # Mặc định CẤM XÓA nếu người dùng không yêu cầu xóa

def verify_diff_against_contract(
    contract: InputScopeContract,
    modified_files: list[str],
    deleted_symbols: list[str],
    unrequested_added_symbols: list[str],
) -> tuple[bool, list[str]]:
    """Kiểm toán tự động đảm bảo 0% thay đổi ngoài phạm vi Prompt Input."""
    violations: list[str] = []

    for f in modified_files:
        if f not in contract.allowed_files:
            violations.append(f"[VI PHẠM PHẠM VI FILE] Tự ý sửa file không được yêu cầu: {f}")

    if not contract.allow_deletion and deleted_symbols:
        violations.append(f"[VI PHẠM TỰ Ý XÓA] Tự ý xóa hàm/biến cũ khi không được yêu cầu: {deleted_symbols}")

    if unrequested_added_symbols:
        violations.append(f"[VI PHẠM TỰ Ý BỊA THÊM] Tự ý thêm hàm/tính năng ngoài Prompt: {unrequested_added_symbols}")

    return len(violations) == 0, violations
```

---

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] `100%` hành động của Agent đều bắt nguồn trực tiếp từ câu chữ trong `<USER_REQUEST>`.
- [x] `0%` tính năng tự bịa (`Zero Unrequested Features`), `0%` sửa đổi ngoài lề (`Zero Unrequested Edits`), `0%` xóa bỏ trái phép (`Zero Unrequested Deletions`).
- [x] Mọi thông tin về file, hàm, bảng Database hoặc trạng thái hệ thống đều được trích xuất từ kết quả công cụ thực tế (`100% Grounded Evidence`).

