# Chicago DeepMind Hackathon

## Project Idea 1: Home Base Chicago

**Your AI-powered housing guide — built for everyday Chicagoans.**

Legal aid and a housing counselor in your pocket, free, for every Chicagoan.

---

### The Problem

Chicago has a housing crisis, but the people most affected by it — renters, first-time buyers, people facing eviction, families looking for assistance — are the least equipped to navigate the system. The information exists, but it's buried in:

- Dense legal text (Chicago's RLTO is 30+ pages of legalese)
- Government websites with broken links and outdated PDFs
- Program applications that require you to already know the program exists
- 3-hour zoning meetings where decisions are made without community awareness
- Phone lines that go to voicemail

**The result:** People don't know their rights. They don't know what help is available. They don't know what's being built on their block. And the housing crisis gets worse because everyday people are shut out of the process.

---

### The Vision

A simple, conversational tool where any Chicagoan can ask housing questions in plain language and get **actually useful, Chicago-specific, personalized answers** — not generic articles, not phone trees, not "consult a lawyer."

This is a grassroots tool. It's not for developers or investors. It's for:

- The renter whose landlord won't fix the heat
- The single mom trying to find an apartment she can afford
- The family behind on rent who doesn't know help exists
- The first-generation homebuyer who doesn't know where to start
- The longtime homeowner who doesn't know they qualify for property tax relief
- The neighbor who just wants to know what that construction project on their block is

---

### Core Features

#### 1. "Just Ask" — Conversational Housing Help

A chat interface where people describe their situation in plain language and get clear, actionable, Chicago-specific guidance.

**Example conversations:**

- *"I make $45K and I'm looking for a 2BR on the north side — what should I expect to pay and what help is out there?"*
- *"My landlord hasn't fixed my heat in 2 weeks. What can I do?"*
- *"I got an eviction notice. What are my rights? How much time do I have?"*
- *"How do I apply for Section 8 in Chicago?"*
- *"I want to buy a house but I only have $5,000 saved. Is that enough?"*
- *"My rent went up 20% — is that legal?"*

The AI is grounded in **real Chicago law and programs** via RAG — not generic national advice. It cites sources so people can verify. It gives next steps, not just information.

#### 2. Program Finder — "What Do I Qualify For?"

A simple screener (4-5 questions) that matches people to programs they likely qualify for. Asks:

- Are you renting or looking to buy?
- Household size?
- Approximate household income?
- What neighborhood/area?
- What's your situation? (looking for housing, struggling to pay, facing eviction, want to buy, need repairs)

**Output for each matched program:**
- What it is (one sentence, plain language)
- Whether you likely qualify (based on your answers)
- How much help / what it covers
- **Direct link to apply** — not a homepage, the actual application
- Phone number / walk-in location if applicable
- Current status (open, waitlisted, closed)

**Programs in scope:**

| Category | Programs |
|---|---|
| Rental assistance | Emergency Rental Assistance (ERA), IDHS Homeless Prevention, Chicago ERAP |
| Public housing | CHA Housing Choice Vouchers (Section 8), CHA public housing, Project-based vouchers |
| First-time buyer | IHDA first-time buyer programs, Chicago HomeBuyer Assistance, CDFI down payment programs |
| Property tax relief | Homeowner Exemption, Senior Exemption, Senior Freeze, Longtime Occupant Exemption, Assessment appeals |
| Utility help | LIHEAP, CEDA utility assistance, Peoples Gas/ComEd hardship programs |
| Tenant legal help | Metropolitan Tenants Organization, LAF (Legal Aid Foundation), CARPLS hotline |
| Home repair | IHDA home repair programs, Chicago bungalow grants, weatherization assistance |

#### 3. Know Your Rights — Tenant & Homeowner Rights Engine

People describe their situation conversationally, and the AI explains their specific rights under Chicago law with concrete next steps.

**Key areas covered:**

- **Eviction process:** Chicago requires written notice, has specific timelines by eviction type, tenants can cure. The AI walks through exact deadlines and defenses.
- **Security deposits:** Chicago requires interest payments, specific accounts, written receipts. Violations entitle tenants to 2x the deposit. Most landlords violate this.
- **Repair obligations:** Tenants can withhold rent, repair-and-deduct, or break the lease for code violations after proper notice. AI generates the notice letter.
- **Rent increases:** Chicago has no rent control, but increases require proper notice (30/60 days depending on lease terms). AI explains what's required.
- **Lockouts & retaliation:** Both are illegal. AI explains remedies and who to call.
- **Lead paint & bed bugs:** Specific Chicago ordinances with landlord obligations. AI explains what's required and how to file 311 complaints.

**What makes this different from a web search:**
- It's *interactive* — it knows your specific situation, not a generic FAQ
- It gives *next steps*, not just information ("Here's the template letter to send your landlord. Send it certified mail. Here's the nearest post office.")
- It connects to *real resources* — phone numbers, walk-in clinics, legal aid intake lines
- It's in *plain language* — no legal jargon

#### 4. My Neighborhood — What's Happening on My Block

Enter an address or neighborhood and see a plain-English feed of housing activity nearby:

- **New construction & permits:** "A 12-unit building was permitted at 1234 N. Western last month"
- **Zoning changes:** "A rezoning request for your block is scheduled for committee on April 3rd"
- **311 activity:** building complaints, code violations, vacant building reports
- **Rent trends:** median rents in your community area, how they've changed
- **Recent sales & assessments:** what homes are selling for nearby

All sourced from public City of Chicago data, translated by AI into something a normal person would actually read.

**The grassroots angle:** People can't advocate for their neighborhoods if they don't know what's happening. This turns public data into community awareness.

---

### Everyday People Scenarios

These are the real situations this tool is built for:

#### Scenario 1: Maria — Behind on Rent
Maria lost her job and is 2 months behind on rent. She's scared of eviction and doesn't know what to do.
- **Chat:** "I'm 2 months behind on rent and I'm scared I'm going to get evicted. What do I do?"
- **Response:** Explains that her landlord must give written notice before filing, she has time to cure, and connects her to Emergency Rental Assistance (with the direct application link), IDHS Homeless Prevention, and the LAF eviction defense hotline.

#### Scenario 2: James — First-Time Buyer
James makes $55K and has $8,000 saved. He wants to buy but thinks he can't afford it.
- **Screener:** Identifies he qualifies for IHDA first-time buyer programs (up to $10K down payment assistance), Chicago's HomeBuyer Assistance program, and FHA loans with 3.5% down.
- **Chat:** Walks him through the process step-by-step, explains what a housing counselor does (required for some programs), and links him to HUD-approved counseling agencies in his area.

#### Scenario 3: Diane — Landlord Won't Fix Heat
Diane's heat has been broken for 3 weeks in January. Her landlord won't respond.
- **Rights engine:** Explains her rights under RLTO and Chicago's heat ordinance (68F minimum Oct-May). Gives her three options: (1) Call 311 to report, (2) Send a 14-day notice and withhold rent, (3) Repair and deduct. Generates the notice letter for her. Gives her the Metropolitan Tenants Organization hotline.

#### Scenario 4: Robert — Property Taxes Crushing Him
Robert is 72, been in his Chatham home for 30 years, and his property taxes keep going up.
- **Screener:** Identifies he likely qualifies for the Senior Exemption, Senior Freeze, AND the Longtime Occupant Exemption — could save him $2,000+/year. Links directly to the Cook County Assessor's application forms.

#### Scenario 5: Neighborhood Group — What's Being Built?
A Logan Square community group wants to know what development is planned in their area.
- **Neighborhood feed:** Shows recent permit applications, any pending zoning changes, and recent 311 building complaints. The group can now show up to the right meetings with the right information.

---

### Data Sources & Knowledge Base

All data is public and free:

#### Legal & Policy Documents (for RAG)
- Chicago Residential Landlord Tenant Ordinance (RLTO)
- Chicago Municipal Code — building/housing sections
- Illinois Landlord-Tenant Act
- CHA program guides and eligibility criteria
- IHDA program guides (first-time buyer, home repair, rental assistance)
- Cook County property tax exemption guides
- HUD fair housing guidelines

#### City of Chicago Data Portal (APIs)
- Building permits (issued and applied)
- Zoning district boundaries (shapefiles)
- 311 service requests (building complaints, vacant buildings)
- Affordable housing locations
- Business licenses (for landlord lookup)

#### Other Public Data
- Cook County Assessor (property info, assessed values, exemptions)
- ACS / Census (income, rent burden by community area)
- HUD Fair Market Rents
- Zillow/Redfin rental estimates (for market context)

---

### Tech Stack (Google / DeepMind Ecosystem)

| Layer | Tech | Why |
|---|---|---|
| AI Model | **Gemini API** (Google DeepMind) | Long context window, multimodal, strong at nuanced Q&A — core of the hackathon |
| RAG / Search | **Vertex AI Search** or **Gemini grounding with Google Search** | Ground responses in real Chicago documents and live web results |
| Embeddings | **Vertex AI Embeddings** (text-embedding-005) | Embed Chicago housing documents for semantic retrieval |
| Vector Store | **AlloyDB AI** or **Firestore** with vector search | Store and query document embeddings, program directory |
| Frontend | **Flutter Web** or **Next.js on Firebase Hosting** | Cross-platform (web + mobile), Firebase integration |
| Backend | **Firebase Cloud Functions** (gen2) | Serverless, easy Gemini SDK integration, scales to zero |
| Database | **Firestore** | Program listings, user saved searches, neighborhood data cache |
| Maps | **Google Maps Platform** (Maps JS API) | Neighborhood view, permit locations, address autocomplete with Places API |
| Geocoding | **Google Maps Geocoding API** | Address → lat/lng → neighborhood/ward lookup |
| Hosting | **Firebase Hosting** | Free tier, CDN, easy deploys |
| Auth | **Firebase Auth** (optional) | Google sign-in for saving results, anonymous for no-friction access |
| Analytics | **Google Analytics / Firebase Analytics** | Track which programs people search for, common questions — useful for advocacy data |
| Translation | **Google Cloud Translation API** | Spanish language support (40% of Chicago's housing-insecure population is Spanish-speaking) |
| OCR (stretch) | **Google Document AI** | Let users photograph lease agreements or eviction notices and extract key info |

#### Key Google AI Features to Showcase

- **Gemini Function Calling**: The chat can call structured tools — look up an address, check program eligibility, pull permit data — all orchestrated by Gemini as tool calls
- **Gemini Grounding with Google Search**: For questions about current programs or recent policy changes, ground responses in live search results so information stays current
- **Vertex AI RAG**: Chicago legal documents (RLTO, municipal code) chunked and embedded for accurate retrieval — the AI cites its sources
- **Multimodal Input (stretch)**: Users photograph an eviction notice or lease → Gemini vision extracts the key details and explains what it means
- **Google Maps Integration**: Address autocomplete → instant neighborhood context, nearby permits, housing activity overlay

---

### Hackathon Scope (24-48 hours)

#### Must Have (MVP)
- [ ] Chat interface powered by **Gemini API** with streaming responses
- [ ] **Vertex AI RAG** knowledge base with 10-15 key documents (RLTO, top assistance programs, tenant rights summary, property tax exemptions)
- [ ] **Gemini Function Calling** to orchestrate program lookups and address-based queries
- [ ] Program finder screener (5 questions → matched programs with apply links)
- [ ] **Google Maps** address autocomplete + neighborhood context
- [ ] 3-5 polished example scenarios that demo well
- [ ] **Firebase** backend (Hosting + Cloud Functions + Firestore)

#### Nice to Have
- [ ] **Gemini Grounding with Google Search** for live program/policy info
- [ ] Neighborhood feed pulling live City of Chicago permit data on a **Google Maps** overlay
- [ ] Template letter generator for tenant notices
- [ ] **Google Cloud Translation** for Spanish language support
- [ ] **Gemini Vision** — photograph a lease or eviction notice, get it explained
- [ ] Save/share results with **Firebase Auth**

#### Out of Scope (Future)
- User accounts and case tracking
- Direct integration with city systems (311 filing, permit applications)
- SMS/text interface for people without smartphones
- Community organizing features (petitions, meeting coordination)
- Landlord ratings / reviews

---

### Why This Matters

Chicago doesn't just need more housing — it needs the people who live here to be empowered in the housing system. Right now:

- **60% of Chicago renters** don't know about the RLTO or their rights under it
- **Billions in assistance** goes unclaimed because people don't know it exists or can't navigate the applications
- **Property tax exemptions** worth thousands go unclaimed by seniors and longtime homeowners every year
- **Community opposition** to housing often comes from a lack of information, not genuine conflict

This tool doesn't build housing directly. It builds the **informed, empowered community** that makes more housing possible — by helping people find homes, keep homes, know their rights, access help, and understand what's happening in their neighborhoods.

---

---

## Project Idea 2: macOS Sandboxes as a Service for AI Coding Agents

**Cloud macOS environments purpose-built for AI agents developing Swift/iOS apps.**

Give every AI coding agent (Claude Code, Codex, Gemini CLI, Cursor) access to a Mac with Xcode — no hardware required.

---

### The Problem

AI coding agents are transforming software development, but they hit a wall with Apple platforms:

- **You need a Mac to build for Apple.** Swift compilation, Xcode projects, iOS Simulator, code signing — none of this works on Linux.
- **Cloud macOS is painful.** AWS EC2 Mac has a 24-hour minimum ($26+), MacStadium starts at $109/mo, and none of them are designed for AI agent workflows.
- **AI agent sandboxes don't support macOS.** E2B, Fly.io Sprites, Docker sandboxes — all Linux only. The best agent infrastructure in the world can't compile a Swift app.
- **Xcode 26.3 added MCP support** (agentic coding built-in), but it assumes you own a Mac. If you don't, you're locked out.

The result: AI agents can build Python, JavaScript, Rust, and Go apps in cloud sandboxes — but the entire Apple ecosystem (~28M developers) is excluded.

---

### What Exists Today

| Player | What They Do | Gap |
|---|---|---|
| **Daytona** ($24M Series A) | AI agent sandboxes, claims macOS support | macOS is secondary; not Xcode/Swift focused |
| **Cua** (YC-backed) | macOS VMs on Apple Silicon for AI agents | Focused on computer-use (screen control), not headless coding |
| **E2B / Fly.io Sprites** | Best-in-class agent sandboxes | Linux only |
| **AWS EC2 Mac** | Raw macOS VMs | $1.08/hr, 24hr min, no agent tooling, no MCP |
| **MacStadium / Tart** | macOS VM orchestration | Built for CI/CD pipelines, not interactive agent sessions |
| **Xcode 26.3 + MCP** | Native agentic coding in Xcode | Local only — requires owning a Mac |
| **ClodPod / SandVault** | Local macOS sandboxes for AI agents | Local only, not cloud |

**The gap: Nobody offers "API call → cloud macOS with Xcode → AI agent connects via MCP → build/test Swift → tear down" as a product.**

---

### The Steelman Case

#### Why This Could Be Massive

**1. Timing is perfect — Xcode 26.3 just created the demand.**
Apple shipped native MCP support in Xcode (Feb 2026), legitimizing AI agent coding for iOS/macOS. 20 built-in tools exposed via MCP: file creation, building, testing, preview snapshots, documentation search. Every AI coding agent can now plug into Xcode — *if they have access to a Mac.* This service would be the missing infrastructure layer.

**2. The 24-hour licensing constraint is actually a feature.**
Apple requires 24-hour minimum leases on Mac hardware. Instead of fighting this, lean into it: offer **persistent macOS dev environments** (not ephemeral). Your AI agent gets a Mac that's always warm, with your project loaded, dependencies cached, and Xcode ready. This is actually a better developer experience than ephemeral VMs — no cold starts, no re-downloading Xcode (12GB+) every time.

**3. AI agents are becoming the primary consumer of dev environments.**
The trajectory is clear: developers increasingly supervise agents rather than write code directly. The bottleneck shifts from "developer needs a machine" to "agent needs a machine." This is the CI/CD → agent-sandbox evolution. CI/CD for Mac is a proven market (Codemagic, Bitrise, CircleCI Mac) — agent sandboxes are the next iteration.

**4. Enterprise demand is real and underserved.**
Large companies adopting AI coding agents for their iOS teams face a hardware scaling problem: you can't spin up 50 Mac minis overnight for 50 agents. A cloud API solves this instantly. Enterprise mobile teams (banking, healthcare, retail — everyone has an iOS app) would pay premium prices for this.

**5. Education & accessibility.**
Millions of students and developers worldwide want to learn Swift / build iOS apps but can't afford a Mac ($1,299+). Cloud macOS sandboxes with AI assistance would democratize Apple platform development.

**6. Apple Silicon VMs are now technically viable.**
Apple's Virtualization.framework enables near-native performance (97% CPU speed per Cua's benchmarks). Tart/Orchard have proven you can orchestrate thousands of macOS VMs. The technical foundation exists — it just hasn't been productized for AI agents.

---

### TAM Analysis

#### Bottom-Up

| Segment | Size | Willingness to Pay | Annual Value |
|---|---|---|---|
| **iOS/macOS developers using AI agents** | ~5M of ~28M Apple devs (early adopters) | $50-200/mo | $3B-12B |
| **Enterprise mobile teams** (Fortune 500 iOS) | ~10,000 teams × 5-20 agent seats | $200-500/seat/mo | $120M-1.2B |
| **CI/CD migration** (existing Mac CI users) | ~500K developers on Codemagic/Bitrise/CircleCI Mac | $100-300/mo | $600M-1.8B |
| **Education** (CS students wanting iOS) | ~2M students globally | $10-30/mo | $240M-720M |
| **Indie / hobbyist (no Mac owners)** | ~3M developers | $20-50/mo | $720M-1.8B |

**Conservative TAM: $5B+ annually** in the cloud macOS + AI agent infrastructure market.

**Serviceable market (Year 1-2):** Enterprise mobile teams + power-user AI agent developers = ~$200M-500M.

#### Top-Down

- Cloud dev environments market: ~$15B by 2027 (Gartner)
- AI coding tools market: ~$12B by 2027
- macOS/iOS share of developer ecosystem: ~20-25%
- Overlap: $3-7B addressable

#### Comparable Valuations

- **Daytona** (AI agent sandboxes, Linux-focused): $24M Series A, early revenue
- **Cua** (macOS agent infra): YC-backed, pre-revenue
- **E2B** (Linux agent sandboxes): ~$10M raised
- **Replit** (cloud dev environments + AI): $1.16B valuation

---

### Use Cases

#### Primary: AI Agent Swift Development
An AI coding agent (Claude Code, Codex, Gemini CLI) receives a task: "Build me an iOS app that tracks my workouts." The agent:
1. Calls the API → gets a cloud Mac with Xcode
2. Connects via MCP (Xcode 26.3 native support)
3. Creates the project, writes Swift code, builds, runs tests
4. Returns the built .ipa or shares a Simulator preview
5. Environment persists for iteration

#### Secondary Use Cases

| Use Case | Description |
|---|---|
| **Enterprise fleet scaling** | Company has 200 iOS developers adopting Cursor/Claude Code. Instead of buying 200 Mac minis for agents, they use cloud Macs on-demand. |
| **Cross-platform agent workflows** | An agent building a full-stack app uses a Linux sandbox for the backend and a macOS sandbox for the iOS frontend — same API, same workflow. |
| **iOS CI/CD 2.0** | Replace traditional CI runners with agent-aware environments that can diagnose build failures, fix them, and retry — not just report red/green. |
| **App Store submission automation** | Agent handles code signing, provisioning profiles, App Store Connect upload, and metadata — the most hated part of iOS development. |
| **Swift education** | Student asks an AI tutor to "teach me SwiftUI." The tutor creates a project in a cloud Mac, makes changes, shows previews — all without the student owning a Mac. |
| **Open source iOS contributions** | A developer on Linux wants to contribute to an iOS open source project. Agent spins up a Mac sandbox, makes the change, runs tests, submits PR. |
| **Legacy app modernization** | Enterprise agent tasked with migrating an Objective-C app to Swift. Needs Xcode to incrementally build/test. Runs for days in a persistent sandbox. |

---

### The Case Against (Steelman)

#### 1. Apple Controls the Chokepoint — and They Might Just Do This Themselves
Apple shipped MCP support in Xcode 26.3. They're clearly watching the AI agent space. If cloud macOS sandboxes for agents become valuable, Apple could offer "Xcode Cloud for Agents" as a first-party service tomorrow. They already have Xcode Cloud (CI/CD), the hardware, the OS, and the developer relationships. You'd be building a business where your most existential competitor owns the operating system, the IDE, the hardware, and the licensing terms. Every Apple WWDC keynote is an extinction-level event for you.

#### 2. The Licensing Economics May Never Work
Apple's 24-hour minimum lease requirement isn't a technical constraint — it's a business decision Apple can change (or make worse) at any time. At ~$26/day minimum cost per environment, the unit economics are fundamentally different from Linux sandboxes (pennies per session). This means:
- You can't compete on price with E2B/Sprites for the 90% of agent tasks that don't need macOS
- Your margins are squeezed between Apple's hardware costs and what developers will pay
- Apple could tighten licensing terms at any time (they've done it before with Hackintosh, virtualization rules, etc.)

#### 3. The Market May Be Smaller Than It Looks
The TAM analysis assumes millions of developers want AI agents building Swift apps in the cloud. But:
- **Most iOS developers already own Macs** — that's a prerequisite for the job. The "developer who doesn't own a Mac but wants to build iOS apps" is a niche, not a market.
- **AI agents don't need persistent GUI environments for most coding tasks.** Claude Code and Codex work via terminal/file operations. You need macOS specifically for *compilation and testing*, which is a fraction of the agent's workflow. An agent could write Swift code on Linux and only use a Mac sandbox for build/test — reducing usage (and revenue) dramatically.
- **Cross-platform frameworks are eating native Swift.** Flutter, React Native, Kotlin Multiplatform, and now AI-generated cross-platform code reduce the share of developers who *must* use Xcode. The trend line is moving away from platform-specific tooling.

#### 4. Daytona and Cua Are Already Here
Daytona has $24M, claims macOS support, and is purpose-built for AI agent sandboxes. Cua is YC-backed and macOS-native. If this market takes off, they have:
- 12-18 month head starts
- Existing infrastructure and customers
- Established relationships with cloud providers and Apple
- Engineering teams already solving the hard virtualization problems

You'd be entering a market where well-funded incumbents are already building the exact product. The "nobody does this yet" gap is closing fast.

#### 5. The Technical Moat Is Thin
The underlying tech is commoditized or open source:
- Apple's Virtualization.framework is free and public
- Tart/Orchard (open source) already orchestrate macOS VMs at scale
- Xcode's MCP support is a standard protocol — no proprietary integration needed
- Any cloud provider with Mac hardware can replicate the stack

There's no proprietary model, no unique dataset, no network effect. The value is in operational excellence (uptime, boot speed, developer experience) — which is important but not defensible against bigger players with more capital.

#### 6. AI Agents Might Not Need Full macOS Environments
The assumption is that agents need a full macOS environment with Xcode. But:
- **Swift compiles on Linux** (Swift is open source and cross-platform). You can compile, test, and run Swift packages on Linux today. Only UIKit/SwiftUI apps strictly require macOS.
- **AI agents could generate Xcode projects and push to a lightweight CI** for build/test, rather than needing a persistent interactive macOS environment.
- **Apple's vision may be local-first.** Xcode 26.3's MCP support is designed for local Mac use. Apple may actively resist cloud Xcode environments to protect hardware sales — their business model depends on developers buying Macs.

#### 7. The "Education" Angle Is Overstated
"Students can't afford Macs" sounds compelling, but:
- Most CS programs have Mac labs or loaner programs
- Students learning Swift are typically already in the Apple ecosystem
- The serious alternative for budget-conscious students is to learn web/mobile dev with cross-platform tools, not to pay $50/mo for a cloud Mac
- Apple already offers steep education discounts and the Swift Playgrounds app on iPad ($349)

---

### Hackathon Fit Assessment

#### Arguments For
- Technically impressive if you can demo it
- Clear market gap with real demand
- Could use Gemini CLI as the AI agent in the demo
- Infra products win hackathons when the demo is compelling

#### Arguments Against
- **Google/DeepMind fit is weak** — this is fundamentally an Apple ecosystem product. Hard to showcase Gemini as the star vs. just a consumer of the infra.
- **Requires real Mac hardware** — can't fake a macOS sandbox. You'd need to bring/provision actual Macs and demo live VM orchestration.
- **Infrastructure-heavy** — 48 hours is tight for VM orchestration + API + agent integration + demo polish.
- **Demo risk** — live infra demos are fragile. If the VM takes 30 seconds to boot during the demo, the energy dies.
- **Audience mismatch** — hackathon judges may not viscerally relate to "AI agent needs a Mac" the way they would to a consumer-facing product.

#### Verdict
**Strong startup idea. Weak hackathon project** — unless you pre-provision the infra and focus the hackathon time on the agent experience layer. Even then, the Google/DeepMind angle is a stretch.

---

## Team

*[To be filled in]*

## License

MIT
