# Build Prompt: Compliance-First GovCon Decision Support System with Integrated Opportunity Intelligence

## System Identity

You are building a **Compliance-First GovCon Decision Support System with Integrated Opportunity Intelligence** — not a CRM, not a crawler, not a simple lead generator. This distinction drives every architectural, legal, and pricing decision.

---

## Tech Stack

| Layer        | Technology   | Rationale                                      |
|--------------|--------------|-------------------------------------------------|
| Backend      | Node.js + Express | Flexible, strong scheduling libraries, wide ecosystem |
| Database     | PostgreSQL   | Strong compliance posture, relational integrity, audit-friendly |
| Frontend     | React        | Modular, component-driven, user-friendly        |
| Scheduling   | node-cron / cloud functions (AWS Lambda or Azure Functions) | Periodic batch API pulls |
| Auth         | Role-based (RBAC) | Multi-role access control                   |

---

## Architecture: Three-Layer Core

### Layer 1 — Compliance Engine

**Purpose:** Define what is compliant, track progress, and enforce gates.

#### Compliance Gate Engine (Hard-Stop Logic)
- Implement **mandatory compliance checkpoints** that are non-bypassable blockers.
- Support **contract-specific gate sets** configurable per opportunity.
- Example gates:
  - No pricing review completed → proposal submission is **locked**.
  - Missing reps & certs → win probability is **capped**.
  - Late document upload → penalty is **auto-applied**.
- Gates must be stored as structured rules (separate logic from data) so thresholds can be changed without code changes.

#### Compliance Rules Module
- Define rules as reusable, DRY functions.
- Rules are parameterized by industry vertical (HVAC, restaurants, etc.) and subcategory (cuisine type, service specialization).
- Each rule has:
  - `ruleId`, `name`, `description`
  - `applicableVerticals[]`
  - `gateType` (blocker | warning | informational)
  - `threshold` (configurable)
  - `penaltyOnViolation` (optional)

#### Compliance Reputation Score (Client-Level, Rolling)
- Not contract-specific — this is a **per-client rolling metric**.
- Factors:
  - Timeliness of submissions
  - Responsiveness to requests
  - Document quality scores
  - Missed deadlines count
  - Prior penalties received
- This score:
  - Influences future win probability calculations.
  - Unlocks incentive tiers (discounts, bonuses).
  - Justifies subscription pricing tiers.
- Store historical snapshots for trend analysis.

#### Incentive & Penalty System
- Users who consistently meet deadlines unlock incentives (discounts, bonuses).
- Missed deadlines trigger escalating responses: reminders → soft penalties → escalating fees.
- All rules are configurable and automated.
- Log every incentive/penalty action for audit trail.

---

### Layer 2 — Lead Assessment & Opportunity Intelligence

**Purpose:** Fetch, enrich, score, and present leads based on compliance readiness and client fit.

#### Data Sourcing & Source Authority
- Classify every data source:
  - **Authoritative:** SAM.gov, federal agency sites
  - **Semi-authoritative:** State portals, prime contractor databases
  - **Non-authoritative:** Web scraping, news, business registries
- Assign a **confidence weight** per source.
- Maintain a full **audit trail** for where each data point originated.

#### Ethical & FAR-Aligned Guardrails (System-Enforced)
- **No scraping of restricted portals** — enforce at the crawler level, not just policy.
- **No misrepresentation risk** — flag and block data that could imply insider access.
- **No insider-only data blending** — keep data provenance clean and auditable.
- These must be system-enforced controls, not policy documents.

#### Scheduled Data Enrichment Pipeline
- Use cron jobs (or cloud functions) to run batch API pulls on a configurable schedule (weekly/monthly).
- On each run:
  1. Fetch new/updated data from external sources.
  2. Validate and classify by source authority.
  3. Enrich lead records with compliance-relevant attributes.
  4. Store results in PostgreSQL — all day-to-day queries hit local DB only.
- No live external API calls during normal operation.

#### Lead Enrichment Attributes
Each lead must be enriched with data tied to client decision-making:
- Past contract performance ratings
- Credentialing status
- Industry-specific ratings
- NAICS code overlap with client capabilities
- Incumbent presence on target contracts
- Bid count density
- Compliance completeness percentage

#### Lead Scoring Engine
- Score leads based on enriched attributes weighted by client profile.
- Scoring parameters are **dynamically modified** by UI filters (industry vertical, subcategory, etc.).
- Each filter change recalculates scores in real time.
- Scores must be **explainable** (see Win Probability below).

#### Industry Vertical Tagging
- Tag every lead by vertical: HVAC, restaurants, construction, IT services, etc.
- Support subcategories: cuisine types, service specializations, clearance levels.
- UI provides dynamic filtering; each filter modifies scoring parameters.

---

### Layer 3 — Monitoring, Grading & Predictive Analytics

**Purpose:** Predictive analytics on contract win likelihood with full transparency.

