---
name: react-nextjs-architect
description: >-
  [Kiến Trúc Sư Xây Dựng Web Hiện Đại Với React & Next.js (Vercel Official 70 Rules — 899K+ Installs)] — Tác dụng: Thiết kế kiến trúc React 19 & Next.js App Router gọn gàng, phân tách Server/Client Components, diệt lỗi thác nước (Waterfall), tối ưu Bundle và áp dụng 70 quy tắc hiệu năng chính chủ từ đội ngũ kỹ sư Vercel — Kích hoạt: Khi tạo mới, tối ưu tốc độ hoặc phát triển dự án web bằng React hoặc Next.js.
---

# KỸ NĂNG CHUYÊN SÂU: `REACT-NEXTJS-ARCHITECT` (HỢP NHẤT `VERCEL-REACT-BEST-PRACTICES` + KIẾN TRÚC RSC ANTIDV — `version.5.3.0.0`)

> [!NOTE]
> **📌 Chú thích Tiếng Việt cho Newbie:**
> - **Tác dụng:** Kết hợp kiến trúc phân tầng `Server Components (RSC)` ↔ `Client Leaf Nodes` của bạn với trọn bộ **70 quy tắc tối ưu hiệu năng chính chủ từ Vercel Engineering** (`899.8K+` lượt cài trên `skills.sh`, lưu đầy đủ trong thư mục `./rules/` và `./AGENTS.md`).
> - **Nguyên tắc tiết kiệm Token:** Xem bảng tóm tắt 8 nhóm ưu tiên bên dưới trước; khi gặp tình huống cụ thể mới dùng `read_file` mở đúng tệp quy tắc tương ứng trong `./rules/<ten-quy-tac>.md`.

---

## 1. Bảng 8 Nhóm Quy Tắc Hiệu Năng Theo Độ Ưu Tiên (`Vercel 8-Category Priority Matrix`)

| Ưu Tiên | Nhóm Tối Ưu (`Category`) | Mức Độ | Tiền Tố File `./rules/` | Quy Tắc Cốt Lõi Bắt Buộc Nhớ |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Diệt Thác Nước Chờ Tuần Tự (`Eliminating Waterfalls`)** | `CRITICAL` | `async-*` | Dùng `Promise.all()` cho các truy vấn độc lập (`async-parallel`); khởi tạo Promise sớm, `await` muộn; bọc `Suspense` để truyền phát từng phần (`async-suspense-boundaries`). |
| **2** | **Thu Nhỏ Gói JS Tải Đầu (`Bundle Size Optimization`)** | `CRITICAL` | `bundle-*` | Tránh import qua file gom `index.ts` lớn (`bundle-barrel-imports`); dùng `next/dynamic` cho biểu đồ/trình soạn thảo nặng (`bundle-dynamic-imports`). |
| **3** | **Tốc Độ Phía Máy Chủ (`Server-Side Performance`)** | `HIGH` | `server-*` | Mặc định mọi trang/khung trong `app/` là `Server Component`; xác thực chặt trong `Server Actions` (`server-auth-actions`); dùng `React.cache()` khử gọi lặp DB trong 1 request (`server-cache-react`); truyền tối thiểu dữ liệu sang Client (`server-serialization`). |
| **4** | **Lấy Dữ Liệu Trình Duyệt (`Client Data Fetching`)** | `MEDIUM-HIGH` | `client-*` | Khử trùng request bằng `SWR` / `React Query` (`client-swr-dedup`); gắn `{ passive: true }` cho sự kiện cuộn (`client-passive-event-listeners`). |
| **5** | **Chống Vẽ Lại Thừa (`Re-render Optimization`)** | `MEDIUM` | `rerender-*` | Chỉ đặt `'use client'` ở nút lá (`Leaf Nodes`); tính toán trạng thái dẫn xuất ngay lúc render thay vì nhét vào `useEffect` (`rerender-derived-state-no-effect`); dùng `startTransition` cho thao tác lọc nặng (`rerender-transitions`). |
| **6** | **Hiệu Năng Hiển Thị DOM (`Rendering Performance`)** | `MEDIUM` | `rendering-*` | Dùng toán tử `condition ? <A /> : null` thay vì `count && <A />` để tránh in số `0` rác (`rendering-conditional-render`); bật `content-visibility: auto` cho danh sách dài (`rendering-content-visibility`). |
| **7** | **Tối Ưu Vòng Lặp JS (`JavaScript Performance`)** | `LOW-MEDIUM` | `js-*` | Dùng `Map` / `Set` tra cứu `O(1)` thay cho `.find()` lặp trong vòng lặp (`js-set-map-lookups`); dùng `.toSorted()` bất biến thay vì `.sort()` làm biến đổi mảng gốc (`js-tosorted-immutable`). |
| **8** | **Mẫu Nâng Cao (`Advanced Patterns`)** | `LOW` | `advanced-*` | Khởi tạo SDK một lần mỗi phiên tải app (`advanced-init-once`). |

- **Kho 70 quy tắc chi tiết kèm ví dụ Sai/Đúng:** Nằm tại thư mục [`./rules/`](file:///~/.gemini/config/skills/react-nextjs-architect/rules) và bản tổng hợp [`./AGENTS.md`](file:///~/.gemini/config/skills/react-nextjs-architect/AGENTS.md).

---

## 2. Mẫu Triển khai Chuẩn Thực chiến (`RSC + Parallel Fetching + Suspense Streaming`)
```tsx
// app/dashboard/page.tsx — Khởi chạy song song không nghẽn Waterfall + Suspense Streaming
import { Suspense } from "react";
import { getProjectMetrics, getRecentAlerts } from "@/services/metrics.service";
import { MetricsClientChart } from "@/components/features/MetricsClientChart";

export default function DashboardPage() {
  // Khởi động sớm cả 2 Promise cùng lúc (không await tuần tự làm chậm gấp đôi!)
  const metricsPromise = getProjectMetrics();
  const alertsPromise = getRecentAlerts();

  return (
    <main className="mx-auto max-w-7xl flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Bảng Điều Khiển Hệ Thống</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-800/50" />}>
        <MetricsSection metricsPromise={metricsPromise} alertsPromise={alertsPromise} />
      </Suspense>
    </main>
  );
}

async function MetricsSection({
  metricsPromise,
  alertsPromise,
}: {
  metricsPromise: ReturnType<typeof getProjectMetrics>;
  alertsPromise: ReturnType<typeof getRecentAlerts>;
}) {
  const [metrics, alerts] = await Promise.all([metricsPromise, alertsPromise]);
  return <MetricsClientChart initialData={metrics} alertCount={alerts.length} />;
}
```

## 3. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Không có lỗi `Hydration Mismatch` giữa máy chủ và trình duyệt trong Console (`chrome-devtools-mcp`).
- [x] Không có chuỗi `await` tuần tự gây nghẽn (`Waterfall`) đối với các nguồn dữ liệu độc lập; tách biệt gọi DB vào `src/services/` hoặc `Server Actions` có kiểm duyệt `Zod`.
- [x] Mọi danh sách `.map()` đều sử dụng `key` định danh duy nhất (không dùng chỉ số `index` khi danh sách có thêm/xóa).
