import httpx
from fastapi import Request
from fastapi.responses import Response, JSONResponse

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


async def close():
    """Close the shared HTTP client."""
    global _client
    if _client:
        await _client.aclose()
        _client = None
