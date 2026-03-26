import asyncio
import httpx
from fastapi import Request
from fastapi.responses import Response, JSONResponse, StreamingResponse

# Shared client with generous timeout for xcodebuild etc.
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0))
    return _client


async def proxy_get(ip: str, path: str) -> Response:
    """Forward a GET request to a sandbox VM."""
    client = _get_client()
    url = f"http://{ip}:8000{path}"
    resp = await client.get(url)

    content_type = resp.headers.get("content-type", "application/json")
    if "image/" in content_type:
        return Response(content=resp.content, media_type=content_type)
    return JSONResponse(content=resp.json(), status_code=resp.status_code)


async def proxy_post(ip: str, path: str, body: dict) -> JSONResponse:
    """Forward a POST request to a sandbox VM."""
    client = _get_client()
    url = f"http://{ip}:8000{path}"
    resp = await client.post(url, json=body)
    return JSONResponse(content=resp.json(), status_code=resp.status_code)


async def proxy_stream_get(ip: str, path: str, media_type: str):
    """Stream a GET response from a sandbox VM (e.g. SSE app/run output)."""
    async def generate():
        async with httpx.AsyncClient(timeout=httpx.Timeout(None)) as client:
            async with client.stream("GET", f"http://{ip}:8000{path}") as response:
                if response.status_code >= 400:
                    body = await response.aread()
                    error_text = body.decode(errors="replace").replace('"', '\\"')
                    yield f'data: {{"type":"error","data":"VM error {response.status_code}: {error_text}"}}\n\n'.encode()
                    return
                async for chunk in response.aiter_bytes(chunk_size=16384):
                    yield chunk
    return StreamingResponse(generate(), media_type=media_type)


import websockets as _ws


async def proxy_websocket(client_ws, ip: str, path: str):
    """Bidirectional WebSocket proxy between a FastAPI WebSocket and a VM WebSocket."""
    uri = f"ws://{ip}:8000{path}"
    try:
        async with _ws.connect(uri, max_size=None) as vm_ws:
            async def vm_to_client():
                try:
                    async for msg in vm_ws:
                        if isinstance(msg, bytes):
                            await client_ws.send_bytes(msg)
                        else:
                            await client_ws.send_text(msg)
                except Exception:
                    pass

            async def client_to_vm():
                try:
                    while True:
                        data = await client_ws.receive_text()
                        await vm_ws.send(data)
                except Exception:
                    pass

            await asyncio.gather(vm_to_client(), client_to_vm())
    except Exception:
        pass


async def close():
    """Close the shared HTTP client."""
    global _client
    if _client:
        await _client.aclose()
        _client = None
