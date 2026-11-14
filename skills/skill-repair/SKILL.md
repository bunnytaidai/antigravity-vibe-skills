---
name: skill-repair
description: >-
  [Bác Sĩ Sửa Chữa & Đồng Bộ Kho Kỹ Năng (manifest.json)] — Tác dụng: Phát hiện và sửa lỗi các kỹ năng bị hỏng cấu trúc YAML, đồng bộ trạng thái cài đặt (installed) và mã kiểm tra (Checksum) trong tệp manifest — Kích hoạt: Khi có kỹ năng báo lỗi cài đặt hoặc sau khi thêm/xóa/cập nhật kho Skills.
license: Apache-2.0
metadata:
  version: v1
  publisher: google
---

# Skill Repair Assistant (`Trợ Lý Sửa Lỗi & Đồng Bộ Kho Kỹ Năng manifest.json`)

> [!NOTE]
> **📌 Chú thích Tiếng Việt cho Newbie:**
> - **Tác dụng:** Sau khi sửa lỗi bất kỳ tệp `SKILL.md` hoặc script đi kèm nào trong thư mục `~/.gemini\config\skills\`, bắt buộc kiểm tra và cập nhật tệp `manifest.json` về trạng thái `"status": "installed"` và `"error": null` để Antigravity IDE nhận diện kỹ năng hoạt động khỏe mạnh `100%`.

You have been tasked with fixing a broken agent skill. After you have modified
the skill's source files to address the reported error, you MUST update the
`manifest.json` to reflect that the skill is now repaired.

## Skill Context

-   **Skill ID**: The unique identifier for the skill (e.g., `my-skill`).
-   **Source Path**: Where the skill's source files are located.
-   **Installed Path**: Where the skill is installed/replicated.
-   **Manifest Path**: The absolute path to the `manifest.json` file.

## Repair Procedure

1.  **Analyze Error**: Understand the error message provided in the prompt.
2.  **Fix Installed Path**: Fix the issue at the installed path. Since some
    skills have multiple files, you MUST list all files in the skill directory
    and analyze them collectively to find the root cause (e.g., malformed
    `SKILL.md`, missing resources, or incorrect sub-scripts).
3.  **Update Manifest**: Once the fix is applied to ALL relevant files, you MUST
    update the `manifest.json` at the **Manifest Path**.
    -   Find the entry for the skill ID in the `skills` object.
    -   Set `"status": "installed"`.
    -   Clear the `"error"` field (set to `null` or remove it).
4.  **Verification**: The UI will automatically detect this change and refresh.

### Manifest Example

```json
{
  "skills": {
    "my-skill": {
      "status": "installed",
      "disabled": false,
      "error": null
    }
  }
}
```
