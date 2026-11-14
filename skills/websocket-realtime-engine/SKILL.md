---
name: websocket-realtime-engine
description: >-
  [Động Cơ Cập Nhật Dữ Liệu Tức Thì Không Cần Tải Lại Trang (WebSocket)] — Tác dụng: Truyền tin 2 chiều theo thời gian thực cho khung chat trực tuyến, thông báo nhảy số tức thì, bảng theo dõi tiến độ trực tiếp và tự kết nối lại khi rớt mạng — Kích hoạt: Khi làm tính năng Chat, Thông báo thời gian thực (Realtime) hoặc Live Dashboard.
---

# KỸ NĂNG CHUYÊN SÂU: `WEBSOCKET-REALTIME-ENGINE` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `websocket-realtime-engine`
- **Vai trò:** Kỹ sư Hệ thống Truyền tin Thời gian thực (`WebSockets / Socket.io / SSE Realtime Architect`)
- **Trọng tâm nhiệm vụ:** Xây dựng đường truyền hai chiều độ trễ thấp với cơ chế nhịp tim (`Ping/Pong Heartbeat`), tự động kết nối lại có độ trễ tăng dần (`Auto-Reconnect with Jitter`), phân phòng (`Rooms/Namespaces`) và đồng bộ trạng thái.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Luôn xác thực Token ngay ở bước bắt tay (`Handshake Auth`) trước khi chấp nhận kết nối WebSocket.
2. Thiết lập cơ chế `Heartbeat Ping/Pong` (mỗi `25s`) để phát hiện và dọn dẹp ngay các kết nối ma (`Zombie Connections`).
3. Khi mất mạng tạm thời, phía Client phải tự kết nối lại kèm `Jitter` ngẫu nhiên để tránh hàng ngàn máy khách đập vào Server cùng một mili-giây (`Thundering Herd`).

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```typescript
export class ResilientWebSocketClient {
  private ws: WebSocket | null = null;
  private attempts = 0;

  constructor(private readonly url: string, private readonly onMessage: (data: unknown) => void) {
    this.connect();
  }

  private connect(): void {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => { this.attempts = 0; };
    this.ws.onmessage = (ev) => this.onMessage(JSON.parse(ev.data));
    this.ws.onclose = () => {
      const baseDelay = Math.min(1000 * 2 ** this.attempts++, 30000);
      const jitter = Math.floor(Math.random() * 500);
      setTimeout(() => this.connect(), baseDelay + jitter);
    };
  }
}
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Tắt/bật lại kết nối mạng, giao diện tự động khôi phục luồng thời gian thực mà không cần tải lại trang (`F5`).
- [x] Khi đóng Component hoặc chuyển trang, kết nối WebSocket và bộ đếm nhịp tim được hủy (`ws.close()`) sạch sẽ, không nhân đôi sự kiện.
- [x] Tin nhắn gửi đi đều có định dạng sự kiện rõ ràng (`{ event: string, payload: unknown, ts: number }`).
