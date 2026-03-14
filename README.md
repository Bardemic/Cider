# Cider

**Brew iOS apps in the cloud.**

macOS sandboxes as a service — for AI agents, for developers, for anyone. Build, compile, and test iOS apps from any machine. No Mac required.

```bash
cider google login
cider create --repo "https://github.com/you/your-app.git"
cider sbx-a1b2c3 --emulator ios
cider sbx-a1b2c3 --google
# You're building an iPhone app. From a Windows laptop. With AI.
```

---

## The Problem

AI just mass-produced keys to a locked building.

GitHub Copilot has 20M users. Cursor hit $1.2B ARR in 16 months. 84% of developers now use AI coding tools. The *skill* barrier to building software is collapsing — developers complete tasks 55% faster, AI generates 46% of their code, and PR cycle times have dropped 75%.

**The result: app development is exploding.** Monthly new iOS app launches have grown 7x since January 2022, from ~2,000/month to 14,700/month by January 2026. The steepest acceleration starts in early 2025, directly tracking the rise of AI-assisted coding.

But here's the thing nobody talks about:

**Every single one of those apps required a Mac to build.**

Xcode is macOS-only. There is no official way to compile and submit an iOS app without Apple hardware. A developer using Cursor on a $300 Windows laptop can write a complete iOS app in an afternoon — and then hit a wall. To compile it, test it, and ship it, they need a $600+ Mac Mini or a $1,099+ MacBook Air, plus a $99/year Apple Developer Program membership.

This is the hardest platform lock-in in mainstream software development, and it's gating access to a **$1.3 trillion ecosystem** with 36 million registered developers and 1.8 billion active devices.

The math:
- **47.2 million** developers worldwide
- Only **33%** use macOS professionally (Stack Overflow 2024)
- That's **~31 million developers** locked out of the most valuable app ecosystem on the planet

AI lowered the drawbridge. The moat is now the hardware.

---

## The Value Equation

People pay in proportion to:

```
            Dream Outcome  ×  Perceived Likelihood
Value  =  ——————————————————————————————————————————
              Time Delay   ×   Effort & Sacrifice
```

### Dream Outcome: Maximum

Ship an iOS app to the App Store. Reach 1.8 billion Apple devices. Participate in a $1.3 trillion economy. For indie developers, freelancers, students, and developers in emerging markets — this is a career-defining unlock.

### Perceived Likelihood: Dramatically Higher

This isn't "learn Swift and maybe figure it out." An AI agent builds the app *for you*. You describe what you want in a terminal prompt. Gemini writes the Swift, runs `xcodebuild`, reads the errors, fixes them, and keeps going until it compiles. The build-error-fix loop — the part that stops most beginners — is handled autonomously.

### Time Delay: Near Zero

No hardware to buy. No Xcode to download (40GB). No environment to configure. No Apple Developer account to wait 48 hours for approval.

`cider create`. Type a prompt. The agent builds. Minutes, not days.

### Effort & Sacrifice: Minimal

- No Mac purchase ($600-$1,300+)
- No macOS learning curve
- No Xcode learning curve
- No Swift learning curve
- No provisioning profile hell
- No "which simulator do I pick"
- No disk space management (Xcode eats 40GB+)

You bring a terminal and an idea. Cider handles the rest.

**The result: value goes to infinity.** Massive dream outcome, high likelihood of success, near-zero delay, near-zero effort. This is why the product works.

---

## What a Cider Sandbox Is

A Cider sandbox is a complete, isolated macOS development environment — spun up on demand, used through a CLI, and destroyed when you're done. No remote desktop. No VM management. No macOS knowledge required.

**What's inside each sandbox:**
- macOS with Xcode 16 (Swift compiler, Interface Builder, full iOS SDK)
- iOS Simulator (iPhone 16) for running and testing apps
- The `xcodebuild` toolchain for compiling SwiftUI projects
- `xcrun simctl` for simulator management (boot, install, launch, screenshot)
- A SwiftUI project template ready to build on

**What you don't deal with:**
- No Apple ID sign-in
- No Xcode download (40GB+)
- No provisioning profiles or code signing
- No simulator configuration
- No disk space management
- No "which macOS version do I need"

