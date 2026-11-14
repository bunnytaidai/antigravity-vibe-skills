---
name: state-management-guru
description: >-
  [Chuyên Gia Đồng Bộ Dữ Liệu Trên Màn Hình (Zustand / Redux)] — Tác dụng: Quản lý dữ liệu dùng chung giữa nhiều màn hình (như giỏ hàng, thông tin tài khoản, bộ lọc) giúp cập nhật tức thì mà không làm giật lag giao diện — Kích hoạt: Khi trang web có nhiều thành phần cần chia sẻ và đồng bộ dữ liệu.
---

# KỸ NĂNG CHUYÊN SÂU: `STATE-MANAGEMENT-GURU` (NHÓM 1: FRONTEND, WEB & APP UI/UX — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `state-management-guru`
- **Vai trò:** Kiến trúc sư Quản lý Trạng thái Dữ liệu (`Zustand / Redux Toolkit / TanStack Query Specialist`)
- **Trọng tâm nhiệm vụ:** Tách biệt rõ trạng thái máy chủ (`Server Cache` với TanStack Query) và trạng thái giao diện (`Client UI State` với Zustand), sử dụng `Selector` nguyên tử để chống vẽ lại thừa (`Zero Unnecessary Re-renders`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Không nhét dữ liệu tải từ API vào kho `Zustand`/`Redux` thủ công nếu có thể dùng `TanStack Query` (`useQuery`/`useMutation`) để tự động quản lý bộ đệm và làm mới.
2. Khi lấy dữ liệu từ `Zustand Store`, bắt buộc dùng `Selector` chọn đúng trường cần thiết (`useAppStore(s => s.activeTab)`), cấm gọi `useAppStore()` lấy toàn bộ kho gây re-render toàn màn hình.
3. Sử dụng `persist` middleware an toàn khi cần lưu cấu hình người dùng vào `localStorage`.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceUIState {
  sidebarOpen: boolean;
  activePanel: "code" | "preview" | "logs";
  toggleSidebar: () => void;
  setActivePanel: (panel: "code" | "preview" | "logs") => void;
}

export const useWorkspaceStore = create<WorkspaceUIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activePanel: "code",
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setActivePanel: (activePanel) => set({ activePanel })
    }),
    { name: "antigravity-workspace-ui-v3.4" }
  )
);
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Thay đổi 1 trường trong Store chỉ làm render lại đúng Component đang hiển thị trường đó.
- [x] Tải lại trang (`F5`) giữ nguyên các tùy chọn giao diện đã cấu hình trong `persist` mà không gây lỗi Hydration.
- [x] Không có tình trạng `Prop Drilling` (truyền biến qua quá 3 tầng Component trung gian).
