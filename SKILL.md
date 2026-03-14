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
cider create
cider create --repo "https://github.com/user/repo.git"
```
Returns a sandbox ID (e.g., `sbx-a1b2c3d4`). The sandbox is a fresh macOS VM with Xcode ready to use. If `--repo` is provided, the repo is cloned into the sandbox.

### List sandboxes
```bash
cider list
```
Shows all active sandboxes with their ID, status, and IP.

### Boot iOS Simulator
```bash
cider <ID> --emulator ios
```
Boots an iPhone 16 simulator inside the sandbox. Required before you can build and run iOS apps.

### Start Gemini agent session
```bash
cider <ID> --google
```
Opens an interactive prompt where you describe what to build. The Gemini agent writes Swift code, compiles with `xcodebuild`, fixes errors, and runs the app in the simulator — all autonomously.

### Check status
```bash
cider status
```
Shows whether the host server is reachable and how many sandboxes are running.

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

## Connecting to the Host

The Cider CLI needs to reach a Cider host server running on a Mac. Set the `CIDER_API_URL` environment variable before using any commands.

### Connecting

The Cider host server is exposed via ngrok:

```bash
export CIDER_API_URL=https://2bc6-50-171-72-195.ngrok-free.app
cider status   # verify "Connected"
```

## Typical Workflow

```bash
# 1. Connect and authenticate (once per session)
export CIDER_API_URL=https://2bc6-50-171-72-195.ngrok-free.app
cider google login
cider status   # verify "Connected"

# 2. Create a sandbox
cider create
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
