---
name: find-skills
description: >-
  [Thợ Săn & Cài Đặt Kỹ Năng Mới Từ Hệ Sinh Thái Mở (Vercel Labs / skills.sh)] — Tác dụng: Tự động tìm kiếm, thẩm định độ uy tín (lượt cài đặt, sao GitHub) và cài đặt thêm các kỹ năng mới từ chợ kỹ năng mã nguồn mở quốc tế (skills.sh / npx skills) vào Antigravity IDE — Kích hoạt: Khi bạn hỏi "có skill nào làm X không?", "tìm/cài skill cho X" hoặc muốn mở rộng thêm kỹ năng mới từ cộng đồng.
---

# KỸ NĂNG CHUYÊN SÂU: `FIND-SKILLS` (VERCEL LABS OPEN AGENT SKILLS ECOSYSTEM — `version.4.6.0.1`)

## 1. Kiến trúc & Mục tiêu Cốt lõi
- **Tên định danh (`Identifier`):** `find-skills` *(Tác giả gốc: `vercel-labs/skills` — Tích hợp & Cấu hình chuẩn hóa cho Antigravity IDE)*
- **Vai trò:** Chuyên gia Khám phá, Thẩm định Chất lượng & Cài đặt Kỹ năng Mở rộng từ Hệ sinh thái Mở (`External Agent Skill Discovery, Vetting & CLI Installer`)
- **Trọng tâm nhiệm vụ:** Hỗ trợ người dùng tìm kiếm, đánh giá độ tin cậy và cài đặt các gói kỹ năng (`Skills`) mới từ kho dữ liệu cộng đồng quốc tế (**`https://skills.sh/`** và **`npx skills` CLI**) vào kho kỹ năng toàn cục của Antigravity IDE (`~/.gemini\config\skills\`), sau đó đồng bộ với `skill-creator-pro` và `skill-repair` (`manifest.json`).

## 2. Khi Nào Cần Kích Hoạt Kỹ Năng Này (`When to Use This Skill`)
Kích hoạt `find-skills` khi người dùng:
- Hỏi *"Làm sao để làm X?"* mà `X` là tác vụ chuyên biệt chưa có sẵn trong kho Skills nội bộ.
- Yêu cầu trực tiếp: *"Tìm skill cho X"*, *"Có skill nào làm X không?"*, *"Cài skill X từ skills.sh / GitHub"*.
- Muốn mở rộng năng lực của Agent với các quy trình (`Workflows`), mẫu thiết kế (`Templates`) hoặc công cụ từ cộng đồng (`vercel-labs`, `anthropics`, `microsoft`).

## 3. Bộ Công Cụ `Skills CLI` & Quy Trình 6 Bước Chuẩn Vercel Labs (`6-Step Discovery Workflow`)

### Công cụ cốt lõi (`npx skills` Package Manager):
- `npx skills find [query] [--owner <owner>]` — Tìm kiếm skill theo từ khóa hoặc theo chủ sở hữu GitHub.
- `npx skills add <owner/repo@skill> -g -y` — Tải và cài đặt skill ở cấp độ toàn cục (`Global`).
- `npx skills update` — Cập nhật toàn bộ các skills đã cài từ CLI.
- **Chợ kỹ năng trực tuyến:** `https://skills.sh/`

### Quy trình 6 bước thực thi bắt buộc:
1. **Bước 1 — Xác định nhu cầu (`Understand What They Need`):** Xác định rõ miền công nghệ (`Domain`: React, Testing, DevOps, Security, Design...) và tác vụ cụ thể (`Specific Task`).
2. **Bước 2 — Kiểm tra Bảng Xếp Hạng trước (`Check the Leaderboard First`):** Ưu tiên kiểm tra trên `https://skills.sh/` hoặc các kho chính chủ uy tín cao như `vercel-labs/agent-skills` (`100K+ installs`), `anthropics/skills` (`100K+ installs`).
3. **Bước 3 — Chạy lệnh tìm kiếm (`Search for Skills`):**
   - Thực thi qua Terminal (`run_command`): `npx --yes skills find <từ-khóa-cụ-thể>` (Ví dụ: `npx --yes skills find react performance`, `npx --yes skills find pr review`).
4. **Bước 4 — Thẩm định chất lượng trước khi đề xuất (`Verify Quality Before Recommending`):**
   - **Số lượt cài đặt (`Install count`):** Ưu tiên skill có **`>= 1,000 installs`**; cảnh giác cao với các gói dưới `100 installs`.
   - **Độ uy tín nguồn phát hành (`Source reputation`):** Ưu tiên nguồn chính thức (`vercel-labs`, `anthropics`, `microsoft`, `google`).
   - **Số sao GitHub (`GitHub stars`):** Kiểm tra kho chứa gốc; thận trọng với repo có `< 100 stars`.
5. **Bước 5 — Trình bày lựa chọn rõ ràng cho người dùng (`Present Options`):** Nêu rõ tên Skill, tác dụng, số lượt cài đặt, nguồn gốc, lệnh cài đặt và liên kết `https://skills.sh/<owner>/<repo>/<skill>`.
6. **Bước 6 — Cài đặt & Cấu hình chuẩn Antigravity IDE (`Install & Configure for Antigravity`):**
   - Tải nội dung `SKILL.md` chuẩn về `~/.gemini\config\skills\<tên-skill>\SKILL.md` (hoặc chạy `npx --yes skills add <owner/repo@skill> -g -y` rồi đồng bộ sang thư mục `~/.gemini\config\skills\`).
   - Kiểm định khối `YAML Frontmatter` qua `skill-creator-pro` và đăng ký `"status": "installed"` vào `~/.gemini\config\skills\manifest.json` qua `skill-repair`.
   - Nếu không tìm thấy skill nào phù hợp: thông báo rõ, hỗ trợ giải quyết trực tiếp bằng năng lực sẵn có và gợi ý tạo skill mới qua `skill-creator-pro` hoặc `npx skills init <tên-skill>`.

## 4. Bảng Danh Mục Từ Khóa Tìm Kiếm Phổ Biến (`Common Skill Categories`)

| Danh mục (`Category`) | Từ khóa tìm kiếm hiệu quả (`Example Queries`) |
| :--- | :--- |
| **Web Development** | `react`, `nextjs`, `typescript`, `css`, `tailwind`, `react performance` |
| **Testing & QA** | `testing`, `jest`, `vitest`, `playwright`, `e2e` |
| **DevOps & Cloud** | `deploy`, `docker`, `kubernetes`, `ci-cd`, `cloudflare` |
| **Documentation** | `docs`, `readme`, `changelog`, `api-docs` |
| **Code Quality** | `review`, `pr-review`, `lint`, `refactor`, `best-practices` |
| **Design & UI/UX** | `ui`, `ux`, `design-system`, `accessibility`, `figma` |

## 5. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern: Antigravity Skill Installer & Sync`)
```python
import json
import pathlib
import subprocess

def search_and_register_antigravity_skill(
    skill_id: str,
    skill_markdown_content: str,
    skills_root: str = r"~/.gemini\config\skills",
) -> dict[str, str]:
    """Cài đặt SKILL.md mới vào kho toàn cục Antigravity và đồng bộ manifest.json."""
    root = pathlib.Path(skills_root)
    target_dir = root / skill_id
    target_dir.mkdir(parents=True, exist_ok=True)
    skill_file = target_dir / "SKILL.md"
    skill_file.write_text(skill_markdown_content, encoding="utf-8")

    manifest_path = root / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {"skills": {}}
    manifest.setdefault("skills", {})[skill_id] = {
        "status": "installed",
        "disabled": False,
        "error": None,
    }
    manifest["skills"] = dict(sorted(manifest["skills"].items()))
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return {"skill_id": skill_id, "path": str(skill_file), "status": "installed"}
```

## 6. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Thẩm định kỹ `Install count (>= 1K)`, `Source reputation` và `GitHub stars (>= 100)` trước khi đề xuất hoặc cài đặt bất kỳ skill bên ngoài nào.
- [x] Chuẩn hóa tệp `SKILL.md` tại `~/.gemini\config\skills\<skill-id>\SKILL.md` đạt `PASS 100%` qua hàm `validate_antigravity_skill()`.
- [x] Đồng bộ tức thì khóa `<skill-id>` vào `~/.gemini\config\skills\manifest.json` với `"status": "installed"`.
