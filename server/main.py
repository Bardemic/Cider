"""
Cider Host Server — manages Tart VM sandboxes and proxies requests into them.

This runs on the Mac host. Each sandbox is a Tart VM running its own FastAPI
sandbox server. This server handles lifecycle (create/list/delete) and proxies
per-sandbox requests to the correct VM by IP lookup in SQLite.
"""

import json
import secrets
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel

import db
import tart
import proxy
import pool
from config import WARM_POOL_SIZE

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
logger = logging.getLogger("cider.host")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    logger.info("Database initialized")
    pool.start(WARM_POOL_SIZE)
    yield
    await pool.stop()
    await tart.cleanup_all()
    await proxy.close()
    logger.info("Shutting down")


app = FastAPI(title="Cider Host Server", version="0.2.0", lifespan=lifespan)


# --- Request models ---

class CreateSandboxRequest(BaseModel):
    repo: str | None = None

class ExecRequest(BaseModel):
    command: str
    cwd: str | None = None

class FileWriteRequest(BaseModel):
    path: str
    content: str

class FileReadRequest(BaseModel):
    path: str

class FileListRequest(BaseModel):
    path: str = "."
    recursive: bool = False

class MkdirRequest(BaseModel):
    path: str

class BootSimulatorRequest(BaseModel):
    device_name: str | None = None

class CreateProjectRequest(BaseModel):
    name: str


# --- Helpers ---

def _generate_sandbox_id() -> str:
    return f"sbx-{secrets.token_hex(4)}"


async def _get_sandbox_ip(sandbox_id: str) -> str:
    """Look up a sandbox's VM IP. Raises 404 if not found, 409 if not ready."""
    sandbox = db.get_sandbox(sandbox_id)
    if not sandbox:
        raise HTTPException(status_code=404, detail=f"Sandbox {sandbox_id} not found")
    if sandbox["status"] != "running":
        raise HTTPException(
            status_code=409,
            detail=f"Sandbox {sandbox_id} is {sandbox['status']}, not running",
        )
    if not sandbox["ip"]:
        raise HTTPException(
            status_code=409, detail=f"Sandbox {sandbox_id} has no IP yet"
        )
    return sandbox["ip"]


# ===========================================================================
# Sandbox lifecycle endpoints
# ===========================================================================

@app.post("/sandboxes")
async def create_sandbox(req: CreateSandboxRequest):
    sandbox_id = _generate_sandbox_id()

    # Insert into DB as 'creating' with a placeholder vm_name; updated after pool acquire
    db.create_sandbox(sandbox_id, f"cider-{sandbox_id}")
    logger.info(f"Creating sandbox {sandbox_id}")

    try:
        # Grab a pre-warmed VM (or create one on-demand if pool is empty)
        warm = await pool.acquire()
        vm_name = warm["vm_name"]
        ip = warm["ip"]
        db.update_sandbox(sandbox_id, ip=ip, status="running", vm_name=vm_name)
        logger.info(f"Sandbox {sandbox_id} assigned warm VM {vm_name} ({ip})")

        # If repo URL provided, clone it inside the VM
        if req.repo:
            clone_resp = await proxy.proxy_post(
                ip, "/exec", {"command": f"git clone {req.repo} project"}
            )
            logger.info(f"Cloned repo {req.repo} into sandbox {sandbox_id}")

        sandbox = db.get_sandbox(sandbox_id)
        return sandbox

    except Exception as e:
        db.update_sandbox(sandbox_id, status="error")
        logger.error(f"Failed to create sandbox {sandbox_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sandboxes")
async def list_sandboxes():
    return db.list_sandboxes()


@app.get("/sandboxes/{sandbox_id}")
async def get_sandbox(sandbox_id: str):
    sandbox = db.get_sandbox(sandbox_id)
    if not sandbox:
        raise HTTPException(status_code=404, detail=f"Sandbox {sandbox_id} not found")
    return sandbox


@app.delete("/sandboxes/{sandbox_id}")
async def delete_sandbox(sandbox_id: str):
    sandbox = db.get_sandbox(sandbox_id)
    if not sandbox:
        raise HTTPException(status_code=404, detail=f"Sandbox {sandbox_id} not found")

    vm_name = sandbox["vm_name"]
    logger.info(f"Deleting sandbox {sandbox_id} (VM: {vm_name})")

    try:
        await tart.stop_vm(vm_name)
    except Exception as e:
        logger.warning(f"Failed to stop VM {vm_name}: {e}")

    try:
        await tart.delete_vm(vm_name)
    except Exception as e:
        logger.warning(f"Failed to delete VM {vm_name}: {e}")

    db.delete_sandbox(sandbox_id)
    return {"status": "deleted", "sandbox_id": sandbox_id}