Each sandbox is a Tart VM cloned from a pre-configured base image. When you run `cider create`, Cider clones the image, boots the VM, waits for it to be ready, and gives you a sandbox ID. Every command you run after that — writing files, compiling code, booting the simulator, taking screenshots — executes inside that isolated VM. When you're done, `cider stop` deletes it completely.

### The pain points Cider eliminates

| Without Cider | With Cider |
|---|---|
| Buy a Mac ($600-$1,300+) | `cider create` (free, instant) |
| Download Xcode (40GB, 30+ min) | Already installed in the sandbox |
| Learn Swift and SwiftUI | Gemini agent writes the code for you |
| Learn xcodebuild CLI or Xcode IDE | Agent runs build commands autonomously |
| Debug cryptic compiler errors | Agent reads errors, fixes code, rebuilds |
| Figure out simulator setup | `cider <ID> --emulator ios` — one command |
| Manage provisioning profiles | Not needed for simulator builds |
| Deal with macOS updates breaking Xcode | Sandbox image is pinned and tested |
| Xcode eats 40GB+ of your disk | Runs on remote Mac, not your machine |
| "It works on my machine" environment issues | Every sandbox is identical |

### Who this is for

**Developers without a Mac.** 31 million developers worldwide use Windows or Linux professionally. They can write iOS code with AI tools, but can't compile it. Cider gives them the missing piece.

**AI coding agents.** Cursor, Claude Code, Copilot, and custom agents can write entire iOS apps — but they need somewhere to build and test them. Cider's sandbox API is the compilation backend for any AI agent that wants to ship to the App Store.

**Students and bootcamps.** Learning iOS development shouldn't require a $1,300 laptop. Cider lets anyone with a browser and a terminal build their first iPhone app.

**Freelancers and agencies.** Need to spin up an iOS build environment for a client project? `cider create --repo <url>`. Done in 60 seconds. No hardware procurement, no IT tickets.

**Hackathon teams.** One teammate has a Mac, the rest don't. Cider turns that one Mac into a shared build server everyone can use from their own laptops.

---

## How It Works

Cider has two interfaces: a **CLI** (the primary product) and a **web dashboard** (the companion). The CLI is what developers and AI agents use. The dashboard is what you look at.

### The CLI — the product

The CLI is a single Go binary. It manages sandbox lifecycle, authenticates with Gemini, boots simulators, and drops you into an agent session where you describe what to build and the AI does it.

```
cider create                         Create a new macOS sandbox (Tart VM)
cider create --repo <url>            Create sandbox with repo cloned
cider list                           List your sandboxes
cider status                         Check host server connection
cider login                          Open dashboard login in browser
cider google login                   Authenticate with Gemini API key
cider <ID> --emulator ios            Boot iOS simulator in sandbox
cider <ID> --google                  Start Gemini agent session
cider stop <ID>                      Stop and delete a sandbox
```

**This is the interface that matters for agents.** An AI coding agent (Cursor, Claude Code, Copilot Workspace, or any custom agent) can call `cider create`, get a sandbox ID, and use the sandbox API to compile and test iOS code. The CLI is the programmatic entry point to Apple's build toolchain — without needing a Mac.

#### Agent flow

```
Agent calls: cider create --repo "https://github.com/..."
  → Tart VM clones from base image, boots, returns sandbox ID

Agent calls sandbox API directly:
  POST /sandboxes/{id}/files/write   → write Swift files
  POST /sandboxes/{id}/exec          → xcodebuild, xcrun simctl install/launch
  GET  /sandboxes/{id}/screenshot    → capture simulator screen
  POST /sandboxes/{id}/exec          → read build errors, iterate

Agent ships the app. User never touches Xcode.
```

#### Human flow

```bash
$ cider google login
  Enter your Gemini API key: ****
  ✓ API key saved

$ cider create
  ⠋ Cloning base image...
  ⠋ Booting VM...
  ⠋ Waiting for sandbox server...
  ✓ Sandbox ready
  ID:           sbx-k8m2q1
  macOS:        15.2
  Xcode:        Xcode 16.2
  VM:           cider-sbx-k8m2q1

$ cider sbx-k8m2q1 --emulator ios
  ✓ iPhone 16 booted

$ cider sbx-k8m2q1 --google

  🍺 Cider
  Brew iOS apps in the cloud

  Type your prompt. The agent will build your iOS app.

  > Build a tip calculator with 15%, 18%, 20%, and 25% options

  ⚡ create_xcode_project TipCalc
  ✓ done
  ⚡ create_file TipCalc/TipCalc/ContentView.swift
  ✓ done
  ⚡ execute_command $ xcodebuild -project TipCalc.xcodeproj ...
  ✓ done
  ⚡ get_screenshot
  ✓ done

  ✓ Agent finished

$ cider stop sbx-k8m2q1
  ✓ Sandbox stopped and deleted
```

