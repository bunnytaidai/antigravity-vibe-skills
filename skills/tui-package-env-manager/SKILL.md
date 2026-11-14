---
name: tui-package-env-manager
description: >-
  [Kỹ Sư Quét Toàn Dự Án & Dựng Bảng Điều Khiển Menu TUI/CLI Kiểu Archify (5 Phân Hệ: Package, Cài Đặt, Môi Trường, Localhost & API Token)] — Tác dụng: Khi kích hoạt sẽ tự động quét toàn bộ mã nguồn dự án và tạo ra Menu TUI/CLI tương tác gồm 5 mục: (1) Kiểm tra trạng thái package & môi trường cần có, (2) Cài đặt package còn thiếu, (3) Thiết lập môi trường bắt buộc (.venv/.env/Runtime), (4) Bật/tắt package, môi trường & máy chủ localhost chạy source, (5) Cấu hình kết nối API & Token bên thứ 3 an toàn — Kích hoạt: Khi gọi /tui-package-env-manager hoặc yêu cầu tạo menu TUI/CLI quản trị dự án.
---

# KỸ NĂNG CHUYÊN SÂU: `TUI-PACKAGE-ENV-MANAGER` (FULL-PROJECT SCAN & 5-MODULE ARCHIFY TUI/CLI — `version.4.6.0.2`)

## 1. Quy Trình Quét Toàn Dự Án & 5 Mục Menu TUI/CLI Bắt Buộc
- **Tên định danh (`Identifier`):** `tui-package-env-manager`
- **Cơ chế kích hoạt tự động (`Full-Project Deep Scan ➔ Generate TUI/CLI`):** Ngay khi người dùng gọi `/tui-package-env-manager`, Agent **BẮT BUỘC quét đệ quy toàn bộ cây thư mục dự án** (tất cả `package.json`, `pyproject.toml`, `requirements.txt`, `.env*`, tệp khởi chạy `server.js`/`main.py`/`index.ts`, cổng `PORT`/`localhost` và các biến `API/Token` trong code) rồi tạo bộ **Menu `TUI/CLI` kiểu `Archify / Linutil`** gồm đúng **5 mục cốt lõi**:
  1. **`[1] Kiểm tra Trạng thái Package & Môi trường Cần có`:** Soi trực tiếp từng gói thư viện (`[✓ INSTALLED | vX.Y.Z]` / `[✗ MISSING]`) và kiểm tra các trình chạy/công cụ nền tảng máy cần có để chạy source (`Node.js`, `npm/pnpm/bun`, `Python`, `uv/.venv`, `Git`, DB/dịch vụ đi kèm).
  2. **`[2] Cài đặt các Package Còn thiếu`:** Cho phép bấm cài từng gói lẻ hoặc cài trọn bộ các `package` máy/dự án chưa cài bằng đúng trình quản lý của source (`npm/pnpm install`, `uv sync`, `.venv\Scripts\pip install`) không cài bừa ra toàn cục.
  3. **`[3] Thiết lập Môi trường Cần thiết cho Source Hoạt động`:** Tự động dựng môi trường chuẩn (tạo `.venv`, sinh `.env` từ `.env.example`, tạo thư mục `logs/data` bắt buộc, đối chiếu phiên bản Runtime tương thích).
  4. **`[4] Bật / Tắt Package, Môi trường & `localhost` Chạy Source`:** Công tắc `[ON / OFF]` bật/tắt gói/module tùy chọn, đảo hồ sơ `.env` (`development` ⇄ `production`), kích hoạt `.venv`, và **khởi chạy / dừng máy chủ `http://localhost:<PORT>`** (kiểm tra cổng `socket`, quản lý khóa `.run/<app>.pid` chống kẹt cổng).
  5. **`[5] Cấu hình Kết nối API & Token Bên Thứ 3`:** Tự dò các khóa `API_KEY`, `TOKEN`, `SECRET`, `WEBHOOK_URL` mà source yêu cầu, hiển thị trạng thái kèm che dấu (`sk-****9f2a`), cho phép nhập/lưu vào `.env` (tự sao lưu `.env.bak` & thêm `.env` vào `.gitignore`) và bấm kiểm thử kết nối (`Ping/Verify API`).

## 2. Quy tắc Thực thi Bắt buộc (`Mandatory Rules`)
1. **Ép chuẩn `UTF-8` & Cờ Không Tương tác (`Windows UTF-8 & Non-TTY CLI Flags`):** Bắt buộc bật `UTF-8` (`sys.stdout.reconfigure(encoding="utf-8")` / `[Console]::OutputEncoding = [Text.Encoding]::UTF8`) và hỗ trợ cờ CLI (`--scan`, `--status`, `--install-missing`, `--start`, `--stop`, `--set-token`, `--json`) để chạy mượt cả khi người dùng bấm phím `↑/↓/Space/Enter` lẫn khi gọi tự động.
2. **Quét Gộp `< 50ms` & Khóa `PID` Cổng `localhost` (`Fast Probe & Safe Localhost Runner`):** Đọc trực tiếp `node_modules/<pkg>/package.json` và `importlib.metadata`; dò trạng thái cổng `127.0.0.1:<PORT>` bằng `socket` trước khi bật `localhost` và tắt đúng cây tiến trình theo `.run/<app>.pid`.
3. **Bảo Mật Khóa Bên Thứ 3 & Dọn Sạch `TTY` (`Secret Masking & Clean Teardown`):** Tuyệt đối không in lộ nguyên chuỗi `Token/API Key` ra màn hình `TUI` hay log; luôn sao lưu `.env.bak` trước khi sửa và bọc vòng lặp phím trong `try...finally` để khôi phục con trỏ (`\x1b[?25h`) khi bấm `Q` / `Ctrl+C`.

