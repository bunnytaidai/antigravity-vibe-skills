---
name: playwright-e2e-tester
description: >-
  [Robot Tự Mở Trình Duyệt Bấm Thử Như Người Thật (Playwright E2E)] — Tác dụng: Tự động bật trình duyệt web, tự gõ chữ vào ô nhập, tự bấm nút và kiểm tra xem trang web có hiện đúng kết quả và sạch lỗi đỏ Console hay không — Kích hoạt: Khi kiểm thử luồng hoạt động thực tế của trang web từ đầu đến cuối.
---

# KỸ NĂNG CHUYÊN SÂU: `PLAYWRIGHT-E2E-TESTER` (NHÓM 5: QA, TESTING, DEBUGGING, REFACTORING & SECURITY — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `playwright-e2e-tester`
- **Vai trò:** Kỹ sư Kiểm thử Giao diện Đầu-Cuối Tự động (`Playwright E2E & Browser Automation Architect`)
- **Trọng tâm nhiệm vụ:** Viết kịch bản kiểm thử tự động mô phỏng hành vi người dùng thật trên trình duyệt bằng `Playwright`, ưu tiên bộ chọn theo vai trò ngữ nghĩa (`getByRole`, `getByLabel`), tự động chờ thông minh (`Web-First Assertions`) và chụp ảnh màn hình khi lỗi.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Ưu tiên định vị phần tử theo thứ tự: `page.getByRole()` ➔ `page.getByLabel()` ➔ `page.getByTestId()`, hạn chế tối đa các bộ chọn CSS/XPath mỏng manh dễ gãy khi đổi giao diện.
2. Tuyệt đối không dùng `page.waitForTimeout(3000)` cố định; bắt buộc dùng `await expect(locator).toBeVisible()` để Playwright tự chờ chính xác thời điểm phần tử xuất hiện.
3. Lắng nghe sự kiện `page.on('pageerror')` và `page.on('console')` để bắt ngay mọi lỗi đỏ JavaScript phát sinh trong lúc bấm nút.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```typescript
import { test, expect } from "@playwright/test";

test("Luồng đăng nhập và kiểm tra Console sạch lỗi 100%", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("http://localhost:3000");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Kịch bản E2E chạy ổn định (`Zero Flaky Tests`) qua 3 lần chạy liên tiếp.
- [x] Mảng `consoleErrors` và `pageErrors` hoàn toàn rỗng (`[]`) sau khi đi qua toàn bộ luồng người dùng.
- [x] Đóng trình duyệt ngầm sạch sẽ ngay sau khi kết thúc bài kiểm thử.