### The Dashboard — the companion

The web dashboard is a Next.js app that gives you a visual window into what the agent is doing. It's complementary — you don't *need* it to build apps, but it makes the experience tangible. It also serves as the login flow for CLI authentication (via better-auth, planned).

| Panel | What It Shows |
|---|---|
| **Chat** | Prompt input + agent responses |
| **Build Log** | Streaming `xcodebuild` output — errors red, success green |
| **Agent Activity** | Timeline of every tool call with status |
| **Simulator** | Live screenshot of the app in an iPhone frame |

### The Sandbox API

The **host server** runs on the Mac and manages sandbox lifecycle + proxies requests into VMs. Each sandbox is a Tart VM running its own FastAPI server.

#### Sandbox management (host server)

| Endpoint | Purpose |
|---|---|
| `POST /sandboxes` | Create sandbox — clone base image, boot VM, return ID |
| `GET /sandboxes` | List all sandboxes |
| `GET /sandboxes/{id}` | Get sandbox details (status, IP, VM name) |
| `DELETE /sandboxes/{id}` | Stop VM, delete VM, remove from DB |

#### Per-sandbox operations (proxied to VM)

| Endpoint | Purpose |
|---|---|
| `POST /sandboxes/{id}/exec` | Run shell command inside VM |
| `POST /sandboxes/{id}/files/write` | Create or overwrite a file |
| `POST /sandboxes/{id}/files/read` | Read file contents |
| `POST /sandboxes/{id}/files/list` | List directory contents |
| `POST /sandboxes/{id}/files/mkdir` | Create directories |
| `GET /sandboxes/{id}/screenshot` | Capture iOS Simulator screen (PNG) |
| `POST /sandboxes/{id}/simulator/boot` | Boot a simulator device |
| `POST /sandboxes/{id}/project/create` | Copy Xcode template, rename, return path |
| `GET /sandboxes/{id}/status` | macOS version, Xcode version, simulators |

### The 7 Agent Tools

The Gemini agent has 7 tools, each mapped to a sandbox-scoped API call:

| Tool | Maps To |
|---|---|
| `create_xcode_project(name)` | `POST /sandboxes/{id}/project/create` |
| `create_file(path, content)` | `POST /sandboxes/{id}/files/write` |
| `read_file(path)` | `POST /sandboxes/{id}/files/read` |
| `list_files(path)` | `POST /sandboxes/{id}/files/list` |
| `execute_command(command)` | `POST /sandboxes/{id}/exec` |
| `get_screenshot()` | `GET /sandboxes/{id}/screenshot` |
| `get_sandbox_status()` | `GET /sandboxes/{id}/status` |

The agent loops up to 20 iterations: Gemini decides what to do, we execute the tool inside the VM, return the result, Gemini continues. Build fails? It reads the errors, fixes the code, rebuilds.

---

## Architecture

Each `cider create` clones a Tart VM from a pre-configured base image (macOS + Xcode + sandbox server). The host server manages VM lifecycle and proxies all requests to the correct VM by looking up its IP in SQLite.

