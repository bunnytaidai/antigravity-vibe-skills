---
name: local-llm-ollama-integrator
description: >-
  [Chuyên Gia Chạy AI Nội Bộ Không Cần Mạng (Ollama / GTX 1660 Ti)] — Tác dụng: Cấu hình mô hình AI chạy trực tiếp trên máy tính cá nhân của bạn, cân đối vừa khít 6GB VRAM của card GTX 1660 Ti cùng 64GB RAM và CPU Xeon 24 luồng — Kích hoạt: Khi tích hợp Ollama/llama.cpp hoặc chạy AI offline trên máy trạm.
---

# KỸ NĂNG CHUYÊN SÂU: `LOCAL-LLM-OLLAMA-INTEGRATOR` (NHÓM 4: AI AGENT, PROMPT ENGINEERING & MCP SYSTEM — `version.3.6.0.0`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `local-llm-ollama-integrator`
- **Vai trò:** Chuyên gia Tích hợp Mô hình AI Nội bộ Tối ưu Phần cứng (`Local LLM Ollama / llama.cpp & VRAM Optimizer`)
- **Trọng tâm nhiệm vụ:** Tích hợp và điều phối mô hình ngôn ngữ chạy cục bộ (`Ollama`, `llama.cpp`, `vLLM`) tối ưu riêng cho phần cứng máy trạm: GPU **NVIDIA GTX 1660 Ti (6GB VRAM)** kết hợp **64GB RAM hệ thống** và **CPU Intel Xeon E5-2678 v3 (12 nhân / 24 luồng)**.

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. Bảo vệ nghiêm ngặt trần `6GB VRAM` của GTX 1660 Ti: ưu tiên mô hình `3B - 7B` lượng tử hóa `Q4_K_M` (`~3.5GB - 4.6GB VRAM`), đặt `num_ctx: 4096` hoặc `8192` với `kv_cache_type: q8_0` để không bao giờ bị lỗi `CUDA Out of Memory`.
2. Với mô hình lớn hơn (`14B - 32B`), bật chế độ `Hybrid GPU+CPU Offloading` chia các lớp dư sang `64GB RAM` hệ thống và đặt `num_thread: 12` (bằng đúng 12 nhân vật lý của Xeon E5-2678 v3).
3. Thiết lập `keep_alive: '5m'` để giải phóng VRAM kịp thời khi Agent chuyển sang tác vụ khác.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern`)
```python
def build_workstation_ollama_payload(model: str, prompt: str, system: str = "") -> dict:
    """Cấu hình chuẩn cho máy trạm GTX 1660 Ti (6GB VRAM) + 64GB RAM + Xeon E5-2678 v3 (24T)."""
    return {
        "model": model,
        "system": system,
        "prompt": prompt,
        "stream": False,
        "keep_alive": "5m",
        "options": {
            "num_ctx": 4096,      # Giữ KV Cache gọn trong 6GB VRAM
            "num_thread": 12,     # Tối ưu cho 12 nhân vật lý Xeon E5-2678 v3
            "temperature": 0.1,   # Độ chính xác cao cho tác vụ lập trình & phân tích
            "top_p": 0.9
        }
    }
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Mức sử dụng VRAM trên GTX 1660 Ti luôn giữ ở ngưỡng an toàn `< 5.4GB / 6.0GB`, không bị tràn sang Shared GPU Memory làm tụt tốc độ.
- [x] Có cơ chế kiểm tra kết nối `http://127.0.0.1:11434/api/tags` trước khi gọi mô hình.
- [x] Hỗ trợ truyền luồng (`Streaming`) hoặc trả về định dạng cấu trúc `format='json'` ổn định.
