---
name: windows-computer-use
description: >-
  [Chuyên Gia Điều Khiển Màn Hình, Chuột, Phím & Ứng Dụng Windows Tự Động] — Tác dụng: Sử dụng 21 công cụ của windows-mcp để nhìn màn hình, mở phần mềm, bấm chuột, gõ phím (dán qua Clipboard chống lỗi dấu tiếng Việt UniKey) và đóng ứng dụng an toàn theo đúng mã PID — Kích hoạt: Khi điều khiển máy tính Windows hoặc tự động hóa thao tác trên phần mềm Desktop.
---

# KỸ NĂNG CHUYÊN SÂU: `WINDOWS-COMPUTER-USE` (NHÓM 4: AI AGENT, PROMPT ENGINEERING & MCP SYSTEM — `version.4.2.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `windows-computer-use`
- **Vai trò:** Chuyên gia Điều khiển Máy tính Windows & Tự động hóa GUI (`Windows-MCP 21-Tools Automation Specialist`)
- **Trọng tâm nhiệm vụ:** Phối hợp bắt buộc với MCP Server **`windows-mcp`** (`~\.local\bin\windows-mcp.exe serve`) để vận hành chuẩn xác 21 công cụ điều khiển Windows 10/11 (`ControlStatus`, `DisplayInventory`, `Screenshot`, `Snapshot`, `App`, `Click`, `Type`, `Move`, `Scroll`, `Shortcut`, `WaitFor`, `Wait`, `Scrape`, `MultiSelect`, `MultiEdit`, `Clipboard`, `Registry`, `Process`, `Notification`, `FileSystem`, `PowerShell`) theo quy trình 5 bước an toàn.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. **Tuân thủ quy trình 5 bước bất di bất dịch:**
   - **(Bước 1)** `ControlStatus` / `DisplayInventory` (kiểm tra quyền điều khiển chuột/phím & danh sách màn hình)
   - **(Bước 2)** `Screenshot` (nhìn nhanh bố cục) hoặc `Snapshot` (lấy mã `label` phần tử UIA; bật `use_dom=True` nếu là trình duyệt)
   - **(Bước 3)** `App(mode='switch'|'launch')` + `Click` / `Type` / `Move` / `Shortcut` / `MultiEdit`
   - **(Bước 4)** `WaitFor` đồng bộ trạng thái (`active_window`, `element_exists`, `text_exists`)
   - **(Bước 5)** Nghiệm thu bằng `Screenshot` & chỉ đóng ứng dụng thử nghiệm theo đúng `PID` đã mở (`Process(mode='kill', pid=...)`).
2. **Chống xung đột bộ gõ Tiếng Việt (`IME Protection Rule`):** Khi nhập chuỗi code, đường dẫn file hoặc mật khẩu trên máy đang bật bộ gõ Tiếng Việt (UniKey/EVKey), ưu tiên dùng combo `Clipboard(mode='set', text=...)` ➔ `Click` ➔ `Shortcut(shortcut='ctrl+v')` để không bị biến dạng ký tự.
3. **Làm mới nhãn (`Label Freshness`):** Sau mỗi thao tác làm thay đổi bố cục cửa sổ (mở menu, chuyển tab, cuộn trang), bắt buộc gọi lại `Snapshot` để lấy mã `label` mới trước khi bấm tiếp.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
# Quy trình chuẩn bị chuỗi lệnh điều khiển Windows-MCP an toàn theo PID
def build_safe_windows_teardown(spawned_pid: int) -> dict:
    if spawned_pid <= 0:
        raise ValueError("PID không hợp lệ — tuyệt đối không tắt theo tên tiến trình!")
    return {
        "server": "windows-mcp",
        "tool": "Process",
        "arguments": {"mode": "kill", "pid": spawned_pid, "force": True}
    }
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Luôn dùng `WaitFor` thay vì gọi `Wait` mù quáng hoặc lặp `Snapshot` liên tục.
- [x] Khi tự động hóa trên trình duyệt Chrome/Edge qua `windows-mcp`, luôn bật `Snapshot(use_dom=True)`.
- [x] Không bao giờ tắt nhầm các cửa sổ ứng dụng có sẵn của người dùng (chỉ tắt theo `PID` do phiên làm việc tạo ra).