```
┌──────────────────────────────────────────────────────────────┐
│  Any Machine (Windows, Linux, Mac)                           │
│                                                              │
│  ┌──────────────────────┐    ┌───────────────────────────┐  │
│  │  CLI (Go binary)     │    │  Dashboard (Next.js)      │  │
│  │                      │    │                           │  │
│  │  cider create        │    │  Visual companion for     │  │
│  │  cider <ID> --google │    │  watching agent activity  │  │
│  │  cider list          │    │  + login flow for auth    │  │
│  │  cider stop <ID>     │    │                           │  │
│  └──────────┬───────────┘    └─────────────┬─────────────┘  │
│             └──────────┬───────────────────┘                │
│                        │  HTTP                              │
└────────────────────────┼────────────────────────────────────┘
                         │  Tailscale (peer-to-peer)
┌────────────────────────┼────────────────────────────────────┐
│  Mac Host              │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Host Server — FastAPI (port 8000)                   │  │
│  │                                                      │  │
│  │  POST /sandboxes          → tart clone + tart run    │  │
│  │  DELETE /sandboxes/{id}   → tart stop + tart delete  │  │
│  │  POST /sandboxes/{id}/*   → proxy to VM IP           │  │
│  │                                                      │  │
│  │  SQLite: users, sandboxes (id, vm_name, ip, status)  │  │
│  └───────────────┬──────────────────┬───────────────────┘  │
│                  │                  │                       │
│       ┌──────────▼──────┐  ┌───────▼────────────┐         │
│       │  Tart VM #1     │  │  Tart VM #2        │  ...    │
│       │  cider-sbx-abc  │  │  cider-sbx-xyz     │         │
│       │                 │  │                    │         │
│       │  FastAPI :8000  │  │  FastAPI :8000     │         │
│       │  Xcode 16       │  │  Xcode 16          │         │
│       │  iOS Simulator  │  │  iOS Simulator     │         │
│       └─────────────────┘  └────────────────────┘         │
│                                                            │
│  Tart base image: cider-base (macOS + Xcode + server)      │
└────────────────────────────────────────────────────────────┘
```

---

## Demo Guide

### Equipment

| Machine | Role | Requirements |
|---|---|---|
| Windows laptop | Client — runs CLI + dashboard | Go, Node.js, Tailscale |
| MacBook | Host — runs Tart VMs | Tart, Python 3.11+, Tailscale, base image ready |

### Pre-Demo Setup

Three things need to happen: **(A)** Tart base image prepared, **(B)** Mac host server running, **(C)** Windows CLI ready. A only needs to happen once. B and C happen before the demo.

---

#### A. Prepare the Tart Base Image (one-time, ~30 min)

This is the golden image every sandbox clones from. It needs macOS + Xcode + the Cider sandbox server auto-starting on boot. **Your teammate does this on the MacBook.**

**If they already have a Tart VM with Xcode**, skip to step 4.

```bash
# 1. Install Tart if not already installed
brew install cirruslabs/cli/tart

# 2. Pull a macOS base image (or use an existing one)
tart clone ghcr.io/cirruslabs/macos-sequoia-xcode:latest cider-base
# This is a ~30GB download. If they already have a VM with Xcode, clone from that instead:
#   tart clone <existing-vm-name> cider-base

# 3. Boot the base image to configure it
tart run cider-base
# This opens a macOS VM window. Log in and do the following inside the VM:
```

**Inside the VM (GUI or SSH — see step 3a for SSH):**

```bash
# 3a. (Optional) Enable SSH for easier setup
#     In the VM's System Settings → General → Sharing → turn on "Remote Login"
#     Then from the Mac host: ssh admin@$(tart ip cider-base)

# 4. Verify Xcode works
xcodebuild -version
# Should print "Xcode 16.x" — if not, install Xcode from the App Store or xcode-select

# 5. Accept Xcode license (required for xcodebuild to work)
sudo xcodebuild -license accept

# 6. Install Python (for the sandbox server)
#    If python3 isn't available:
xcode-select --install          # gives you python3 via CommandLineTools
#    Or: brew install python    # if homebrew is available in the VM

# 7. Copy the Cider sandbox server into the VM
#    From the Mac HOST (not inside the VM), run:
#    scp -r server/ admin@$(tart ip cider-base):~/cider-server/
#
#    Or, inside the VM, clone the repo:
git clone https://github.com/Bardemic/Cider.git ~/cider-repo
cp -r ~/cider-repo/server ~/cider-server

# 8. Install Python dependencies inside the VM
cd ~/cider-server
pip3 install -r requirements.txt

# 9. Test that the server starts
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
curl http://localhost:8000/status
# Should return JSON with macos_version, xcode info, etc.
# Kill the test server: kill %1

# 10. Set up the sandbox server to auto-start on boot
#     Create a LaunchAgent plist:
mkdir -p ~/Library/LaunchAgents

cat > ~/Library/LaunchAgents/com.cider.sandbox.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cider.sandbox</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>-m</string>
        <string>uvicorn</string>
        <string>main:app</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>8000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/admin/cider-server</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/cider-sandbox.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/cider-sandbox.err</string>
</dict>
</plist>
PLIST

# Load it now to verify
launchctl load ~/Library/LaunchAgents/com.cider.sandbox.plist
sleep 3
curl http://localhost:8000/status
# Should work. If not, check /tmp/cider-sandbox.err

# 11. Create the Xcode template project
mkdir -p ~/CiderTemplate
# Open Xcode (inside the VM):
#   File → New → Project → iOS → App
#   Product Name: CiderTemplate
#   Interface: SwiftUI
#   Language: Swift
#   Save to: ~/CiderTemplate
#
# Or from command line if you have a template ready:
#   The template just needs to be a valid SwiftUI project at ~/CiderTemplate/

# 12. Shut down the VM cleanly (this saves the state into the image)
sudo shutdown -h now
```

