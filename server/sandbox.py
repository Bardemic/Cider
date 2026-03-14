import asyncio
import subprocess
import shutil
import platform
from pathlib import Path

from config import PROJECT_ROOT, TEMPLATE_PROJECT, EXEC_TIMEOUT, SIMULATOR_DEVICE


async def run_command(command: str, cwd: str | None = None) -> dict:
    """Execute a shell command and return stdout/stderr/exit_code."""
    work_dir = cwd or str(PROJECT_ROOT)
    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=work_dir,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=EXEC_TIMEOUT)
        return {
            "stdout": stdout.decode(errors="replace"),
            "stderr": stderr.decode(errors="replace"),
            "exit_code": proc.returncode,
        }
    except asyncio.TimeoutError:
        proc.kill()
        return {"stdout": "", "stderr": f"Command timed out after {EXEC_TIMEOUT}s", "exit_code": -1}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "exit_code": -1}


async def stream_command(command: str, cwd: str | None = None):
    """Yield stdout/stderr lines as they arrive. Used by WebSocket."""
    work_dir = cwd or str(PROJECT_ROOT)
    proc = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=work_dir,
    )

    async def read_stream(stream, stream_type):
        async for line in stream:
            yield {"type": stream_type, "data": line.decode(errors="replace").rstrip("\n")}

    # Interleave stdout and stderr
    async for item in _merge_streams(
        read_stream(proc.stdout, "stdout"),
        read_stream(proc.stderr, "stderr"),
    ):
        yield item

    exit_code = await proc.wait()
    yield {"type": "exit", "code": exit_code}


async def _merge_streams(*streams):
    """Merge multiple async generators."""
    queue = asyncio.Queue()
    sentinel = object()
    remaining = len(streams)

    async def feed(stream):
        nonlocal remaining
        async for item in stream:
            await queue.put(item)
        remaining -= 1
        if remaining == 0:
            await queue.put(sentinel)

    tasks = [asyncio.create_task(feed(s)) for s in streams]
    while True:
        item = await queue.get()
        if item is sentinel:
            break
        yield item
    for t in tasks:
        t.cancel()


def write_file(path: str, content: str) -> dict:
    """Write content to a file relative to PROJECT_ROOT."""
    full_path = _resolve_path(path)
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_text(content, encoding="utf-8")
    return {"path": str(full_path), "size": len(content)}


def read_file(path: str) -> dict:
    """Read a file relative to PROJECT_ROOT."""
    full_path = _resolve_path(path)
    if not full_path.exists():
        return {"error": f"File not found: {full_path}"}
    content = full_path.read_text(encoding="utf-8")
    return {"path": str(full_path), "content": content}


def list_directory(path: str = ".", recursive: bool = False) -> dict:
    """List directory contents relative to PROJECT_ROOT."""
    full_path = _resolve_path(path)
    if not full_path.exists():
        return {"error": f"Directory not found: {full_path}"}
    entries = []
    if recursive:
        for item in sorted(full_path.rglob("*")):
            entries.append({
                "path": str(item.relative_to(PROJECT_ROOT)),
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None,
            })
    else:
        for item in sorted(full_path.iterdir()):
            entries.append({
                "path": item.name,
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None,
            })
    return {"path": str(full_path), "entries": entries}


def make_directory(path: str) -> dict:
    """Create a directory relative to PROJECT_ROOT."""
    full_path = _resolve_path(path)
    full_path.mkdir(parents=True, exist_ok=True)
    return {"path": str(full_path)}


async def take_screenshot() -> bytes | None:
    """Capture the booted iOS Simulator screen, return PNG bytes."""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp_path = f.name
    result = await run_command(f"xcrun simctl io booted screenshot {tmp_path}")
    if result["exit_code"] != 0:
        return None
    data = Path(tmp_path).read_bytes()
    Path(tmp_path).unlink(missing_ok=True)
    return data


