import asyncio
import logging

from config import TART_BASE_IMAGE, VM_BOOT_TIMEOUT

logger = logging.getLogger("cider.tart")

# Track running `tart run` background processes
_running_vms: dict[str, asyncio.subprocess.Process] = {}


async def clone_and_boot(vm_name: str) -> str:
    """Clone base image, boot VM, wait for server ready. Returns IP.

    Used by create_vm and the warm pool.
    """
    # Clone from base image
    logger.info(f"Cloning {TART_BASE_IMAGE} → {vm_name}")
    proc = await asyncio.create_subprocess_exec(
        "tart", "clone", TART_BASE_IMAGE, vm_name,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"tart clone failed: {stderr.decode().strip()}")

    # Run VM in background (tart run blocks until VM shuts down)
    logger.info(f"Starting VM {vm_name}")
    run_proc = await asyncio.create_subprocess_exec(
        "tart", "run", vm_name, "--no-graphics",
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
    _running_vms[vm_name] = run_proc

    # Wait for IP
    ip = await _wait_for_ip(vm_name, timeout=VM_BOOT_TIMEOUT)
    logger.info(f"VM {vm_name} got IP: {ip}")

    # Wait for sandbox server inside VM to be ready
    await _wait_for_server(ip, timeout=60)
    logger.info(f"VM {vm_name} server ready at {ip}:8000")

    return ip


async def create_vm(sandbox_id: str) -> str:
    """Clone base image, boot VM, wait for server, return IP."""
    return await clone_and_boot(f"cider-{sandbox_id}")


async def stop_vm(vm_name: str):
    """Stop a running VM."""
    logger.info(f"Stopping VM {vm_name}")
    proc = await asyncio.create_subprocess_exec(
        "tart", "stop", vm_name,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await proc.communicate()

    # Clean up tracked process
    if vm_name in _running_vms:
        p = _running_vms.pop(vm_name)
        try:
            p.terminate()
        except ProcessLookupError:
            pass


async def delete_vm(vm_name: str):
    """Delete a VM (must be stopped first)."""
    logger.info(f"Deleting VM {vm_name}")
    proc = await asyncio.create_subprocess_exec(
        "tart", "delete", vm_name,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        logger.warning(f"tart delete {vm_name} failed: {stderr.decode().strip()}")


async def get_vm_ip(vm_name: str) -> str | None:
    """Get IP address of a running VM."""
    proc = await asyncio.create_subprocess_exec(
        "tart", "ip", vm_name,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        return None
    ip = stdout.decode().strip()
    return ip if ip else None


async def _wait_for_ip(vm_name: str, timeout: int = 120) -> str:
    """Poll tart ip until the VM has an IP address."""
    import time
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        ip = await get_vm_ip(vm_name)
        if ip:
            return ip
        await asyncio.sleep(2)
    raise TimeoutError(f"VM {vm_name} did not get an IP within {timeout}s")


async def _wait_for_server(ip: str, timeout: int = 60):
    """Poll the sandbox server inside the VM until it responds."""
    import time
    import httpx

    start = time.monotonic()
    async with httpx.AsyncClient(timeout=5) as client:
        while time.monotonic() - start < timeout:
            try:
                resp = await client.get(f"http://{ip}:8000/status")
                if resp.status_code == 200:
                    return
            except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout):
                pass
            await asyncio.sleep(2)
    raise TimeoutError(f"Sandbox server at {ip}:8000 did not respond within {timeout}s")


async def cleanup_all():
    """Stop all tracked VMs. Called on server shutdown."""
    for vm_name in list(_running_vms.keys()):
        try:
            await stop_vm(vm_name)
        except Exception as e:
            logger.warning(f"Failed to stop {vm_name}: {e}")
