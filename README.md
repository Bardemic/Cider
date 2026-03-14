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

## Team

*[To be filled in]*

## License

MIT
