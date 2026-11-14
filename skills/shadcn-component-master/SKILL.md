---
name: shadcn-component-master
description: >-
  [Thợ Lắp Ghép Bảng Biểu, Hộp Thoại & Biểu Mẫu Chuẩn Shadcn UI Chính Chủ (419K+ Installs)] — Tác dụng: Xây dựng nhanh Data Table, Modal/Dialog, Sheet, Command, Chat UI và Biểu mẫu (FieldGroup + React Hook Form + Zod báo lỗi Tiếng Việt) theo chuẩn shadcn/ui & Tailwind v4 mới nhất — Kích hoạt: Khi làm trang quản trị (Dashboard), biểu mẫu nhập liệu, hộp thoại hoặc dùng hệ thống shadcn/ui.
---

# KỸ NĂNG CHUYÊN SÂU: `SHADCN-COMPONENT-MASTER` (HỢP NHẤT `SHADCN-UI/UI@SHADCN` + BIỂU MẪU TIẾNG VIỆT ANTIDV — `version.5.3.0.0`)

> [!NOTE]
> **📌 Chú thích Tiếng Việt cho Newbie:**
> - **Tác dụng:** Kết hợp trọn bộ quy chuẩn chính chủ mới nhất từ tác giả **`shadcn-ui/ui`** (`419.3K+` lượt cài trên `skills.sh`, lưu đầy đủ trong `./rules/` và `./cli.md`) với chuẩn kiểm duyệt biểu mẫu **`Zod` báo lỗi Tiếng Việt rõ ràng** của bạn.

---

## 1. 6 Quy Tắc Vàng Bắt Buộc Khi Lắp Ghép `shadcn/ui` (`Official Critical Rules`)

1. **Đọc cấu hình dự án trước khi thêm khối giao diện (`CLI & Project Context`):**
   - Kiểm tra `components.json` hoặc chạy `npx shadcn@latest info --json` để biết chính xác dự án đang dùng nền `radix` hay `base`, Tailwind `v4` (`@theme inline`) hay `v3`, và thư viện icon nào (`lucide-react` hay `@tabler/icons-react`).
2. **Dùng biến màu ngữ nghĩa & khoảng cách `gap-*` (`Styling & Tailwind` — xem [`./rules/styling.md`](file:///~/.gemini/config/skills/shadcn-component-master/rules/styling.md)):**
   - Luôn dùng màu ngữ nghĩa (`bg-background`, `bg-card`, `text-muted-foreground`, `bg-primary`) để tự động đẹp ở cả Sáng/Tối (`Dark Mode`), không gán cứng màu thô hay tự chèn `z-index` đè lên `Dialog`/`Sheet`.
   - Dùng `flex flex-col gap-4` thay cho `space-y-4`; dùng `size-10` thay cho `w-10 h-10`; gộp class qua hàm `cn(...)` (`clsx` + `tailwind-merge`).
3. **Cấu trúc Biểu mẫu Hiện đại + Kiểm tra `Zod` Tiếng Việt (`Forms & Inputs` — xem [`./rules/forms.md`](file:///~/.gemini/config/skills/shadcn-component-master/rules/forms.md)):**
   - Tổ chức biểu mẫu bằng `FieldGroup` + `Field` (hoặc `FormField` theo phiên bản sẵn có của dự án), gắn `data-invalid` ở `Field` và `aria-invalid` ở ô nhập.
   - Bắt buộc kiểm duyệt đầu vào bằng `Zod` có thông báo lỗi **Tiếng Việt cụ thể** ngay dưới từng trường nhập.
4. **Hợp thành đúng cấp bậc để sạch lỗi cảnh báo (`Component Structure` — xem [`./rules/composition.md`](file:///~/.gemini/config/skills/shadcn-component-master/rules/composition.md)):**
   - Mọi `DialogContent`, `SheetContent`, `DrawerContent` **bắt buộc có `DialogTitle` / `SheetTitle` / `DrawerTitle`** (có thể thêm `className="sr-only"` nếu muốn ẩn mắt thường) để không báo lỗi đỏ/vàng Accessibility trong Console.
   - `SelectItem` luôn nằm trong `SelectGroup`; `TabsTrigger` nằm trong `TabsList`; `Avatar` luôn có `AvatarFallback`.
5. **Icon trong Nút bấm & Trạng thái Tải (`Icons & Loading` — xem [`./rules/icons.md`](file:///~/.gemini/config/skills/shadcn-component-master/rules/icons.md)):**
   - Nút đang gửi dữ liệu phải khóa `disabled={isSubmitting}` kèm vòng quay chờ (`Spinner` / `Loader2 animate-spin`) để chống bấm đúp.
6. **Tận dụng sẵn các khối chuẩn (`Don't Reinvent`):** Dùng `Alert` cho hộp cảnh báo, `Skeleton` cho khung chờ tải, `Badge` cho nhãn trạng thái, `Separator` thay `<hr>`, và `sonner` / `toast` cho thông báo nổi.

---

## 2. Mẫu Triển khai Chuẩn Thực chiến (`Shadcn Form + Zod Tiếng Việt`)
```tsx
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const projectSchema = z.object({
  projectName: z.string().trim().min(3, "Tên dự án phải có ít nhất 3 ký tự"),
  port: z.coerce.number().int().min(1024, "Cổng chạy phải từ 1024 trở lên").max(65535, "Cổng tối đa là 65535"),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export function useProjectConfigForm() {
  return useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { projectName: "", port: 3000 },
    mode: "onTouched",
  });
}
```

## 3. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Mọi `DialogContent` / `SheetContent` đều có `Title` & `Description`, sạch `100%` cảnh báo của Radix/Base UI trong Console.
- [x] Nút `Submit` tự động khóa (`disabled`) trong lúc đang gửi dữ liệu, báo lỗi Tiếng Việt rõ ràng ngay dưới ô nhập sai.
- [x] Tất cả biến thể (`default`, `destructive`, `outline`, `secondary`, `ghost`) hiển thị chuẩn tương phản ở cả chế độ Sáng và Tối.
