# Cider CLI — Tool Reference for AI Agents

## What Cider Is

Cider gives you a macOS sandbox in the cloud — so you can build, compile, and test iOS apps from any machine, even if you don't have a Mac. Each sandbox is an isolated macOS VM with Xcode, the iOS Simulator, and the Swift compiler pre-installed.

**Why this matters:** Xcode only runs on macOS. Without Cider, building an iOS app requires owning a Mac ($600+). With Cider, you run `cider create` from any OS, get a sandbox, and start building — the Mac is invisible infrastructure.

## Setup

```bash
# Set the host URL (required before any command)
export CIDER_API_URL=https://2bc6-50-171-72-195.ngrok-free.app/

# Verify connection
cider status
# ✓ Connected — 0 sandbox(es)

# Authenticate with Gemini (once)
cider google login
# Get your key at https://aistudio.google.com/apikey
```

## Commands

| Command | What it does |
|---|---|
| `cider create` | Create a new macOS sandbox (Tart VM with Xcode). Returns a sandbox ID. |
| `cider create --repo <url>` | Create sandbox and clone a repo into it. |
| `cider list` | List all sandboxes with ID, IP, status. |
| `cider status` | Check if the host server is reachable. |
| `cider <ID> --emulator ios` | Boot iPhone 16 simulator in the sandbox. **Do this before building.** |
| `cider <ID> --google` | Start interactive Gemini agent session to build an iOS app. |
| `cider stop <ID>` | Stop and permanently delete a sandbox. |
| `cider google login` | Save your Gemini API key. |

## Full Workflow: Zero to Running iOS App

```bash
# 1. Create a sandbox (~30-90 sec)
cider create
#   ✓ Sandbox ready
#   ID:      sbx-6017f799
#   VM:      cider-sbx-6017f799
#   IP:      192.168.64.74
#   Status:  running

# 2. Boot the simulator
cider sbx-6017f799 --emulator ios
#   ✓ iPhone 16 booted

# 3. Build an app with the Gemini agent
cider sbx-6017f799 --google
> Build a simple counter app for iPhone with plus, minus, and reset buttons

# The agent autonomously:
#   ⚡ create_xcode_project CounterApp
#   ⚡ list_files CounterApp
#   ⚡ create_file CounterApp/CounterApp/ContentView.swift
#   ⚡ execute_command $ xcodebuild -project CounterApp.xcodeproj ...
#   (if build fails → reads errors → fixes code → rebuilds)
#   ⚡ execute_command $ xcrun simctl install booted ...
#   ⚡ execute_command $ xcrun simctl launch booted ...
#   ⚡ get_screenshot
#   ✓ Agent finished

# 4. Clean up
cider stop sbx-6017f799
#   ✓ Sandbox stopped and deleted
```

## Sandbox API (Direct Access)

For programmatic control beyond the CLI, call the sandbox API directly. All endpoints are scoped by sandbox ID.

| Endpoint | Method | Purpose |
|---|---|---|
| `/sandboxes` | POST | Create a new sandbox |
| `/sandboxes` | GET | List all sandboxes |
| `/sandboxes/<ID>` | DELETE | Stop and delete a sandbox |
| `/sandboxes/<ID>/status` | GET | macOS version, Xcode version, booted simulators |
| `/sandboxes/<ID>/exec` | POST | Run a shell command (`{"command": "..."}`) |
| `/sandboxes/<ID>/files/write` | POST | Write a file (`{"path": "...", "content": "..."}`) |
| `/sandboxes/<ID>/files/read` | POST | Read a file (`{"path": "..."}`) |
| `/sandboxes/<ID>/files/list` | POST | List directory (`{"path": ".", "recursive": true}`) |
| `/sandboxes/<ID>/simulator/boot` | POST | Boot iOS Simulator |
| `/sandboxes/<ID>/project/create` | POST | Create Xcode project from template (`{"name": "..."}`) |
| `/sandboxes/<ID>/screenshot` | GET | Capture simulator screen (returns PNG) |

Example:
```bash
# Run a command inside a sandbox
curl -X POST $CIDER_API_URL/sandboxes/sbx-6017f799/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "xcodebuild -version"}'

# Write a Swift file
curl -X POST $CIDER_API_URL/sandboxes/sbx-6017f799/files/write \
  -H "Content-Type: application/json" \
  -d '{"path": "MyApp/MyApp/ContentView.swift", "content": "import SwiftUI\n..."}'

# Take a screenshot
curl $CIDER_API_URL/sandboxes/sbx-6017f799/screenshot --output screenshot.png
```

## Building iOS Apps — Key Rules

1. **Create the project first:** `cider <ID> --google` or `POST /project/create` to get a SwiftUI template.
2. **Only modify `.swift` files.** Never edit `.pbxproj` — it will break the build.
3. **Build command:** `xcodebuild -project <Name>.xcodeproj -scheme <Name> -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16' build`
4. **If the build fails**, read the error output, fix the Swift code, and rebuild. Expect 2-3 attempts.
5. **After a successful build**, install and launch:
   - `xcrun simctl install booted <path-to-.app>`
   - `xcrun simctl launch booted <bundle-identifier>`
6. **Verify with a screenshot:** `GET /sandboxes/<ID>/screenshot`
7. **The simulator must be booted first** — run `cider <ID> --emulator ios` before building.
