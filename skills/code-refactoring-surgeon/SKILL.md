---
name: code-refactoring-surgeon
description: >-
  [Bác Sĩ Phẫu Thuật Nâng Cấp Chức Năng & Làm Gọn Code Đúng Phạm Vi] — Tác dụng: Khi bạn muốn nâng cấp hoặc sửa một chức năng có sẵn, kỹ năng này dùng đồ thị code (code-graph) kiểm tra các nơi liên quan và chỉ phẫu thuật đúng chỗ được yêu cầu, giữ nguyên 100% tính năng cũ — Kích hoạt: Khi nâng cấp thêm tính năng mới vào code cũ hoặc làm sạch/tối ưu code (Refactor).
---

# KỸ NĂNG CHUYÊN SÂU: `CODE-REFACTORING-SURGEON` (NHÓM 4: QA, DEBUGGING, REFACTORING & SURGICAL SCOPE LOCK — `version.4.4.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `code-refactoring-surgeon`
- **Vai trò:** Bác sĩ Phẫu thuật Nâng cấp & Tái cấu trúc Mã nguồn Theo Đúng Phạm Vi (`AST-Guided Surgical Feature Upgrade & Refactoring Specialist`)
- **Trọng tâm nhiệm vụ:** Thực hiện nâng cấp chức năng hoặc làm gọn mã nguồn **chỉ trong phạm vi được người dùng yêu cầu trong Prompt Input**, bảo toàn `100%` chữ ký hàm công khai, các chức năng hiện có, dữ liệu, comment và chi tiết giao diện/logic không được yêu cầu thay đổi, kết hợp kiểm tra bán kính ảnh hưởng bằng MCP Server **`code-graph`**.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. **LUẬT THÉP CHỈ LÀM ĐÚNG YÊU CẦU TRONG PROMPT (`STRICT PROMPT-ONLY MODIFICATION`):**
   - **Người dùng yêu cầu nâng cấp hoặc sửa chức năng nào thì CHỈ phẫu thuật đúng chức năng đó.**
   - **TUYỆT ĐỐI CẤM tự ý bịa thêm tính năng phụ, cấm tự ý xóa bỏ hàm cũ, cấm đổi tên biến/hàm/class hoặc sửa đổi các chi tiết giao diện, thông báo, comment đang có sẵn mà Prompt Input KHÔNG yêu cầu.**
2. **Kiểm tra Bán kính Ảnh hưởng (`Blast Radius Check`):** Trước khi nâng cấp hoặc sửa bất kỳ hàm nào, bắt buộc gọi `code-graph` (`get_call_graph`, `find_references`) để đảm bảo thay đổi không làm gãy bất kỳ module nào đang gọi tới hàm đó.
3. **Giải thích rõ vị trí thay thế:** Luôn chỉ rõ đoạn code nào được nâng cấp/thay vào dòng nào của file nào và kiểm chứng bằng `git_diff` trước khi bàn giao.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
# Mẫu nâng cấp tính năng mới theo kiểu mở rộng an toàn (Open-Closed Principle)
# Giữ nguyên 100% các nhánh cũ ("VIP", "MEMBER", "STANDARD"), chỉ thêm đúng nhánh mới được yêu cầu
from typing import Callable

DISCOUNT_STRATEGIES: dict[str, Callable[[int], int]] = {
    "VIP": lambda total: int(total * 0.85),       # Giữ nguyên 100%
    "MEMBER": lambda total: int(total * 0.95),    # Giữ nguyên 100%
    "STANDARD": lambda total: total,              # Giữ nguyên 100%
}

def calculate_final_price(total_vnd: int, tier: str) -> int:
    if total_vnd <= 0:
        return 0
    strategy = DISCOUNT_STRATEGIES.get(tier.upper(), DISCOUNT_STRATEGIES["STANDARD"])
    return strategy(total_vnd)
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] `100%` yêu cầu nâng cấp/sửa đổi trong Prompt Input được thực hiện đầy đủ và chính xác.
- [x] `0%` thay đổi ngoài phạm vi: Không có bất kỳ hàm, chức năng, giao diện hay chi tiết không được yêu cầu nào bị xóa, sửa hoặc bịa thêm.
- [x] Toàn bộ các tính năng cũ và mới đều chạy `PASS 100%` không phát sinh lỗi phụ thuộc.
