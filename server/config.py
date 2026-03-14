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