#### Win Probability Model
- Calculate a win probability score per opportunity.
- **Explainability is mandatory.** When a client asks "Why is my probability 32%?", the system must show:
  - Contributing factors breakdown:
    - Past performance match (%)
    - NAICS overlap score
    - Incumbent presence (yes/no + strength)
    - Bid count density
    - Compliance completeness (%)
    - Compliance Reputation Score impact
  - Weight visibility (can be abstracted but must be inspectable).

#### Temporal Sensitivity & Decay
- Implement **score decay** as deadlines approach.
- Apply **penalty multipliers** for late tasks.
- Build **urgency escalation logic** — a contract due tomorrow is not treated the same as one due in 30 days.
- Decay curves should be configurable.

#### Amendment Impact Analysis
- Detect and diff contract amendments.
- Classify each amendment:
  - Administrative
  - Technical
  - Pricing
  - Scope expansion / contraction
- Auto-generate a **"What changed and why it matters"** summary.
- Trigger win probability recalculation on amendment detection.

#### Post-Award Intelligence Loop
- Detect award announcements.
- Ingest debrief data when available.
- Tag loss reasons (price, technical, past performance, compliance gap, etc.).
- Feed outcomes back into the scoring model — this is how the system gets smarter.
- Generate client ROI reports from this data.

---

## Traceability Pipeline

Maintain full lineage across the lifecycle:

```
Lead Source → Matched Opportunity → Proposal Instance → Outcome (Win/Loss)
```

This feeds:
- Model improvement (post-award loop)
- Client ROI reports
- Subscription justification metrics

---

## Role-Based Access Control (RBAC)

Implement four distinct roles, each with different dashboards, permissions, and liability boundaries:

| Role                  | Dashboard Focus              | Key Permissions                        |
|-----------------------|------------------------------|----------------------------------------|
| **Client (Bidder)**   | My opportunities, scores, deadlines | View own data, submit documents, track progress |
| **Consultant (Partner)** | Client portfolio, compliance status | View assigned clients, advise, flag issues |
| **Internal Reviewer** | Compliance audit, gate status | Review submissions, approve/reject gates |
| **Admin / Compliance Officer** | System-wide analytics, config | Full access, configure rules/thresholds, manage users |

---

## Legal & Risk Disclaimers (Dynamic)

- Generate **contract-specific disclaimers** (not static boilerplate).
- Raise **risk flags** when:
  - Client ignores system guidance.
  - Client submits non-compliant material.
  - A compliance gate is overridden (if override is allowed at tier).
- Log **acknowledged disclaimers** with timestamps.
- This protects consulting partners legally.

---

## Timelines & Accountability

- Every lead and compliance step has attached deadlines.
- Real-time progress tracking with alerts for pending actions.
- Visual progress indicators in the UI (clear, intuitive).
- Escalation chains for approaching/missed deadlines.

---

## Subscription Tiers

| Tier       | Features                                                                 |
|------------|--------------------------------------------------------------------------|
| **Basic**  | Essential lead scoring, compliance tracking, basic filters               |
| **Mid**    | Advanced filters, deeper reporting, basic incentive system               |
| **Premium**| Full predictive analytics, custom compliance rules, incentive/penalty system, amendment analysis, post-award intelligence |

Pricing should be value-aligned and refined before client presentation.

---

## Data Model Guidelines

### Key Entities
- `leads` — raw lead records with source provenance
- `opportunities` — matched, enriched opportunities
- `proposals` — proposal instances linked to opportunities
- `outcomes` — win/loss records with reason tagging
- `compliance_rules` — configurable rule definitions
- `compliance_gates` — gate instances per opportunity
- `compliance_events` — audit log of all compliance actions
- `client_reputation_scores` — rolling client compliance scores
- `amendments` — detected amendments with diffs and classifications
- `users` — with role assignments (RBAC)
- `disclaimers` — dynamic disclaimer records with acknowledgment logs
- `incentives_penalties` — configurable reward/penalty rules and event log
- `data_sources` — source registry with authority classification and confidence weights

### Database Principles
- All tables include `created_at`, `updated_at`, `created_by` audit columns.
- Soft deletes only (never hard delete compliance-relevant data).
- Foreign keys enforce referential integrity across the traceability pipeline.
- Index on frequently filtered columns (vertical, NAICS, deadline, status).

---

## Development Principles

1. **DRY** — Reusable functions for scoring and compliance rules. No duplication.
2. **Separation of logic and data** — Thresholds, weights, and rules live in config/database, not hardcoded.
3. **Modular architecture** — Each module has a clear purpose and documented data flow.
4. **Recreatable environments** — Version all config, document all flows, so any team member can replicate the environment.
5. **Well-documented** — Every module documents its purpose, inputs, outputs, and data flow.
6. **Pragmatic iteration** — Build one logical step at a time. Start with MVP, refine.

