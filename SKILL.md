# Cider CLI — Tool Reference for AI Agents

## What Cider Is

Cider gives you a macOS sandbox in the cloud — so you can build, compile, and test iOS apps from any machine, even if you don't have a Mac. Each sandbox is an isolated macOS VM with Xcode, the iOS Simulator, and the Swift compiler pre-installed. You interact with it through the Cider CLI or the sandbox API directly.

**Why this matters:** Xcode only runs on macOS. Without Cider, building an iOS app requires owning a Mac ($600+). With Cider, you run `cider create` from any OS, get a sandbox, and start building — the Mac is invisible infrastructure.

**What you can do with it:**
- Create and destroy macOS sandboxes on demand
- Write Swift/SwiftUI code and compile it with `xcodebuild` inside the sandbox
- Boot the iOS Simulator, install apps, take screenshots
- Use the Gemini agent to build entire iOS apps from a text prompt
- Call the sandbox API programmatically for full automation

## Commands

### Create a sandbox
```bash
export CIDER_API_URL=https://2bc6-50-171-72-195.ngrok-free.app/
cider create
cider create --repo "https://github.com/user/repo.git"
```
This clones a macOS base image (with Xcode pre-installed) into a new Tart VM, boots it, waits for the sandbox server inside the VM to be ready, and returns a sandbox ID.

Example output:
```
  ⠋ Creating sandbox...
  ✓ Sandbox ready

  ID:      sbx-6017f799
  VM:      cider-sbx-6017f799
  IP:      192.168.64.74
  Status:  running
```

The sandbox ID (`sbx-6017f799`) is what you use for all subsequent commands. The IP is the VM's internal address — the host server proxies requests to it automatically, so you never need to use the IP directly.

If `--repo` is provided, the repo is cloned inside the sandbox after boot.

### List sandboxes
```bash
cider list
```
Shows all sandboxes with their ID, VM name, IP, status, and creation time. Statuses: `creating` (VM booting), `running` (ready to use), `error` (VM failed to boot), `stopped`.

### Boot iOS Simulator
```bash
cider <ID> --emulator ios
```
Boots an iPhone 16 simulator inside the sandbox. **You must do this before building and running iOS apps.** The simulator needs to be booted for `xcodebuild` to target it and for `xcrun simctl install/launch` to work.

### Start Gemini agent session
```bash
cider <ID> --google
```
Opens an interactive prompt where you describe what to build. The Gemini agent writes Swift code, compiles with `xcodebuild`, fixes errors, and runs the app in the simulator — all autonomously.

### Check status
```bash
cider status
```
Shows whether the host server is reachable and how many sandboxes are running. Always run this first to verify your connection.

### Stop and delete a sandbox
```bash
cider stop <ID>
```
Stops the VM and deletes it. Irreversible.

### Authenticate with Gemini
```bash
cider google login
```
Prompts for a Gemini API key. Get one at https://aistudio.google.com/apikey

## Full Creation-to-Build Process

This is the exact sequence to go from zero to a running iOS app:

```bash
# 1. Set the host URL (ngrok tunnel to the Mac with Tart)
export CIDER_API_URL=https://2bc6-50-171-72-195.ngrok-free.app/

# 2. Verify connection
cider status
# ✓ Connected — 0 sandbox(es)

# 3. Authenticate with Gemini (once)
cider google login
# Enter your API key from https://aistudio.google.com/apikey

# 4. Create a sandbox (clones macOS VM, boots it, ~30-90 sec)
cider create
# ✓ Sandbox ready
# ID: sbx-6017f799

# 5. Boot the iOS Simulator inside the sandbox
cider sbx-6017f799 --emulator ios
# ✓ iPhone 16 booted

# 6. Start the Gemini agent and tell it what to build
cider sbx-6017f799 --google
> Build a simple counter app for iPhone with plus, minus, and reset buttons

# The agent will:
#   ⚡ create_xcode_project CounterApp
#   ⚡ list_files CounterApp
#   ⚡ create_file CounterApp/CounterApp/ContentView.swift
#   ⚡ execute_command $ xcodebuild -project CounterApp.xcodeproj ...
#   (if build fails, it reads errors, fixes code, rebuilds)
#   ⚡ execute_command $ xcrun simctl install booted ...
#   ⚡ execute_command $ xcrun simctl launch booted ...
#   ⚡ get_screenshot
#   ✓ Agent finished

# 7. Clean up when done
cider stop sbx-6017f799
# ✓ Sandbox stopped and deleted
```

