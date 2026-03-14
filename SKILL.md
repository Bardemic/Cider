# Cider CLI — Tool Reference for AI Agents

You have access to the Cider CLI, which lets you create and manage macOS sandboxes for building iOS apps. Each sandbox is an isolated macOS VM with Xcode pre-installed.

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

## Environment

- `CIDER_API_URL` — URL of the Cider host server (e.g., `http://100.96.42.40:8000`). Must be set before using any commands.

## Typical Workflow

```bash
# 1. Set up (once)
export CIDER_API_URL=http://<host-ip>:8000
cider google login

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
curl -X POST http://$CIDER_API_URL/sandboxes/<ID>/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "xcodebuild -version"}'

# Write a file
curl -X POST http://$CIDER_API_URL/sandboxes/<ID>/files/write \
  -H "Content-Type: application/json" \
  -d '{"path": "MyApp/ContentView.swift", "content": "import SwiftUI..."}'

# Read a file
curl -X POST http://$CIDER_API_URL/sandboxes/<ID>/files/read \
  -H "Content-Type: application/json" \
  -d '{"path": "MyApp/ContentView.swift"}'

# List files
curl -X POST http://$CIDER_API_URL/sandboxes/<ID>/files/list \
  -H "Content-Type: application/json" \
  -d '{"path": ".", "recursive": true}'

# Boot simulator
curl -X POST http://$CIDER_API_URL/sandboxes/<ID>/simulator/boot \
  -H "Content-Type: application/json" \
  -d '{}'

# Create Xcode project from template
curl -X POST http://$CIDER_API_URL/sandboxes/<ID>/project/create \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp"}'

# Take simulator screenshot
curl http://$CIDER_API_URL/sandboxes/<ID>/screenshot --output screenshot.png

# Get sandbox system info
curl http://$CIDER_API_URL/sandboxes/<ID>/status
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