---

## MVP Scope (Phase 1)

Build a minimal working pipeline that does not collapse under GovCon scrutiny:

1. **Define 5–10 key compliance rules** with gate logic (at least 2 hard blockers).
2. **Ingest mock lead data** with source classification and confidence weights.
3. **Implement basic lead scoring** with explainable factor breakdown.
4. **Build a scoring dashboard** (React) showing:
   - Lead list with scores
   - Score breakdown on click (explainability)
   - Compliance status per lead
   - Deadline tracking with visual indicators
5. **Implement one scheduled data sync** (cron job) that fetches from a mock API and stores locally.
6. **Basic RBAC** — at minimum Client and Admin roles with different views.
7. **Audit trail** — log every compliance event and data source.

### MVP File Structure

```
/
├── server/
│   ├── index.js                    # Express server entry point
│   ├── config/
│   │   ├── database.js             # PostgreSQL connection config
│   │   ├── compliance-rules.json   # Configurable compliance rules
│   │   └── scoring-weights.json    # Configurable scoring weights
│   ├── routes/
│   │   ├── leads.js                # Lead CRUD and scoring endpoints
│   │   ├── compliance.js           # Compliance gate and rule endpoints
│   │   ├── analytics.js            # Win probability and reporting endpoints
│   │   └── auth.js                 # Authentication and RBAC endpoints
│   ├── models/
│   │   ├── Lead.js
│   │   ├── Opportunity.js
│   │   ├── ComplianceRule.js
│   │   ├── ComplianceGate.js
│   │   ├── ComplianceEvent.js
│   │   ├── User.js
│   │   └── DataSource.js
│   ├── services/
│   │   ├── scoring.js              # Lead scoring logic (DRY, reusable)
│   │   ├── compliance-engine.js    # Gate evaluation, rule checking
│   │   ├── enrichment.js           # Data enrichment pipeline
│   │   ├── win-probability.js      # Predictive model with explainability
│   │   ├── temporal-decay.js       # Deadline-based score decay
│   │   └── reputation.js           # Client compliance reputation scoring
│   ├── jobs/
│   │   └── data-sync.js            # Scheduled API fetch (cron)
│   └── middleware/
│       ├── rbac.js                 # Role-based access control
│       └── audit.js                # Audit trail logging
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx       # Main scoring dashboard
│   │   │   ├── LeadList.jsx        # Filterable lead list
│   │   │   ├── ScoreBreakdown.jsx  # Explainable score details
│   │   │   ├── ComplianceStatus.jsx# Gate and compliance tracker
│   │   │   ├── DeadlineTracker.jsx # Timeline and deadline view
│   │   │   └── FilterPanel.jsx     # Industry vertical / subcategory filters
│   │   ├── services/
│   │   │   └── api.js              # API client
│   │   └── context/
│   │       └── AuthContext.jsx     # RBAC context provider
│   └── public/
│       └── index.html
├── migrations/                     # PostgreSQL schema migrations
├── seeds/                          # Mock/seed data for MVP
├── package.json
└── README.md
```

---

## Post-MVP Roadmap

After MVP is validated:

1. **Amendment impact analysis** — diff engine and auto-summaries.
2. **Post-award intelligence loop** — award detection, debrief ingestion, loss tagging.
3. **Full incentive/penalty automation** — escalation chains, configurable per tier.
4. **Advanced temporal decay** — configurable decay curves per contract type.
5. **Consultant role dashboard** — portfolio view, cross-client analytics.
6. **Dynamic disclaimers** — contract-specific, with acknowledged logging.
7. **Subscription tier enforcement** — feature gating by plan level.
8. **Full traceability reporting** — lead → opportunity → proposal → outcome lineage.

---

## Key Differentiators to Preserve

These are the defensible moats — do not shortcut them:

1. **Compliance Gate Engine** — hard-stop logic that separates this from a CRM.
2. **Explainable Win Probability** — transparent scoring builds trust.
3. **Compliance Reputation Score** — client-level rolling metric, unique in market.
4. **Source Authority & Provenance** — audit-defensible data sourcing.
5. **Amendment Impact Analysis** — extremely valuable, extremely rare.
6. **Post-Award Feedback Loop** — the system gets smarter over time.
7. **FAR-Aligned Guardrails** — system-enforced, not just policy.

---

## Instructions to the Builder

Build this system following these priorities:

1. **Compliance correctness first** — every feature must respect the gate engine.
2. **Explainability second** — no black-box scores. Everything is inspectable.
3. **Auditability third** — log everything. Compliance data is never hard-deleted.
4. **User experience fourth** — intuitive UI, clear progress indicators, responsive filters.
5. **Performance fifth** — local DB queries for speed, batch syncs for freshness.

Start with the MVP scope. Get the compliance engine and scoring pipeline working with mock data. Then layer on enrichment, analytics, and advanced features iteratively.
