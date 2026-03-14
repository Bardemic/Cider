import os
from pathlib import Path

# Root directory where Xcode projects live
PROJECT_ROOT = Path(os.environ.get("CIDER_PROJECT_ROOT", Path.home() / "CiderProjects"))

# Path to the Xcode template project
TEMPLATE_PROJECT = Path(os.environ.get("CIDER_TEMPLATE_PATH", Path.home() / "CiderTemplate" / "CiderTemplate.xcodeproj" / ".."))

# Command execution timeout in seconds
EXEC_TIMEOUT = int(os.environ.get("CIDER_EXEC_TIMEOUT", "120"))

# Simulator device name
SIMULATOR_DEVICE = os.environ.get("CIDER_SIMULATOR_DEVICE", "iPhone 16")

# Server host/port
HOST = os.environ.get("CIDER_HOST", "0.0.0.0")
PORT = int(os.environ.get("CIDER_PORT", "8000"))

# Tart VM management (host server only)
TART_BASE_IMAGE = os.environ.get("CIDER_TART_BASE_IMAGE", "cider-base")
DB_PATH = Path(os.environ.get("CIDER_DB_PATH", Path.home() / ".cider" / "cider.db"))
VM_BOOT_TIMEOUT = int(os.environ.get("CIDER_VM_BOOT_TIMEOUT", "120"))
WARM_POOL_SIZE = int(os.environ.get("CIDER_WARM_POOL_SIZE", "1"))
