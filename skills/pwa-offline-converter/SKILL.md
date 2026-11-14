---
name: pwa-offline-converter
description: >-
  [Chuyên Gia Biến Trang Web Thành Ứng Dụng Chạy Không Cần Mạng (PWA)] — Tác dụng: Giúp trang web có thể cài đặt thành biểu tượng ngoài màn hình nền Windows/Điện thoại và vẫn mở xem được khi mất mạng (Offline) — Kích hoạt: Khi muốn đóng gói web thành ứng dụng PWA hoặc lưu đệm chạy offline.
---

# KỸ NĂNG CHUYÊN SÂU: `PWA-OFFLINE-CONVERTER` (NHÓM 1: FRONTEND, WEB & APP UI/UX — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `pwa-offline-converter`
- **Vai trò:** Kỹ sư Ứng dụng Web Tiến bộ Chạy Offline (`Progressive Web App & Service Worker Specialist`)
- **Trọng tâm nhiệm vụ:** Cấu hình `manifest.webmanifest`, `Service Worker` lưu đệm thông minh (`Stale-While-Revalidate` / `Cache-First`) và đồng bộ nền (`Background Sync`) giúp Web cài đặt như App Desktop và hoạt động cả khi mất mạng.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Tài nguyên tĩnh (JS, CSS, Font, Icon) dùng chiến lược `Cache-First`; dữ liệu API dùng `Network-First` kèm bản dự phòng trong `IndexedDB`.
2. Cung cấp đầy đủ icon chuẩn `192x192` và `512x512` (`maskable`) trong `manifest.webmanifest`.
3. Luôn thông báo rõ ràng trên giao diện khi người dùng đang ở chế độ `Offline` và tự động đồng bộ lại khi có mạng.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```javascript
// sw.js — Service Worker lưu đệm thông minh có tự động dọn phiên bản cũ
const CACHE_NAME = "antigravity-pwa-v3.4.0.0";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Chấm điểm Lighthouse PWA đạt chuẩn `Installable` trên Chrome/Edge Windows 10.
- [x] Rút mạng (`Offline Mode` trong DevTools) tải lại trang vẫn lên giao diện đầy đủ, không hiện khủng long mất mạng.
- [x] Cập nhật `CACHE_NAME` tự động xóa sạch cache cũ mà không bắt người dùng xóa dữ liệu duyệt web thủ công.
