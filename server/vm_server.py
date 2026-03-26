"""
Cider VM Server — runs inside each Tart VM sandbox.

Start with: uvicorn vm_server:app --host 0.0.0.0 --port 8000
"""
import json
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

import sandbox

app = FastAPI(title="Cider Sandbox", version="0.1.0")


# --- Request models ---

class ExecRequest(BaseModel):
    command: str
    cwd: Optional[str] = None

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
    device_name: Optional[str] = None

class CreateProjectRequest(BaseModel):
    name: str


# --- REST endpoints ---

@app.get("/status")
async def status():
    return await sandbox.get_system_status()


@app.post("/exec")
async def exec_command(req: ExecRequest):
    return await sandbox.run_command(req.command, req.cwd)


@app.post("/files/write")
async def files_write(req: FileWriteRequest):
    return sandbox.write_file(req.path, req.content)


@app.post("/files/read")
async def files_read(req: FileReadRequest):
    return sandbox.read_file(req.path)


@app.post("/files/list")
async def files_list(req: FileListRequest):
    return sandbox.list_directory(req.path, req.recursive)


@app.post("/files/mkdir")
async def files_mkdir(req: MkdirRequest):
    return sandbox.make_directory(req.path)


@app.get("/screenshot")
async def screenshot():
    data = await sandbox.take_screenshot()
    if data is None:
        return {"error": "Failed to capture screenshot. Is a simulator booted?"}
    return Response(content=data, media_type="image/jpeg")


@app.websocket("/ws/video")
async def ws_video(websocket: WebSocket):
    status = await sandbox.get_system_status()
    sims = status.get("booted_simulators", [])
    if not sims:
        await websocket.close(code=1008, reason="No booted simulator")
        return
    udid = sims[0]["udid"]
    await websocket.accept()
    try:
        async for frame in sandbox.stream_frames_ws(udid):
            await websocket.send_json(frame)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass


@app.get("/app/detect")
async def app_detect(project_dir: str = "project"):
    return await sandbox.detect_app(project_dir)


@app.get("/app/run")
async def app_run(project_dir: str = "project", scheme: Optional[str] = None):
    import json as _json

    async def error_stream(msg: str):
        yield f'data: {_json.dumps({"type": "error", "data": msg})}\n\n'

    try:
        status = await sandbox.get_system_status()
    except Exception as e:
        return StreamingResponse(error_stream(f"Status error: {e}"), media_type="text/event-stream")

    sims = status.get("booted_simulators", [])
    if not sims:
        return StreamingResponse(error_stream("No booted simulator"), media_type="text/event-stream")

    udid = sims[0]["udid"]

    async def generate():
        try:
            async for event in sandbox.build_and_run_app(udid, project_dir, scheme):
                yield f"data: {_json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {_json.dumps({'type': 'error', 'data': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/simulator/boot")
async def simulator_boot(req: BootSimulatorRequest):
    return await sandbox.boot_simulator(req.device_name)


@app.post("/project/create")
async def project_create(req: CreateProjectRequest):
    return sandbox.create_project(req.name)


# --- WebSocket for streaming command output ---

@app.websocket("/ws/exec")
async def ws_exec(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            command = msg.get("command", "")
            cwd = msg.get("cwd")

            async for chunk in sandbox.stream_command(command, cwd):
                await websocket.send_json(chunk)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "data": str(e)})
        except Exception:
            pass