# ===========================================================================
# Per-sandbox proxy endpoints — forward to VM's FastAPI server
# ===========================================================================

@app.get("/sandboxes/{sandbox_id}/status")
async def sandbox_status(sandbox_id: str):
    ip = await _get_sandbox_ip(sandbox_id)
    return await proxy.proxy_get(ip, "/status")


@app.post("/sandboxes/{sandbox_id}/exec")
async def sandbox_exec(sandbox_id: str, req: ExecRequest):
    ip = await _get_sandbox_ip(sandbox_id)
    body = {"command": req.command}
    if req.cwd:
        body["cwd"] = req.cwd
    return await proxy.proxy_post(ip, "/exec", body)


@app.post("/sandboxes/{sandbox_id}/files/write")
async def sandbox_files_write(sandbox_id: str, req: FileWriteRequest):
    ip = await _get_sandbox_ip(sandbox_id)
    return await proxy.proxy_post(ip, "/files/write", {"path": req.path, "content": req.content})


@app.post("/sandboxes/{sandbox_id}/files/read")
async def sandbox_files_read(sandbox_id: str, req: FileReadRequest):
    ip = await _get_sandbox_ip(sandbox_id)
    return await proxy.proxy_post(ip, "/files/read", {"path": req.path})


@app.post("/sandboxes/{sandbox_id}/files/list")
async def sandbox_files_list(sandbox_id: str, req: FileListRequest):
    ip = await _get_sandbox_ip(sandbox_id)
    return await proxy.proxy_post(ip, "/files/list", {"path": req.path, "recursive": req.recursive})


@app.post("/sandboxes/{sandbox_id}/files/mkdir")
async def sandbox_files_mkdir(sandbox_id: str, req: MkdirRequest):
    ip = await _get_sandbox_ip(sandbox_id)
    return await proxy.proxy_post(ip, "/files/mkdir", {"path": req.path})


@app.get("/sandboxes/{sandbox_id}/screenshot")
async def sandbox_screenshot(sandbox_id: str):
    ip = await _get_sandbox_ip(sandbox_id)
    return await proxy.proxy_get(ip, "/screenshot")


@app.websocket("/sandboxes/{sandbox_id}/ws/video")
async def sandbox_ws_video(websocket: WebSocket, sandbox_id: str):
    try:
        ip = await _get_sandbox_ip(sandbox_id)
    except HTTPException as e:
        await websocket.close(code=1008, reason=e.detail)
        return
    await websocket.accept()
    await proxy.proxy_websocket(websocket, ip, "/ws/video")


@app.get("/sandboxes/{sandbox_id}/app/detect")
async def sandbox_app_detect(sandbox_id: str, project_dir: str = "project"):
    ip = await _get_sandbox_ip(sandbox_id)
    return await proxy.proxy_get(ip, f"/app/detect?project_dir={project_dir}")


@app.get("/sandboxes/{sandbox_id}/app/run")
async def sandbox_app_run(sandbox_id: str, project_dir: str = "project", scheme: str | None = None):
    ip = await _get_sandbox_ip(sandbox_id)
    path = f"/app/run?project_dir={project_dir}"
    if scheme:
        path += f"&scheme={scheme}"
    return await proxy.proxy_stream_get(ip, path, "text/event-stream")


@app.post("/sandboxes/{sandbox_id}/simulator/boot")
async def sandbox_simulator_boot(sandbox_id: str, req: BootSimulatorRequest):
    ip = await _get_sandbox_ip(sandbox_id)
    body = {}
    if req.device_name:
        body["device_name"] = req.device_name
    return await proxy.proxy_post(ip, "/simulator/boot", body)


@app.post("/sandboxes/{sandbox_id}/project/create")
async def sandbox_project_create(sandbox_id: str, req: CreateProjectRequest):
    ip = await _get_sandbox_ip(sandbox_id)
    return await proxy.proxy_post(ip, "/project/create", {"name": req.name})