**Back on the Mac host:**

```bash
# 13. Verify the base image is ready
tart list
# Should show "cider-base"

# 14. Test a full clone-boot-verify cycle
tart clone cider-base cider-test
tart run cider-test --no-graphics &
sleep 45

# Get the VM's IP
tart ip cider-test
# Should print something like 192.168.64.X

# Verify the sandbox server auto-started
curl http://$(tart ip cider-test):8000/status
# Should return JSON with xcode info

# Verify xcodebuild works
curl -X POST http://$(tart ip cider-test):8000/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "xcodebuild -version"}'
# Should return Xcode version in stdout

# Clean up
tart stop cider-test && tart delete cider-test
```

**If step 14 works, the base image is ready. This never needs to be done again.**

---

#### B. Mac Host — Start Before Demo (~2 min)

```bash
# 1. Start the host server
cd server
pip install -r requirements.txt   # skip if already done
uvicorn main:app --host 0.0.0.0 --port 8000

# 2. Verify it's running
curl http://localhost:8000/sandboxes
# Should return [] (empty list)

# 3. Note your Tailscale IP (give this to the Windows laptop)
tailscale ip -4
```

#### C. Windows Client — Start Before Demo (~3 min)

```bash
# 1. Build the CLI (skip if already built)
cd cli
go build -o cider.exe .

# 2. Set the host URL
export CIDER_API_URL=http://<mac-tailscale-ip>:8000

# 3. Verify connectivity to the Mac
./cider.exe status
# Should show "Connected — 0 sandbox(es)"

# 4. Save Gemini API key (skip if already saved)
./cider.exe google login

# 5. IMPORTANT: Pre-create a fallback sandbox
./cider.exe create
# Note the ID. Leave it running. If live `cider create` is slow during
# the demo, use this one instead. You can always say "we already have
# a sandbox ready" and skip straight to --emulator / --google.
```

#### Pre-Demo Verification Checklist

Run through this right before presenting. Every line should pass.

| Check | Command (Windows) | Expected |
|---|---|---|
| CLI built | `./cider.exe version` | `cider v0.2.0` |
| Host reachable | `./cider.exe status` | "Connected" |
| Gemini configured | `./cider.exe status` | Shows "Gemini: configured" |
| Fallback sandbox running | `./cider.exe list` | Shows 1 sandbox, status "running" |
| Sandbox responds | `./cider.exe <fallback-ID> --emulator ios` | "iPhone 16 booted" or "already running" |

### Demo Script (5-7 minutes)

**Before going on stage:**
- Mac host server is already running (`uvicorn main:app --host 0.0.0.0 --port 8000`)
- Windows laptop has CLI built, `CIDER_API_URL` set, Gemini key saved
- Terminal is open on the Windows laptop, font size large enough for audience
- Optional: dashboard open in a browser tab at `localhost:3000`

**Talking points and commands:**

#### 1. The Problem (30 sec, no commands)

"The Apple app economy is worth $1.3 trillion. 36 million developers. But to build an iOS app, you need a Mac — a $600 minimum, often $1,300+. AI tools like Copilot and Cursor have made it so anyone can *write* an app. But you still can't *build* it without Apple hardware. 31 million developers are locked out. We built Cider to fix that."

