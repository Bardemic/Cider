"""
Warm VM pool — keeps N pre-cloned, pre-booted VMs ready so that
POST /sandboxes can hand one out immediately instead of waiting for
the full clone+boot cycle (typically 60-120 s).

Lifecycle:
  start(size)   — called at server startup; fires off initial fill
  acquire()     — pop a warm entry {vm_name, ip} from the queue;
                  if the queue is empty (race / pool too small), a VM
                  is created on-demand so the caller never blocks forever
  stop()        — called at server shutdown; drains and deletes warm VMs
"""

import asyncio
import logging
import uuid

import tart

logger = logging.getLogger("cider.pool")

# Each entry: {"vm_name": str, "ip": str}
_pool: asyncio.Queue = asyncio.Queue()
_target_size: int = 0
_filling: bool = False


def _warm_name() -> str:
    return f"cider-warm-{uuid.uuid4().hex[:8]}"


async def _create_one() -> dict:
    vm_name = _warm_name()
    ip = await tart.clone_and_boot(vm_name)
    return {"vm_name": vm_name, "ip": ip}


async def _replenish():
    """Fill the pool up to _target_size. Runs as a background task."""
    global _filling
    if _filling:
        return
    _filling = True
    try:
        while _pool.qsize() < _target_size:
            try:
                entry = await _create_one()
                await _pool.put(entry)
                logger.info(f"Warm VM ready: {entry['vm_name']} ({entry['ip']}) — pool size {_pool.qsize()}/{_target_size}")
            except Exception as e:
                logger.error(f"Failed to create warm VM: {e}")
                # Back off before retrying to avoid a tight error loop
                await asyncio.sleep(10)
    finally:
        _filling = False


def start(size: int = 1):
    """Kick off pool filling at server startup. Non-blocking."""
    global _target_size
    _target_size = size
    if size > 0:
        logger.info(f"VM warm pool target: {size}")
        asyncio.create_task(_replenish())


async def acquire() -> dict:
    """Return a warm VM entry. Falls back to on-demand creation if pool is empty."""
    try:
        entry = _pool.get_nowait()
        logger.info(f"Acquired warm VM {entry['vm_name']} from pool (remaining: {_pool.qsize()})")
    except asyncio.QueueEmpty:
        logger.warning("Warm pool empty — creating VM on demand (consider increasing CIDER_WARM_POOL_SIZE)")
        entry = await _create_one()

    # Refill in background regardless of whether we used a warm VM or not
    asyncio.create_task(_replenish())
    return entry


async def stop():
    """Drain the pool and clean up all warm VMs. Called on server shutdown."""
    logger.info("Draining warm VM pool")
    while not _pool.empty():
        try:
            entry = _pool.get_nowait()
            vm_name = entry["vm_name"]
            try:
                await tart.stop_vm(vm_name)
                await tart.delete_vm(vm_name)
                logger.info(f"Cleaned up warm VM {vm_name}")
            except Exception as e:
                logger.warning(f"Failed to cleanup warm VM {vm_name}: {e}")
        except asyncio.QueueEmpty:
            break
