---
name: ui-ux-pro-max
description: >-
  [Chuyên Gia Thiết Kế Giao Diện Đẹp & Hiện Đại (UI/UX Pro Max — 451K+ Installs)] — Tác dụng: Tự động phối màu chuẩn 60-30-10, tra cứu kho dữ liệu nội bộ (80 phong cách, 192 bảng màu ngành nghề, 74 cặp phông chữ, 120 quy tắc UX, 25 loại biểu đồ, 22 công nghệ) và căn lưới 8px giúp phần mềm/trang web chuyên nghiệp ngay từ đầu — Kích hoạt: Khi thiết kế giao diện mới, chọn màu/font, làm đẹp trang web/ứng dụng hoặc kiểm duyệt UX.
---

# KỸ NĂNG CHUYÊN SÂU: `UI-UX-PRO-MAX` (HỢP NHẤT `NEXTLEVELBUILDER/UI-UX-PRO-MAX` + CHUẨN THẨM MỸ ANTIDV — `version.5.3.0.0`)

> [!NOTE]
> **📌 Chú thích Tiếng Việt cho Newbie:**
> - **Tác dụng kép cực mạnh:** Vừa giữ trọn bộ quy tắc thị giác dễ áp dụng (`60-30-10`, lưới `8px`, `1 Primary CTA`, đủ 3 trạng thái `Skeleton / Empty / Data`), vừa tích hợp **Kho Dữ Liệu Tra Cứu Thực Chiến Nội Bộ** (`data/*.csv` + `scripts/search.py` + `references/*.md` từ bản chính chủ `451.8K+` lượt cài trên `skills.sh`).
> - **Lưu ý Runtime:** Công cụ tra cứu bảng màu/phông chữ đi kèm (`scripts/search.py`) chạy bằng **`Python 3`** thuần (không cần cài thêm gói ngoài).

---

## 1. Bảng 10 Mức Ưu Tiên Kiểm Duyệt Giao Diện (`Priority 1 ➔ 10 Matrix`)