async def boot_simulator(device_name: str | None = None) -> dict:
    """Boot an iOS Simulator device."""
    name = device_name or SIMULATOR_DEVICE
    # Find device UDID
    result = await run_command("xcrun simctl list devices available -j")
    if result["exit_code"] != 0:
        return {"error": result["stderr"]}

    import json
    devices = json.loads(result["stdout"])
    udid = None
    for runtime, device_list in devices.get("devices", {}).items():
        if "iOS" not in runtime:
            continue
        for d in device_list:
            if d["name"] == name:
                udid = d["udid"]
                if d["state"] == "Booted":
                    return {"status": "already_booted", "udid": udid, "name": name}
                break
        if udid:
            break

    if not udid:
        return {"error": f"Simulator '{name}' not found"}

    boot_result = await run_command(f"xcrun simctl boot {udid}")
    # Also open Simulator.app so screen is visible
    await run_command("open -a Simulator")
    return {"status": "booted", "udid": udid, "name": name, "stderr": boot_result["stderr"]}


def create_project(name: str) -> dict:
    """Copy the Xcode template project and rename it."""
    project_dir = PROJECT_ROOT / name
    if project_dir.exists():
        return {"error": f"Project '{name}' already exists", "path": str(project_dir)}

    PROJECT_ROOT.mkdir(parents=True, exist_ok=True)
    shutil.copytree(str(TEMPLATE_PROJECT), str(project_dir))

    # Rename files and references from template name to project name
    template_name = "CiderTemplate"
    _rename_project(project_dir, template_name, name)

    return {"path": str(project_dir), "name": name}


def _rename_project(project_dir: Path, old_name: str, new_name: str):
    """Rename template references in the copied project."""
    # Rename .xcodeproj directory
    xcodeproj = project_dir / f"{old_name}.xcodeproj"
    if xcodeproj.exists():
        xcodeproj.rename(project_dir / f"{new_name}.xcodeproj")

    # Rename source directory
    src_dir = project_dir / old_name
    if src_dir.exists():
        src_dir.rename(project_dir / new_name)

    # Replace references in text files
    for ext in ("*.swift", "*.pbxproj", "*.plist", "*.xcscheme"):
        for f in project_dir.rglob(ext):
            try:
                text = f.read_text(encoding="utf-8")
                if old_name in text:
                    f.write_text(text.replace(old_name, new_name), encoding="utf-8")
            except (UnicodeDecodeError, PermissionError):
                pass

    # Rename any remaining files with template name
    for f in project_dir.rglob(f"*{old_name}*"):
        new_path = f.parent / f.name.replace(old_name, new_name)
        if f.exists() and not new_path.exists():
            f.rename(new_path)


async def get_system_status() -> dict:
    """Gather system info: macOS version, Xcode version, simulators, disk space."""
    results = await asyncio.gather(
        run_command("sw_vers -productVersion"),
        run_command("xcodebuild -version"),
        run_command("xcrun simctl list devices booted -j"),
        run_command("df -h /"),
    )
    macos_ver = results[0]["stdout"].strip()
    xcode_ver = results[1]["stdout"].strip()

    booted_sims = []
    if results[2]["exit_code"] == 0:
        import json
        try:
            data = json.loads(results[2]["stdout"])
            for runtime, devices in data.get("devices", {}).items():
                for d in devices:
                    if d["state"] == "Booted":
                        booted_sims.append({"name": d["name"], "udid": d["udid"], "runtime": runtime})
        except json.JSONDecodeError:
            pass

    disk_info = results[3]["stdout"].strip()

    return {
        "platform": "macOS",
        "macos_version": macos_ver,
        "xcode": xcode_ver,
        "booted_simulators": booted_sims,
        "disk": disk_info,
        "project_root": str(PROJECT_ROOT),
    }


def _resolve_path(path: str) -> Path:
    """Resolve a path relative to PROJECT_ROOT, preventing directory traversal."""
    p = Path(path)
    if p.is_absolute():
        resolved = p.resolve()
    else:
        resolved = (PROJECT_ROOT / p).resolve()
    # Basic traversal check
    if not str(resolved).startswith(str(PROJECT_ROOT.resolve())):
        raise ValueError(f"Path escapes project root: {path}")
    return resolved
