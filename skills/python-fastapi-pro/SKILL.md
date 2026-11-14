---
name: python-fastapi-pro
description: >-
  [Chuyên Gia Xây Dựng Máy Chủ Backend Python Tốc Độ Cao (FastAPI)] — Tác dụng: Viết hệ thống xử lý phía sau (Backend) bằng Python FastAPI chạy bất đồng bộ siêu nhanh, kiểm tra dữ liệu đầu vào tự động và có sẵn trang tài liệu thử nghiệm API (/docs) — Kích hoạt: Khi viết máy chủ Backend hoặc API bằng ngôn ngữ Python.
---

# KỸ NĂNG CHUYÊN SÂU: `PYTHON-FASTAPI-PRO` (NHÓM 2: BACKEND, API & SYSTEM ARCHITECTURE — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `python-fastapi-pro`
- **Vai trò:** Chuyên gia Máy chủ Python FastAPI & Pydantic v2 (`Async Python Backend Lead`)
- **Trọng tâm nhiệm vụ:** Xây dựng REST API tốc độ cao với `FastAPI`, quản lý vòng đời kết nối bằng `lifespan`, kiểm duyệt dữ liệu cực nhanh với `Pydantic v2`, `Annotated[Depends(...)]` và tự động sinh tài liệu `OpenAPI / Swagger`.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Sử dụng `asynccontextmanager` cho `lifespan` của `FastAPI` (thay thế hoàn toàn `@app.on_event('startup')` đã lỗi thời).
2. Trong hàm `async def`, chỉ gọi thư viện bất đồng bộ (`httpx`, `asyncpg`); nếu gọi hàm đồng bộ tốn thời gian thì khai báo route bằng `def` thường để FastAPI tự đẩy vào `ThreadPool`.
3. Khai báo rõ `response_model` và `status_code` cho mọi Endpoint để tự động lọc bỏ dữ liệu thừa và chuẩn hóa tài liệu Swagger.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Trạng thái hoạt động của máy chủ")
    version: str = Field(default="version.3.6.0.0", description="Phiên bản hệ thống")

@asynccontextmanager
async def app_lifespan(app: FastAPI):
    app.state.ready = True
    yield
    app.state.ready = False

app = FastAPI(title="Antigravity FastAPI Service", version="3.4.0.0", lifespan=app_lifespan)

@app.get("/api/v1/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def check_health() -> HealthResponse:
    if not getattr(app.state, "ready", False):
        raise HTTPException(status_code=503, detail="Dịch vụ đang khởi động")
    return HealthResponse()
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Truy cập `/docs` hoặc `/openapi.json` hiển thị đầy đủ mô tả Tiếng Việt cho từng API và trường dữ liệu.
- [x] Không sử dụng các phương thức Pydantic v1 đã cũ (`.dict()`, `@validator`); chuyển 100% sang Pydantic v2 (`.model_dump()`, `@field_validator`).
- [x] Quản lý đóng/mở `Connection Pool` sạch sẽ bên trong `lifespan`.