## 3. Mẫu Triển khai Chuẩn Thực chiến (`Production Pattern: 5-Module Archify Workspace Engine`)
```python
import importlib.metadata as py_meta
import json, os, pathlib, re, shutil, signal, socket, subprocess

TOKEN_KEY_RE = re.compile(r"\b([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|WEBHOOK|CLIENT_ID|API_URL)[A-Z0-9_]*)\b")
SKIP_DIRS = {"node_modules", ".venv", ".git", "__pycache__", "dist", "build"}

class ArchifyWorkspaceManager:
    """Động cơ quét toàn dự án & vận hành 5 phân hệ Menu TUI/CLI kiểu Archify."""
    def __init__(self, root: str = ".") -> None:
        self.root = pathlib.Path(root).resolve()

    @staticmethod
    def mask_secret(val: str) -> str:
        v = val.strip().strip("\"'")
        return "[✗ CHƯA NHẬP]" if not v else (f"{v[:3]}****{v[-3:]}" if len(v) > 7 else "****")

    def probe_node_packages(self, project_dir: pathlib.Path | None = None) -> list[dict[str, str]]:
        base = project_dir or self.root
        pkg_json = base / "package.json"
        if not pkg_json.exists():
            return []
        data = json.loads(pkg_json.read_text(encoding="utf-8"))
        deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
        out: list[dict[str, str]] = []
        for name, spec in sorted(deps.items()):
            inst = base / "node_modules" / name / "package.json"
            ver = json.loads(inst.read_text(encoding="utf-8")).get("version", "?") if inst.exists() else "-"
            out.append({"ecosystem": "node", "name": name, "spec": spec, "installed": ver, "status": "INSTALLED" if inst.exists() else "MISSING"})
        return out

    def probe_python_packages(self, names: list[str]) -> list[dict[str, str]]:
        out: list[dict[str, str]] = []
        for n in names:
            try:
                out.append({"ecosystem": "python", "name": n, "installed": py_meta.version(n), "status": "INSTALLED"})
            except py_meta.PackageNotFoundError:
                out.append({"ecosystem": "python", "name": n, "installed": "-", "status": "MISSING"})
        return out

    def scan_workspace(self) -> dict[str, object]:
        files = [p for p in self.root.rglob("*") if not (SKIP_DIRS & set(p.relative_to(self.root).parts)) and p.is_file()]
        sub_pkgs = [p.parent.relative_to(self.root).as_posix() for p in files if p.name == "package.json"]
        entries = [p.relative_to(self.root).as_posix() for p in files if p.name in {"server.js", "app.js", "index.ts", "main.py"}]
        api_keys = {k for p in files if p.suffix in {".js", ".ts", ".py", ".env", ".example"} for k in TOKEN_KEY_RE.findall(p.read_text(encoding="utf-8", errors="ignore"))}
        return {"node_projects": sorted(sub_pkgs), "entrypoints": sorted(entries), "required_runtimes": {r: bool(shutil.which(r)) for r in ("node", "npm", "python", "git")}, "detected_api_keys": sorted(api_keys)}

    def install_missing_packages(self, dry_run: bool = False) -> list[str]:
        cmds: list[str] = []
        if (self.root / "package.json").exists() and any(p["status"] == "MISSING" for p in self.probe_node_packages()):
            cmds.append("pnpm install" if (self.root / "pnpm-lock.yaml").exists() else "npm install")
        vpip = self.root / ".venv" / "Scripts" / "pip.exe"
        if (self.root / "requirements.txt").exists() and vpip.exists():
            cmds.append(f'"{vpip}" install -r requirements.txt')
        for c in ([] if dry_run else cmds):
            subprocess.run(c, cwd=self.root, shell=True, check=True)
        return cmds

    def bootstrap_environment(self) -> dict[str, bool]:
        dst, ex, ig = self.root / ".env", self.root / ".env.example", self.root / ".gitignore"
        if not dst.exists():
            shutil.copy2(ex, dst) if ex.exists() else dst.write_text("NODE_ENV=development\nPORT=3000\n", encoding="utf-8")
        ig_txt = ig.read_text(encoding="utf-8") if ig.exists() else ""
        if ".env" not in ig_txt.splitlines():
            ig.write_text((ig_txt.rstrip() + "\n.env\n.env.bak\n.run/\n").lstrip(), encoding="utf-8")
        return {"env_created": dst.exists(), "gitignore_protected": True}

    def get_env_state(self, port: int = 3000) -> dict[str, object]:
        venv_ok, env_file, env_map = (self.root / ".venv" / "Scripts" / "python.exe").exists(), self.root / ".env", {}
        if env_file.exists():
            env_map = {ln.split("=", 1)[0].strip(): ln.split("=", 1)[1].strip().strip("\"'") for ln in env_file.read_text(encoding="utf-8", errors="ignore").splitlines() if "=" in ln and not ln.lstrip().startswith("#")}
        mode = (env_map.get("APP_ENV") or env_map.get("NODE_ENV") or "CUSTOM (.env)") if env_file.exists() else "OFF"
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.05)
            local_up = s.connect_ex(("127.0.0.1", port)) == 0
        return {"venv_ready": venv_ok, "env_exists": env_file.exists(), "active_profile": mode, "localhost_up": local_up, "port": port, "env_map": env_map}

    def toggle_env_profile(self, profile: str) -> str:
        src, dst = self.root / f".env.{profile}", self.root / ".env"
        if not src.exists():
            raise FileNotFoundError(f"Không tìm thấy hồ sơ nguồn: {src.name}")
        if dst.exists():
            shutil.copy2(dst, self.root / ".env.bak")
        shutil.copy2(src, dst)
        return profile

    def toggle_localhost(self, port: int = 3000, start_cmd: list[str] | None = None) -> str:
        pid_file = self.root / ".run" / f"localhost_{port}.pid"
        pid_file.parent.mkdir(exist_ok=True)
        if pid_file.exists():
            pid = int(pid_file.read_text(encoding="utf-8").strip())
            subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True) if os.name == "nt" else os.kill(pid, signal.SIGTERM)
            pid_file.unlink(missing_ok=True)
            return "STOPPED"
        if not start_cmd:
            return "IDLE"
        proc = subprocess.Popen(start_cmd, cwd=self.root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        pid_file.write_text(str(proc.pid), encoding="utf-8")
        return f"RUNNING (PID {proc.pid})"

    def configure_third_party_token(self, key: str, token_value: str) -> str:
        self.bootstrap_environment()
        dst = self.root / ".env"
        shutil.copy2(dst, self.root / ".env.bak")
        lines = dst.read_text(encoding="utf-8").splitlines()
        out = [f"{key}={token_value}" if ln.startswith(f"{key}=") else ln for ln in lines]
        if not any(ln.startswith(f"{key}=") for ln in lines):
            out.append(f"{key}={token_value}")
        dst.write_text("\n".join(out) + "\n", encoding="utf-8")
        return self.mask_secret(token_value)

    def render_arch_tui_frame(self, title: str = "ARCHIFY WORKSPACE CONTROL", port: int = 3000) -> str:
        st, pkgs, scan = self.get_env_state(port), self.probe_node_packages(), self.scan_workspace()
        miss, api_keys = sum(1 for p in pkgs if p["status"] == "MISSING"), scan["detected_api_keys"]
        loc, api_ok = ("[ON]" if st["localhost_up"] else "[OFF]"), sum(1 for k in api_keys if st["env_map"].get(k))
        hdr = f"ENV:[{st['active_profile']}] | VENV:{'[ON]' if st['venv_ready'] else '[OFF]'} | LOCAL:{loc}:{port}"
        menu = [
            f"[1] Kiểm tra Package & Môi trường ({len(pkgs) - miss}/{len(pkgs)} gói OK)",
            f"[2] Cài đặt Package còn thiếu      ({miss} gói cần cài)",
            f"[3] Thiết lập Môi trường Source    (.env/.venv/Runtime)",
            f"[4] Bật/Tắt Package, Env & Server  (localhost:{port} {loc})",
            f"[5] Cấu hình API & Token Bên Thứ 3 ({api_ok}/{len(api_keys)} khóa đã nhập)",
        ]
        ftr = "[↑/↓] Chọn mục  [Enter] Mở  [Space] Bật/Tắt  [Q] Thoát"
        rows = [f"╭── {title} {'─' * max(1, 55 - len(title))}╮", f"│ {hdr[:57]:<57} │", f"├── ARCHIFY 5-MODULE MENU {'─' * 34}┤"]
        rows.extend(f"│ {m[:57]:<57} │" for m in menu)
        return "\n".join([*rows, f"├── {ftr} {'─' * max(1, 55 - len(ftr))}┤", f"╰{'─' * 59}╯"])
```

## 4. Danh sách Nghiệm thu & Kiểm định Chất lượng (`Verification Checklist`)
- [x] Khi kích hoạt `/tui-package-env-manager`, tự động quét toàn bộ cây thư mục dự án và dựng đầy đủ **5 mục Menu `TUI/CLI`** chuẩn `UTF-8` căn khít khung `61` cột trên Windows.
- [x] Quét trạng thái `package` & Runtime `< 50ms`, cài đúng gói thiếu theo lockfile, khởi tạo `.env`/`.venv` an toàn, bật/tắt `localhost:<PORT>` chuẩn khóa `PID` và che dấu `100%` khóa `API/Token` bên thứ 3.