#### 2. Spin Up a Sandbox (60 sec)

```bash
cider create
```

**While it's cloning/booting (~30-60 sec), narrate:**

"Cider just cloned a macOS virtual machine with Xcode pre-installed on our Mac host. This Windows laptop has never had Xcode on it. It doesn't need to. The sandbox is a full macOS environment — Xcode, iOS Simulator, Swift compiler — all running in an isolated VM."

**When it prints "Sandbox ready":**

"We have a sandbox. Let's boot the iPhone simulator."

```bash
cider <ID> --emulator ios
```

#### 3. Build an App with Gemini (2-3 min)

```bash
cider <ID> --google
```

At the prompt:
```
> Build a simple counter app for iPhone. Large number in the center, plus and minus buttons, and a reset button. Clean modern design.
```

**While the agent works, narrate the tool calls as they appear:**

- "It's creating an Xcode project from our template..."
- "Now it's writing the SwiftUI code — ContentView.swift..."
- "Running xcodebuild — this is the real Xcode compiler running on the Mac..."
- If errors: "Build failed — but watch, the agent reads the error, fixes the code, and rebuilds automatically." (This is actually a *good* demo moment.)
- "Build succeeded. It's installing the app in the simulator..."
- "And taking a screenshot."

#### 4. The Result (30 sec)

"A counter app, built and running in an iOS Simulator. Written by Gemini, compiled by Xcode, on a Mac that this Windows laptop provisioned through a CLI. The developer never opened Xcode. Never wrote Swift. Never bought a Mac."

If dashboard is open, switch to browser tab to show the 4-panel view.

#### 5. Cleanup (15 sec)

```bash
cider stop <ID>
```

"The VM is gone. Clean. If we run `cider create` again, we get a fresh sandbox in under a minute."

#### 6. Close (30 sec)

"AI collapsed the skill barrier to building apps. Cider collapses the hardware barrier. What's left is just the idea. That's Cider — brew iOS apps in the cloud."

### Fallback Plans

| Problem | Fallback |
|---|---|
| `cider create` is slow (>90 sec) | Pre-create a sandbox before the demo. Start from `cider list` showing it already running. |
| Gemini agent fails or loops | Have a pre-tested prompt ready (counter app is most reliable). If it still fails, show a pre-built app: "Here's one we built earlier" — run `cider <ID> --google` with "Add a dark mode toggle to the app" to show the agent modifying existing code instead of building from scratch. |
| Tailscale won't connect | Hotspot both machines to the same phone. Or run everything on the Mac itself (CLI works locally too). |
| VM won't boot | Show the host server + API directly via curl. "The infrastructure works — here's the API creating a sandbox, here's xcodebuild running inside it." |
| xcodebuild fails repeatedly | The base image Xcode may need a re-sign. Pre-test the exact build command the night before. If it fails during demo, show the error-fix loop as a feature: "The agent is debugging in real-time." |
| Total disaster | Play the backup video. Record one the night before: screen-record the full `create → build → screenshot` flow. |

### Reliable Prompts (pre-tested, ordered by reliability)

1. **Counter app** (most reliable): "Build a simple counter app for iPhone. Large number in the center, plus and minus buttons, and a reset button."
2. **Hello world variant**: "Build a SwiftUI app that shows 'Hello Cider' in large blue text centered on screen."
3. **Tip calculator**: "Build a tip calculator. Text field for bill amount, segmented control for 15/18/20/25 percent, show tip and total."
4. **Color grid**: "Build an app with a 3-column grid of colorful squares. Tap a square to show its hex code at the top."

### Timing Estimates

| Step | Expected Time |
|---|---|
| `cider create` (clone + boot + server ready) | 30-90 sec |
| `cider <ID> --emulator ios` | 5-10 sec |
| Agent builds a simple app (first attempt) | 60-120 sec |
| Agent fixes a build error and rebuilds | 30-60 sec |
| Full demo from `create` to screenshot | 3-5 min |

### What's Real vs. Hardcoded

**Real (must work live):**
- Tart VM provisioning (`tart clone` + `tart run`)
- `xcodebuild` compilation inside the VM
- iOS Simulator screenshot
- Gemini function-calling agent loop
- Tailscale networking between machines
- Build-error → fix → rebuild loop