## Connecting to the Host

The Cider CLI needs to reach a Cider host server running on a Mac. Set the `CIDER_API_URL` environment variable before using any commands.

### Connecting

The Cider host server is exposed via ngrok. Set `CIDER_API_URL` inline or export it:

```bash
# Inline (per-command)
CIDER_API_URL=https://2bc6-50-171-72-195.ngrok-free.app/ cider status

# Or export for the session
export CIDER_API_URL=https://2bc6-50-171-72-195.ngrok-free.app/
cider status
```

Note: trailing slashes are handled automatically — both work.

## Typical Workflow

```bash
# 1. Connect and authenticate (once per session)
export CIDER_API_URL=https://2bc6-50-171-72-195.ngrok-free.app/
cider google login
cider status   # verify "Connected"

# 2. Create a sandbox
CIDER_API_URL=https://2bc6-50-171-72-195.ngrok-free.app/ cider create
# Returns: sbx-a1b2c3d4

# 3. Boot simulator
cider sbx-a1b2c3d4 --emulator ios

# 4. Build an app with AI
cider sbx-a1b2c3d4 --google
> Build a todo list app for iPhone

# 5. Clean up when done
cider stop sbx-a1b2c3d4
```

## Sandbox API (Direct Access)

If you need finer control than the CLI provides, you can call the sandbox API directly. All endpoints are scoped by sandbox ID.

```bash
# Run a command inside the sandbox
curl -X POST $CIDER_API_URL/sandboxes/<ID>/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "xcodebuild -version"}'

# Write a file
curl -X POST $CIDER_API_URL/sandboxes/<ID>/files/write \
  -H "Content-Type: application/json" \
  -d '{"path": "MyApp/ContentView.swift", "content": "import SwiftUI..."}'

# Read a file
curl -X POST $CIDER_API_URL/sandboxes/<ID>/files/read \
  -H "Content-Type: application/json" \
  -d '{"path": "MyApp/ContentView.swift"}'

# List files
curl -X POST $CIDER_API_URL/sandboxes/<ID>/files/list \
  -H "Content-Type: application/json" \
  -d '{"path": ".", "recursive": true}'

# Boot simulator
curl -X POST $CIDER_API_URL/sandboxes/<ID>/simulator/boot \
  -H "Content-Type: application/json" \
  -d '{}'

# Create Xcode project from template
curl -X POST $CIDER_API_URL/sandboxes/<ID>/project/create \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp"}'

# Take simulator screenshot
curl $CIDER_API_URL/sandboxes/<ID>/screenshot --output screenshot.png

# Get sandbox system info
curl $CIDER_API_URL/sandboxes/<ID>/status
```

## Building iOS Apps — What You Need to Know

- Use `create_xcode_project` (or `POST /project/create`) first to get a SwiftUI template project
- Only modify `.swift` files. Never edit `.pbxproj` files.
- Build with: `xcodebuild -project <Name>.xcodeproj -scheme <Name> -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16' build`
- If the build fails, read the errors carefully, fix the Swift code, and rebuild
- After a successful build, install and launch:
  - `xcrun simctl install booted <path-to-.app>`
  - `xcrun simctl launch booted <bundle-identifier>`
- Take a screenshot to verify: `GET /sandboxes/<ID>/screenshot`
