# Cider

**Brew iOS apps in the cloud.**

macOS sandboxes as a service for AI coding agents. Any developer, on any machine, can build iOS apps with AI. No Mac required.

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

Using the [Hormozi value framework](https://www.acquisition.com/offers) — people pay in proportion to:

```
            Dream Outcome  ×  Perceived Likelihood
Value  =  ——————————————————————————————————————————
              Time Delay   ×   Effort & Sacrifice
```

### Dream Outcome: Maximum

Ship an iOS app to the App Store. Reach 1.8 billion Apple devices. Participate in a $1.3 trillion economy. For indie developers, freelancers, students, and developers in emerging markets — this is a career-defining unlock.

### Perceived Likelihood: Dramatically Higher

This isn't "learn Swift and maybe figure it out." An AI agent builds the app *for you*. You describe what you want. Gemini writes the Swift, runs `xcodebuild`, reads the errors, fixes them, and keeps going until it compiles. The build-error-fix loop — the part that stops most beginners — is handled autonomously.

You watch the agent work in real-time: tool calls, build output, simulator screenshots. It's not a black box. You see every step, and you see the app running on a simulated iPhone.

### Time Delay: Near Zero

No hardware to buy. No Xcode to download (40GB). No environment to configure. No Apple Developer account to wait 48 hours for approval.

Type a prompt. Watch the agent build. See the app running. Minutes, not days.

### Effort & Sacrifice: Minimal

- No Mac purchase ($600-$1,300+)
- No macOS learning curve
- No Xcode learning curve
- No Swift learning curve
- No provisioning profile hell
- No "which simulator do I pick"
- No disk space management (Xcode eats 40GB+)

You bring a browser and an idea. Cider handles the rest.

**The result: value goes to infinity.** Massive dream outcome, high likelihood of success, near-zero delay, near-zero effort. This is why the product works.

---

## What Cider Does

A Gemini-powered AI agent on your machine sends commands to a remote Mac over Tailscale. The Mac has Xcode. The agent creates projects, writes Swift code, runs `xcodebuild`, reads errors, fixes them, installs the app in the Simulator, and captures screenshots — all autonomously.

You interact through a 4-panel dashboard:

| Panel | What It Shows |
|---|---|
| **Chat** | Describe the app you want, watch the agent respond |
| **Build Log** | Streaming `xcodebuild` output — errors in red, success in green |
| **Agent Activity** | Timeline of every tool call: file creates, commands, screenshots |
| **Simulator** | Screenshot of the app running on a simulated iPhone |

### The 7 Tools

The Gemini agent has 7 tools, each mapped to a sandbox API call:

| Tool | What It Does |
|---|---|
| `create_xcode_project(name)` | Copy SwiftUI template, rename, ready to build |
| `create_file(path, content)` | Write Swift files into the project |
| `read_file(path)` | Read existing code (to understand before modifying) |
| `list_files(path)` | Explore project structure |
| `execute_command(command)` | Run shell commands — `xcodebuild`, `xcrun simctl`, etc. |
| `get_screenshot()` | Capture the iOS Simulator screen |
| `get_sandbox_status()` | Check macOS version, Xcode version, booted simulators |

The agent loops up to 20 iterations: Gemini decides what to do, we execute the tool on the Mac, return the result, Gemini continues. Build fails? It reads the errors, fixes the code, rebuilds. This is the core demo loop.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Your Machine (any OS)                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Next.js Dashboard (localhost:3000)              │    │
│  │                                                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │    │
│  │  │   Chat   │  │  Build   │  │   Simulator   │  │    │
│  │  │Interface │  │   Log    │  │  Screenshot   │  │    │
│  │  └──────────┘  └──────────┘  └──────────────┘  │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │         Agent Activity Timeline          │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  └────────────────────┬────────────────────────────┘    │
│                       │ SSE                              │
│  ┌────────────────────▼────────────────────────────┐    │
│  │  API Route: Gemini 2.5 Pro Agent Loop           │    │
│  │  (function calling, 7 tools, max 20 iterations) │    │
│  └────────────────────┬────────────────────────────┘    │
│                       │                                  │
└───────────────────────┼──────────────────────────────────┘
                        │ Tailscale (peer-to-peer)
┌───────────────────────┼──────────────────────────────────┐
│  MacBook Sandbox      │                                  │
│                       ▼                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │  FastAPI Server (port 8000)                     │    │
│  │                                                  │    │
│  │  /exec          → shell commands                │    │
│  │  /files/*       → file I/O                      │    │
│  │  /project/create → Xcode template copy          │    │
│  │  /screenshot    → xcrun simctl io screenshot    │    │
│  │  /simulator/boot → xcrun simctl boot            │    │
│  │  /status        → system info                   │    │
│  │  /ws/exec       → streaming command output      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Xcode 16 + iOS Simulator + SwiftUI Template             │
└──────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. MacBook (sandbox server)

```bash
cd server
pip install -r requirements.txt

# Create the Xcode template project
mkdir -p ~/CiderTemplate
# (Open Xcode → New Project → iOS App → SwiftUI → name it "CiderTemplate" → save to ~/CiderTemplate)

# Boot a simulator
xcrun simctl boot "iPhone 16"
open -a Simulator

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Windows / Linux (client dashboard)

```bash
cd client

# Configure
echo 'SANDBOX_URL=http://<tailscale-ip>:8000' > .env.local
echo 'GEMINI_API_KEY=<your-key>' >> .env.local

# Install and run
npm install
npm run dev
```

### 3. Use it

Open `http://localhost:3000`. Check the green connection dot. Type:

> Build a simple counter app for iPhone with a large number display, plus and minus buttons, and a reset button.

Watch the agent work.

---

## The Bigger Picture

Cloud Mac services already exist (MacStadium, MacinCloud, AWS EC2 Mac). Their entire business model validates the premise: developers need Mac access but don't own Macs.

But those services sell raw VMs. You still need to know Xcode, Swift, provisioning profiles, simulator management, and the full iOS toolchain.

Cider is the layer above. The AI agent *is* the developer experience. The Mac is invisible infrastructure. You don't remote into a Mac — you talk to an agent that happens to have a Mac.

**AI collapsed the skill barrier. Cider collapses the hardware barrier. What's left is just the idea.**

---

## Tech Stack

| Component | Technology |
|---|---|
| Sandbox server | Python, FastAPI, uvicorn |
| Client dashboard | Next.js 16, React 19, Tailwind CSS 4 |
| AI agent | Gemini 2.5 Pro (function calling) |
| Networking | Tailscale (peer-to-peer WireGuard) |
| iOS toolchain | Xcode 16, xcrun simctl, xcodebuild |

---

*Built for the Google DeepMind Hackathon 2025 in Chicago.*