**Hardcoded (fine for hackathon):**
- No authentication (planned via better-auth)
- One host Mac (no multi-host orchestration)
- One simulator device (iPhone 16)
- Template-based Xcode project creation
- No sandbox expiration / auto-cleanup

---

## MVP Scope

### Must have (demo-blocking)
- Tart VM lifecycle: clone base image, boot, get IP, stop, delete
- SQLite tracking: sandboxes table with ID, VM name, IP, status
- Host server: sandbox CRUD + proxy to VMs
- CLI: `create`, `list`, `stop`, `<ID> --emulator ios`, `<ID> --google`
- Gemini agent working through sandbox-scoped API

### Have (not demo-blocking)
- Users table in SQLite (schema only — auth comes later via better-auth on web)
- Dashboard (already built, connects to same API)
- `cider create --repo <url>` (clone repo into sandbox)

### Not building yet
- Authentication (better-auth on web side, CLI login flow)
- Multi-host (multiple Macs serving sandboxes)
- Sandbox expiration / auto-cleanup
- WebSocket proxying (CLI uses REST for now)

---

## Quick Start

### 1. Mac host (Tart + host server)

```bash
# Prerequisites: Tart installed, base image "cider-base" configured
# Base image must have: macOS, Xcode 16, Cider sandbox server auto-starting on port 8000

cd server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Any machine (CLI)

```bash
cd cli
go build -o cider .

# Authenticate with Gemini
./cider google login

# Point to the Mac host (Tailscale IP)
export CIDER_API_URL=http://<tailscale-ip>:8000

# Create a sandbox, boot simulator, start building
./cider create
./cider <ID> --emulator ios
./cider <ID> --google
```

### 3. Optional: Dashboard

```bash
cd client
echo 'SANDBOX_URL=http://<tailscale-ip>:8000' > .env.local
echo 'GEMINI_API_KEY=<your-key>' >> .env.local
npm install && npm run dev
```

---

## Why Sandboxes, Why Now

Sandboxes have become the defining infrastructure pattern of AI-era development. Since early 2025, every major AI coding tool has converged on the same insight: **agents need isolated environments to execute code, not just generate it.**

- **Anthropic** launched Claude Code with built-in sandboxed execution — the agent writes code and runs it in an isolated container to verify it works before presenting it to the user.
- **OpenAI** shipped Codex with cloud sandboxes — each task runs in a microVM with full filesystem and network access.
- **E2B** raised $44M specifically to build "sandboxes for AI agents" — isolated cloud environments where agents can execute arbitrary code safely.
- **Modal, Fly.io, and Firecracker** all saw surges in adoption as AI agents needed somewhere to run the code they generate.

The pattern is clear: AI can write code, but code that isn't executed is just a suggestion. Sandboxes turn suggestions into verified, running software.

**But there's a gap.** Every sandbox product today supports Linux containers. None of them support macOS. You can spin up a sandbox to build a Python API or a React app in seconds — but if you want to build an iOS app, you're stuck. Xcode requires macOS. macOS requires Apple hardware. Apple hardware requires a $600+ purchase.

Cider fills the macOS-shaped hole in the sandbox ecosystem. Same pattern — isolated environment, API-driven, agent-friendly — but for the one platform that every other sandbox product can't touch.

---

## Scaling Beyond Peer-to-Peer

The current MVP is peer-to-peer: one Mac host, one CLI client, connected via ngrok or Tailscale. This is fine for a demo and for small teams. Here's how Cider would scale to a real multi-tenant service.

### Phase 1: Dedicated Mac Infrastructure

Replace the single MacBook with dedicated Mac hardware in a data center.

| Component | MVP (now) | Scale |
|---|---|---|
| Hardware | One teammate's MacBook | Mac Minis in a colo (e.g., MacStadium, AWS EC2 Mac) |
| Networking | Ngrok tunnel / Tailscale | Direct public IP with TLS termination |
| VMs per host | 2-3 (limited by MacBook RAM) | 8-16 per Mac Mini (64GB M4 Pro) |
| VM manager | Single Tart process | Orchestrator assigning VMs across a pool of Mac hosts |

**Why Mac Minis:** $599 base, Apple Silicon, runs Tart natively. A rack of 10 Mac Minis at a colo costs ~$500/month and serves 80-160 concurrent sandboxes.

### Phase 2: Multi-Host Orchestration

The host server becomes a control plane that manages a fleet of Macs.

```
                         ┌─────────────────────┐
                         │  Control Plane API   │
                         │  (any cloud)         │
                         │                      │
                         │  - User auth         │
                         │  - Sandbox scheduler │
                         │  - Billing / quotas  │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
             ┌──────▼──────┐ ┌─────▼───────┐ ┌─────▼───────┐
             │  Mac Host 1 │ │  Mac Host 2 │ │  Mac Host N │
             │  8 Tart VMs │ │  8 Tart VMs │ │  8 Tart VMs │
             └─────────────┘ └─────────────┘ └─────────────┘
