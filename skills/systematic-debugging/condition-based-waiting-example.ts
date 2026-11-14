// Bộ tiện ích mẫu đầy đủ cho kỹ thuật Chờ Theo Điều Kiện Thực Tế (Condition-Based Waiting — version.4.4.0.0)
// Nguồn gốc: obra/superpowers/systematic-debugging (Việt hóa & chuẩn hóa cho máy trạm Antidv)
// Tác dụng: Khắc phục triệt để các bài kiểm thử chập chờn (Flaky Tests) bằng cách thay thế setTimeout cảm tính.

export interface ThreadEvent<TData = unknown> {
  type: string;
  data?: TData;
  timestamp?: number;
}

export interface ThreadManagerLike {
  getEvents(threadId: string): ThreadEvent[];
}

/**
 * Chờ cho đến khi một loại sự kiện (eventType) cụ thể xuất hiện trong luồng xử lý
 *
 * @param threadManager - Bộ quản lý luồng chứa danh sách sự kiện
 * @param threadId - Mã định danh của luồng cần kiểm tra
 * @param eventType - Tên loại sự kiện cần chờ (ví dụ: 'TOOL_RESULT')
 * @param timeoutMs - Thời gian chờ tối đa tính bằng mili-giây (mặc định 5000ms)
 * @returns Promise trả về sự kiện đầu tiên khớp điều kiện
 */
export function waitForEvent(
  threadManager: ThreadManagerLike,
  threadId: string,
  eventType: string,
  timeoutMs = 5000
): Promise<ThreadEvent> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      // Luôn lấy danh sách sự kiện mới nhất bên trong vòng lặp kiểm tra
      const events = threadManager.getEvents(threadId);
      const event = events.find((e) => e.type === eventType);

      if (event) {
        resolve(event);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Quá thời gian chờ sự kiện '${eventType}' sau ${timeoutMs}ms`));
      } else {
        setTimeout(check, 10); // Kiểm tra định kỳ mỗi 10ms để tiết kiệm tài nguyên CPU
      }
    };

    check();
  });
}

/**
 * Chờ cho đến khi đủ số lượng (count) sự kiện thuộc một loại nhất định xuất hiện
 *
 * @param threadManager - Bộ quản lý luồng chứa danh sách sự kiện
 * @param threadId - Mã định danh của luồng cần kiểm tra
 * @param eventType - Tên loại sự kiện cần đếm
 * @param count - Số lượng sự kiện tối thiểu cần đạt được
 * @param timeoutMs - Thời gian chờ tối đa tính bằng mili-giây (mặc định 5000ms)
 * @returns Promise trả về mảng tất cả các sự kiện khớp điều kiện khi đã đủ số lượng
 */
export function waitForEventCount(
  threadManager: ThreadManagerLike,
  threadId: string,
  eventType: string,
  count: number,
  timeoutMs = 5000
): Promise<ThreadEvent[]> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const events = threadManager.getEvents(threadId);
      const matchingEvents = events.filter((e) => e.type === eventType);

      if (matchingEvents.length >= count) {
        resolve(matchingEvents);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(
          new Error(
            `Quá thời gian chờ đủ ${count} sự kiện '${eventType}' sau ${timeoutMs}ms (hiện chỉ có ${matchingEvents.length})`
          )
        );
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
}

/**
 * Chờ cho đến khi xuất hiện sự kiện thỏa mãn hàm điều kiện tùy chỉnh (Custom Predicate)
 * Rất hữu ích khi cần kiểm tra sâu dữ liệu bên trong sự kiện chứ không chỉ kiểm tra tên loại sự kiện.
 *
 * @param threadManager - Bộ quản lý luồng chứa danh sách sự kiện
 * @param threadId - Mã định danh của luồng cần kiểm tra
 * @param predicate - Hàm kiểm tra trả về true khi sự kiện thỏa mãn yêu cầu
 * @param description - Mô tả tiếng Việt dễ hiểu để in ra khi báo lỗi quá thời gian (Timeout)
 * @param timeoutMs - Thời gian chờ tối đa tính bằng mili-giây (mặc định 5000ms)
 * @returns Promise trả về sự kiện đầu tiên thỏa mãn hàm điều kiện
 */
export function waitForEventMatch(
  threadManager: ThreadManagerLike,
  threadId: string,
  predicate: (event: ThreadEvent) => boolean,
  description: string,
  timeoutMs = 5000
): Promise<ThreadEvent> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const events = threadManager.getEvents(threadId);
      const event = events.find(predicate);

      if (event) {
        resolve(event);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Quá thời gian chờ điều kiện [${description}] sau ${timeoutMs}ms`));
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
}
