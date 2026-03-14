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

## Demo Plan

**Setup:** Two machines — a Windows laptop (client) and a MacBook (host). Connected via Tailscale.

**Pre-demo prep on MacBook:**
1. Tart base image `cider-base` is pre-configured with macOS, Xcode 16, and the Cider sandbox server (auto-starts on boot via launchd)
2. Host server is running: `uvicorn main:app --host 0.0.0.0 --port 8000`
3. Tailscale is connected

**Demo script:**

1. **Show the problem** — open Xcode on the Mac, show how complex it is. "This is what you need to build an iPhone app. A $1,300 machine, a 40GB IDE, and years of experience. What if you could skip all of that?"

2. **From the Windows laptop:**
   ```bash
   cider google login           # authenticate with Gemini
   cider create                 # spins up a fresh macOS VM with Xcode
   ```
   *The audience sees a Tart VM clone and boot in real-time. This is the core demo moment — a Windows machine just provisioned a macOS development environment.*

3. **Build an app with AI:**
   ```bash
   cider sbx-abc123 --emulator ios    # boot iPhone simulator
   cider sbx-abc123 --google          # start Gemini agent

   > Build a simple counter app for iPhone
   ```
   *The agent creates an Xcode project, writes Swift code, runs xcodebuild, fixes errors, and installs the app in the simulator — all from the Windows terminal.*

4. **Show the result** — screenshot of the app running in the iOS Simulator, triggered from a Windows machine that has never had Xcode installed.

5. **Cleanup:**
   ```bash
   cider stop sbx-abc123        # deletes the VM
   ```

**What's real vs. hardcoded:**
- Real: Tart VM provisioning, xcodebuild compilation, Simulator screenshot, Gemini tool calls, Tailscale networking, build-error-fix loop
- Hardcoded: No auth (planned via better-auth), one host Mac, one simulator device (iPhone 16), template-based project creation

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