```

**Scheduler logic:** When `cider create` is called, the control plane picks the Mac host with the most available capacity, provisions a VM there, and returns the sandbox ID. The proxy layer routes all subsequent requests to the correct host.

### Phase 3: Production Features

| Feature | Implementation |
|---|---|
| **Auth** | better-auth on the web dashboard, OAuth tokens for CLI, API keys for agents |
| **Billing** | Per-minute sandbox usage. Free tier: 30 min/month. Pro: $20/month for 10 hours. |
| **Sandbox expiration** | Auto-stop after 30 min idle. Auto-delete after 24 hours. Configurable per plan. |
| **Persistent storage** | Mount a persistent volume for project files that survives sandbox restarts |
| **Custom base images** | Users upload their own Xcode projects, dependencies, and configs as a custom base image |
| **App Store submission** | Integrate code signing and `xcrun altool` for direct App Store uploads from the sandbox |
| **CI/CD integration** | GitHub Actions / GitLab CI runner that provisions a Cider sandbox for iOS builds |
| **Multi-platform** | Extend beyond iOS: macOS apps, watchOS, visionOS — all require Xcode |

### Phase 4: The Platform Play

At scale, Cider becomes the default build backend for every AI coding agent that wants to target Apple platforms.

```
Cursor / Claude Code / Copilot / Custom Agent
    │
    │  "Build an iOS app"
    │
    ▼
Cider API: POST /sandboxes → sandbox ready in 30s
    │
    │  write files, xcodebuild, simctl, screenshot
    │
    ▼
App compiled, tested, and ready to submit
```

The moat: **Apple hardware is a physical constraint.** You can't virtualize macOS on Linux (legally). You can't run Xcode in a container. Every iOS build in the world requires Apple silicon. Cider aggregates that hardware and exposes it as an API.

---

## The Bigger Picture

Cloud Mac services already exist (MacStadium, MacinCloud, AWS EC2 Mac). Their entire business model validates the premise: developers need Mac access but don't own Macs.

But those services sell raw VMs. You still need to know Xcode, Swift, provisioning profiles, simulator management, and the full iOS toolchain. They're infrastructure for DevOps teams, not products for developers.

Cider is the layer above. The CLI is the product. The Mac is invisible infrastructure. You don't SSH into a Mac or remote-desktop into Xcode — you run `cider create` and talk to an AI agent that happens to have a Mac behind it.

**For agents**, the sandbox API is a tool. Cursor, Claude Code, or any custom agent can call it programmatically to compile and test iOS code as part of a larger workflow.

**For humans**, the CLI + dashboard makes the whole thing feel like magic. You type what you want, watch it build, and see the app running on a simulated iPhone.

**AI collapsed the skill barrier. Cider collapses the hardware barrier. What's left is just the idea.**

---

## Tech Stack

| Component | Technology |
|---|---|
| CLI | Go (single binary, zero dependencies) |
| Host server | Python, FastAPI, uvicorn, SQLite, httpx |
| VM management | Tart (macOS virtualization) |
| Sandbox server | Python, FastAPI (runs inside each VM) |
| Dashboard | Next.js 16, React 19, Tailwind CSS 4 |
| AI agent | Gemini 2.5 Pro (function calling) |
| Networking | Tailscale (peer-to-peer WireGuard) |
| iOS toolchain | Xcode 16, xcrun simctl, xcodebuild |

---

*Built for the Google DeepMind Hackathon 2025 in Chicago.*