| Ưu Tiên | Hạng Mục (`Category`) | Tác Động | Miền Tra Cứu | Điều Kiện Bắt Buộc (`Must Have`) | Lỗi Phải Tránh (`Anti-Patterns`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** | **Khả năng tiếp cận (`Accessibility`)** | `CRITICAL` | `ux` | Tương phản `>= 4.5:1`, thẻ `alt`, điều hướng phím `Tab`, `aria-label` | Xóa viền `focus`, nút chỉ có icon không nhãn |
| **2** | **Chạm & Tương tác (`Touch & CTA`)** | `CRITICAL` | `ux` | Vùng bấm `>= 44×44px`, cách nhau `>= 8px`, chỉ **1 Primary CTA** nổi bật nhất | Chỉ dựa vào `hover`, đổi trạng thái giật cục `0ms` |
| **3** | **Tốc độ hiển thị (`Performance`)** | `HIGH` | `ux` | Ảnh `WebP/AVIF`, giữ khung chống nhảy hình (`CLS < 0.1`), `Skeleton` | Trắng trang khi tải, nhảy lệch bố cục |
| **4** | **Đồng nhất Phong cách (`Style`)** | `HIGH` | `style`, `product` | Khớp loại sản phẩm, dùng bộ icon `SVG` đồng bộ (`Lucide` / `Tabler`) | Dùng emoji làm icon chức năng, trộn lẫn lộn phong cách |
| **5** | **Co giãn Đa màn hình (`Responsive`)** | `HIGH` | `ux` | Lưới `8px` (`8, 16, 24, 32px`), ưu tiên Mobile-first, `0` thanh cuộn ngang | Cố định chiều rộng cứng gây vỡ khung điện thoại |
| **6** | **Chữ & Tỷ lệ Màu (`60-30-10`)** | `MEDIUM` | `typography`, `color` | `60% Nền` - `30% Thẻ Card` - `10% Màu nhấn`, cỡ chữ gốc `16px`, tối đa `2-3` font | Chữ nhỏ `< 12px`, xám mờ trên nền xám, viết mã hex lộn xộn |
| **7** | **Chuyển động (`Motion`)** | `MEDIUM` | `ux`, `gsap` | Mượt `150–300ms` bằng `transform/opacity`, tôn trọng `prefers-reduced-motion` | Animate trực tiếp `width/height` gây tụt FPS |
| **8** | **Biểu mẫu & Trạng thái (`Forms & States`)** | `MEDIUM` | `ux` | Nhãn rõ ràng, báo lỗi ngay dưới ô nhập, đủ `Skeleton` + `Empty State` có nút gợi ý | Chỉ dùng `placeholder` thay nhãn, dồn lỗi lên đầu trang |
| **9** | **Điều hướng (`Navigation`)** | `HIGH` | `ux` | Đường lùi rõ ràng, thanh đáy Mobile `<= 5` mục | Thanh menu nhồi nhét quá tải |
| **10** | **Biểu đồ & Số liệu (`Charts`)** | `LOW` | `chart` | Có chú giải (`Legend`), `Tooltip` khi rê chuột, màu phân biệt rõ | Chỉ phân biệt trạng thái bằng màu đỏ/xanh đơn thuần |

---

## 2. Công Cụ Tra Cứu Hệ Thống Thiết Kế Tự Động (`Local Search Engine`)

Khi thiết kế dự án mới hoặc cần chọn bảng màu/cặp font chuẩn theo ngành nghề, chạy trực tiếp bằng đường dẫn tuyệt đối:

```powershell
# 1. Sinh trọn bộ Design System (Màu sắc, Phông chữ, Bố cục, Anti-patterns) cho dự án mới:
python "~/.gemini\config\skills\ui-ux-pro-max\scripts\search.py" "analytics dashboard dark modern" --design-system --variance 6 --motion 5 --density 7 -p "Project Name"

# 2. Tra cứu chuyên sâu theo từng miền (product | style | color | typography | chart | ux | landing | icons | gsap | react):
python "~/.gemini\config\skills\ui-ux-pro-max\scripts\search.py" "fintech SaaS" --domain color

# 3. Tra cứu quy tắc riêng theo Stack (nextjs | react | shadcn | html-tailwind | vue | flutter...):
python "~/.gemini\config\skills\ui-ux-pro-max\scripts\search.py" "card spacing responsive" --stack nextjs
```

- **Tài liệu tra cứu nhanh đi kèm:** Đọc thêm [`references/quick-reference.md`](file:///~/.gemini/config/skills/ui-ux-pro-max/references/quick-reference.md) *(120 quy tắc UX)* và [`references/pro-rules.md`](file:///~/.gemini/config/skills/ui-ux-pro-max/references/pro-rules.md) *(Checklist kiểm duyệt trước khi bàn giao)* khi cần đối chiếu chi tiết.

---

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern — 60-30-10 & 8px Grid`)
```tsx
// Mẫu Thẻ Chỉ Số (Metric Card) chuẩn phân cấp thị giác UI/UX Pro Max
export function MetricHighlightCard({ title, value, delta, hint }: { title: string; value: string; delta: string; hint: string }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm backdrop-blur">
      <header className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-400">
        <span>{title}</span>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-emerald-400">{delta}</span>
      </header>
      <div className="mt-4 text-3xl font-bold tracking-tight text-slate-50">{value}</div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{hint}</p>
    </section>
  );
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Nhìn lướt trong **3 giây đầu tiên** xác định được ngay tiêu đề chính, số liệu quan trọng nhất và nút thao tác chính (`Primary CTA`).
- [x] Khoảng cách `padding` và `gap` tuân thủ bội số `8px`; đủ 3 trạng thái `Skeleton`, `Empty State` và `Data`.
- [x] Kiểm tra trình duyệt qua `chrome-devtools-mcp` / `a11y-debugging` sạch lỗi tràn lề ngang và đạt độ tương phản `>= 4.5:1`.
