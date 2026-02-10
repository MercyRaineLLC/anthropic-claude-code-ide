# Software Requirements Specification (SRS)

## Compliance-First GovCon Decision Support System with Integrated Opportunity Intelligence

| Field              | Value                                              |
|--------------------|----------------------------------------------------|
| **Document ID**    | SRS-GOVCON-DSS-001                                 |
| **Version**        | 1.0                                                |
| **Status**         | Draft                                              |
| **Classification** | Internal / Partner Distribution                    |
| **Prepared By**    | MercyRaineLLC                                      |
| **Date**           | 2026-02-10                                         |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Architecture](#3-system-architecture)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Data Requirements](#6-data-requirements)
7. [Interface Requirements](#7-interface-requirements)
8. [Security Requirements](#8-security-requirements)
9. [Compliance & Regulatory Requirements](#9-compliance--regulatory-requirements)
10. [Subscription Tier Requirements](#10-subscription-tier-requirements)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Glossary](#12-glossary)
13. [Appendices](#13-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements for the **Compliance-First GovCon Decision Support System with Integrated Opportunity Intelligence** (hereafter "the System"). This document serves as the authoritative reference for design, development, testing, and partner hand-off.

### 1.2 Scope

The System is a web-based platform that combines compliance-driven workflow management with data-enriched lead generation and predictive analytics, purpose-built for the Government Contracting (GovCon) market. It is **not** a CRM, a web crawler, or a generic lead generator. It is a **Compliance-First Decision Support System**.

The System will:
- Enforce compliance gates with hard-stop logic throughout the opportunity lifecycle.
- Source, classify, enrich, and score leads from authoritative GovCon data sources.
- Provide explainable win probability models with temporal sensitivity.
- Track full lineage from lead source through proposal outcome.
- Support multiple user roles with distinct dashboards and permissions.
- Offer tiered subscription access with feature gating.

### 1.3 Intended Audience

| Audience                  | Use of This Document                              |
|---------------------------|---------------------------------------------------|
| Development Team          | Primary build reference for all system components  |
| External Development Partners | Environment replication and module development |
| Product Stakeholders      | Requirements validation and sign-off               |
| QA / Testing Team         | Test case derivation and acceptance criteria        |
| Compliance Officers       | Verification of regulatory alignment               |

### 1.4 Definitions & Conventions

- **SHALL** — Mandatory requirement. Must be implemented.
- **SHOULD** — Strongly recommended. Omission requires documented justification.
- **MAY** — Optional. Included at the discretion of the development team.
- Requirements are tagged as `[REQ-XXX-NNN]` for traceability.

### 1.5 References

| Reference            | Description                                        |
|----------------------|----------------------------------------------------|
| BUILD_PROMPT.md      | System build prompt and architectural blueprint     |
| FAR (Federal Acquisition Regulation) | Compliance baseline for GovCon operations |
| SAM.gov              | Primary authoritative data source                   |
| NAICS Code Directory | Industry classification standard                    |

---

## 2. Overall Description

### 2.1 Product Perspective

The System operates as a standalone, self-hosted web application. It integrates with external GovCon data sources via scheduled batch synchronization (not real-time). Day-to-day operations are performed entirely against a local PostgreSQL database.

### 2.2 Product Functions (High Level)

| Function Area               | Description                                               |
|-----------------------------|-----------------------------------------------------------|
| Compliance Engine           | Rule definition, gate enforcement, reputation scoring      |
| Lead Assessment             | Data sourcing, enrichment, scoring, vertical filtering     |
| Predictive Analytics        | Win probability, temporal decay, amendment impact          |
| Post-Award Intelligence     | Award detection, debrief ingestion, model feedback loop    |
| Traceability Pipeline       | Lead → Opportunity → Proposal → Outcome lineage           |
| Role-Based Access           | Four-role RBAC with distinct dashboards                    |
| Incentive/Penalty Engine    | Automated rewards and escalating penalties                 |
| Subscription Management     | Three-tier access with feature gating                      |

### 2.3 User Classes

| Role                        | Description                                              |
|-----------------------------|----------------------------------------------------------|
| **Client (Bidder)**         | End user pursuing government contracts. Views own data, submits documents, tracks compliance progress and opportunity scores. |
| **Consultant (Partner)**    | External consulting partner advising clients. Views assigned client portfolios, flags compliance issues, provides guidance. |
| **Internal Reviewer**       | Staff member performing compliance audits. Reviews submissions, approves/rejects compliance gates, validates documents. |
| **Admin / Compliance Officer** | System administrator. Full access to configuration, user management, analytics, rule/threshold management. |

### 2.4 Operating Environment

| Component   | Specification                                       |
|-------------|-----------------------------------------------------|
| Backend     | Node.js (LTS) with Express framework                |
| Database    | PostgreSQL 15+                                       |
| Frontend    | React 18+ (SPA)                                      |
| Scheduling  | node-cron (self-hosted) or AWS Lambda / Azure Functions |
| Hosting     | Cloud-hosted (AWS, Azure, or equivalent)             |
| Browser     | Chrome, Firefox, Edge, Safari (latest 2 versions)    |

### 2.5 Constraints

- `[CON-001]` All data sourcing SHALL comply with FAR regulations. No restricted portal scraping.
- `[CON-002]` Compliance-relevant data SHALL never be hard-deleted. Soft deletes only.
- `[CON-003]` The system SHALL NOT make live external API calls during normal user operations. All external data is fetched via scheduled batch jobs.
- `[CON-004]` All scoring models SHALL be explainable. No black-box outputs.
- `[CON-005]` Architecture SHALL follow DRY principles with logic separated from data/configuration.

### 2.6 Assumptions & Dependencies

- External data sources (SAM.gov, agency portals) remain accessible via their published APIs.
- Clients provide accurate self-reported data (credentialing, past performance).
- Development partners have access to Node.js, PostgreSQL, and React toolchains.
- Mock data will be used for MVP; production data integrations follow in later phases.

---

## 3. System Architecture

### 3.1 Architectural Overview

The System follows a **three-layer modular architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                       │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────┐  │
│  │Dashboard │ │Lead List │ │Compliance │ │ Deadline Tracker  │  │
│  │          │ │+ Filters │ │  Status   │ │                  │  │
│  └──────────┘ └──────────┘ └───────────┘ └──────────────────┘  │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Score Breakdown  │  │         Filter Panel                │  │
│  │ (Explainability) │  │  (Vertical / Subcategory / NAICS)  │  │
│  └──────────────────┘  └─────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API
┌──────────────────────────────┴──────────────────────────────────┐
│                     SERVER (Node.js + Express)                   │
│                                                                  │
│  ┌─────────┐ ┌─────────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │  Auth   │ │  Compliance │ │  Leads   │ │   Analytics     │  │
│  │ Routes  │ │   Routes    │ │  Routes  │ │    Routes       │  │
│  └────┬────┘ └──────┬──────┘ └────┬─────┘ └───────┬─────────┘  │
│       │              │             │               │             │
│  ┌────┴────┐ ┌──────┴──────┐ ┌────┴─────┐ ┌──────┴──────────┐  │
│  │  RBAC   │ │ Compliance  │ │ Scoring  │ │Win Probability  │  │
│  │Middleware│ │  Engine     │ │ Service  │ │   Service       │  │
│  └─────────┘ └─────────────┘ └──────────┘ └─────────────────┘  │
│                                                                  │
│  ┌──────────────┐ ┌────────────┐ ┌────────────────────────────┐ │
│  │  Reputation  │ │ Temporal   │ │     Enrichment Service     │ │
│  │   Service    │ │   Decay    │ │                            │ │
│  └──────────────┘ └────────────┘ └────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │    Audit Middleware      │  │   Scheduled Data Sync Job    │ │
│  │  (logs every action)     │  │   (cron / cloud function)    │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                     DATABASE (PostgreSQL)                         │
│                                                                  │
│  leads | opportunities | proposals | outcomes | compliance_rules │
│  compliance_gates | compliance_events | client_reputation_scores │
│  amendments | users | disclaimers | incentives_penalties          │
│  data_sources | audit_log                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 File Structure

```
/
├── server/
│   ├── index.js                       # Express server entry point
│   ├── config/
│   │   ├── database.js                # PostgreSQL connection config
│   │   ├── compliance-rules.json      # Configurable compliance rules
│   │   └── scoring-weights.json       # Configurable scoring weights
│   ├── routes/
│   │   ├── leads.js                   # Lead CRUD and scoring endpoints
│   │   ├── compliance.js              # Compliance gate and rule endpoints
│   │   ├── analytics.js               # Win probability and reporting
│   │   └── auth.js                    # Authentication and RBAC endpoints
│   ├── models/
│   │   ├── Lead.js
│   │   ├── Opportunity.js
│   │   ├── Proposal.js
│   │   ├── Outcome.js
│   │   ├── ComplianceRule.js
│   │   ├── ComplianceGate.js
│   │   ├── ComplianceEvent.js
│   │   ├── ClientReputationScore.js
│   │   ├── Amendment.js
│   │   ├── User.js
│   │   ├── Disclaimer.js
│   │   ├── IncentivePenalty.js
│   │   └── DataSource.js
│   ├── services/
│   │   ├── scoring.js                 # Lead scoring logic (DRY, reusable)
│   │   ├── compliance-engine.js       # Gate evaluation, rule checking
│   │   ├── enrichment.js              # Data enrichment pipeline
│   │   ├── win-probability.js         # Predictive model w/ explainability
│   │   ├── temporal-decay.js          # Deadline-based score decay
│   │   ├── reputation.js              # Client compliance reputation
│   │   ├── amendment-analysis.js      # Amendment diff and classification
│   │   └── post-award.js             # Award detection and feedback loop
│   ├── jobs/
│   │   └── data-sync.js              # Scheduled API fetch (cron)
│   └── middleware/
│       ├── rbac.js                    # Role-based access control
│       └── audit.js                   # Audit trail logging
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx          # Main scoring dashboard
│   │   │   ├── LeadList.jsx           # Filterable lead list
│   │   │   ├── ScoreBreakdown.jsx     # Explainable score details
│   │   │   ├── ComplianceStatus.jsx   # Gate and compliance tracker
│   │   │   ├── DeadlineTracker.jsx    # Timeline and deadline view
│   │   │   ├── FilterPanel.jsx        # Vertical / subcategory filters
│   │   │   ├── AmendmentView.jsx      # Amendment diff and impact
│   │   │   └── ReputationBadge.jsx    # Client reputation display
│   │   ├── pages/
│   │   │   ├── ClientDashboard.jsx    # Client-role view
│   │   │   ├── ConsultantDashboard.jsx# Consultant-role view
│   │   │   ├── ReviewerDashboard.jsx  # Reviewer-role view
│   │   │   ├── AdminDashboard.jsx     # Admin-role view
│   │   │   └── Login.jsx
│   │   ├── services/
│   │   │   └── api.js                 # API client
│   │   └── context/
│   │       └── AuthContext.jsx        # RBAC context provider
│   └── public/
│       └── index.html
├── migrations/                        # PostgreSQL schema migrations
├── seeds/                             # Mock/seed data for MVP
├── tests/                             # Test suites
├── docs/                              # Generated documentation
├── package.json
├── BUILD_PROMPT.md
├── SRS_DOCUMENT.md
└── README.md
```

---

## 4. Functional Requirements

### 4.1 Compliance Engine

#### 4.1.1 Compliance Rule Management

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-CMP-001]` | The system SHALL allow Admins to create, read, update, and deactivate compliance rules. | Must |
| `[REQ-CMP-002]` | Each compliance rule SHALL have: `ruleId`, `name`, `description`, `applicableVerticals[]`, `gateType` (blocker / warning / informational), `threshold`, and optional `penaltyOnViolation`. | Must |
| `[REQ-CMP-003]` | Compliance rules SHALL be parameterized by industry vertical and subcategory. | Must |
| `[REQ-CMP-004]` | Rule thresholds and configurations SHALL be modifiable without code changes (stored in database or config files). | Must |
| `[REQ-CMP-005]` | The system SHALL support a minimum of 5 compliance rules for MVP, expandable without architectural changes. | Must |

#### 4.1.2 Compliance Gate Engine (Hard-Stop Logic)

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-GAT-001]` | The system SHALL enforce mandatory compliance checkpoints that are non-bypassable when `gateType = blocker`. | Must |
| `[REQ-GAT-002]` | Gate sets SHALL be configurable per opportunity/contract. | Must |
| `[REQ-GAT-003]` | When a blocker gate is not satisfied, the system SHALL prevent downstream actions (e.g., proposal submission locked if pricing review incomplete). | Must |
| `[REQ-GAT-004]` | When a required credential is missing, the system SHALL cap the win probability score at a configurable ceiling. | Must |
| `[REQ-GAT-005]` | When a document is uploaded past its deadline, the system SHALL auto-apply the configured penalty. | Must |
| `[REQ-GAT-006]` | The system SHALL log every gate evaluation (pass/fail/skip) with timestamp, user, and context. | Must |
| `[REQ-GAT-007]` | Warning-type gates SHALL display alerts but SHALL NOT block downstream actions. | Must |
| `[REQ-GAT-008]` | Informational-type gates SHALL log status for audit purposes without user-facing alerts. | Should |

#### 4.1.3 Compliance Reputation Score

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-REP-001]` | The system SHALL maintain a rolling Compliance Reputation Score per client (not per contract). | Must |
| `[REQ-REP-002]` | The score SHALL incorporate: timeliness of submissions, responsiveness, document quality, missed deadline count, and prior penalties. | Must |
| `[REQ-REP-003]` | The system SHALL store historical reputation snapshots for trend analysis. | Must |
| `[REQ-REP-004]` | The Compliance Reputation Score SHALL influence win probability calculations as a weighted factor. | Must |
| `[REQ-REP-005]` | The score SHALL be visible to Clients (their own), Consultants (assigned clients), and Admins (all). | Must |
| `[REQ-REP-006]` | The score SHALL unlock or restrict incentive tiers based on configurable thresholds. | Should |

#### 4.1.4 Incentive & Penalty System

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-INC-001]` | The system SHALL support configurable incentive rules triggered by consistent deadline compliance. | Should |
| `[REQ-INC-002]` | The system SHALL support configurable penalty rules with escalating severity: reminder → soft penalty → escalating fees. | Should |
| `[REQ-INC-003]` | All incentive and penalty actions SHALL be logged with full audit trail. | Must |
| `[REQ-INC-004]` | Incentive/penalty rules SHALL be configurable by Admin without code changes. | Should |
| `[REQ-INC-005]` | The system SHALL display active incentives and penalties to the affected Client. | Should |

---

### 4.2 Lead Assessment & Opportunity Intelligence

#### 4.2.1 Data Sourcing & Source Authority

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-SRC-001]` | The system SHALL classify every data source into one of three tiers: Authoritative (SAM.gov, federal agency sites), Semi-authoritative (state portals, prime contractor databases), or Non-authoritative (web, news, registries). | Must |
| `[REQ-SRC-002]` | Each data source SHALL have an assigned confidence weight (numeric, configurable). | Must |
| `[REQ-SRC-003]` | The system SHALL maintain a complete audit trail recording the origin of every data point. | Must |
| `[REQ-SRC-004]` | The system SHALL maintain a `data_sources` registry with: `sourceId`, `name`, `url`, `authorityTier`, `confidenceWeight`, `lastSyncDate`, `status`. | Must |

#### 4.2.2 Scheduled Data Enrichment Pipeline

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-ENR-001]` | The system SHALL execute data enrichment via scheduled batch jobs (cron or cloud functions), not live API calls. | Must |
| `[REQ-ENR-002]` | Batch sync frequency SHALL be configurable (weekly, monthly, or custom interval). | Must |
| `[REQ-ENR-003]` | Each sync run SHALL: (1) fetch new/updated data, (2) validate and classify by source authority, (3) enrich lead records, (4) store results in PostgreSQL. | Must |
| `[REQ-ENR-004]` | During normal user operations, the system SHALL query only the local database. No live external API calls. | Must |
| `[REQ-ENR-005]` | Each sync run SHALL log: start time, end time, records fetched, records updated, errors encountered. | Must |

#### 4.2.3 Lead Enrichment Attributes

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-LEA-001]` | Each lead record SHALL be enrichable with: past contract performance ratings, credentialing status, industry-specific ratings, NAICS code overlap, incumbent presence, bid count density, and compliance completeness percentage. | Must |
| `[REQ-LEA-002]` | Enrichment attributes SHALL include the source and confidence weight of the originating data. | Must |
| `[REQ-LEA-003]` | The system SHALL support adding new enrichment attributes without schema migration (via JSONB or extensible column strategy). | Should |

#### 4.2.4 Lead Scoring Engine

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-SCR-001]` | The system SHALL compute a composite lead score for each lead based on weighted enrichment attributes. | Must |
| `[REQ-SCR-002]` | Scoring weights SHALL be stored in configuration (not hardcoded) and modifiable by Admin. | Must |
| `[REQ-SCR-003]` | Scoring parameters SHALL be dynamically modifiable via UI filters (industry vertical, subcategory, NAICS). | Must |
| `[REQ-SCR-004]` | Filter changes SHALL trigger real-time score recalculation in the UI. | Must |
| `[REQ-SCR-005]` | The scoring function SHALL be implemented as a reusable, DRY service callable from multiple routes. | Must |

#### 4.2.5 Industry Vertical Tagging

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-VRT-001]` | The system SHALL tag every lead with one or more industry verticals (HVAC, restaurants, construction, IT services, etc.). | Must |
| `[REQ-VRT-002]` | The system SHALL support subcategory tagging within verticals (e.g., cuisine types within restaurants). | Must |
| `[REQ-VRT-003]` | The UI SHALL provide dynamic filtering by vertical and subcategory. | Must |
| `[REQ-VRT-004]` | New verticals and subcategories SHALL be addable by Admin without code changes. | Should |

---

### 4.3 Predictive Analytics & Monitoring

#### 4.3.1 Win Probability Model

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-WIN-001]` | The system SHALL calculate a win probability score (0–100%) for each opportunity. | Must |
| `[REQ-WIN-002]` | The win probability SHALL be explainable. The system SHALL display a breakdown of contributing factors: past performance match, NAICS overlap score, incumbent presence, bid count density, compliance completeness, and Compliance Reputation Score impact. | Must |
| `[REQ-WIN-003]` | The weight of each contributing factor SHALL be visible (may be abstracted but must be inspectable by Admin). | Must |
| `[REQ-WIN-004]` | Win probability SHALL recalculate when: enrichment data changes, compliance gates change status, amendments are detected, or filters are applied. | Must |
| `[REQ-WIN-005]` | The UI SHALL display the score breakdown on click/expand for each opportunity. | Must |

#### 4.3.2 Temporal Sensitivity & Decay

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-TMP-001]` | The system SHALL apply score decay as opportunity deadlines approach. | Must |
| `[REQ-TMP-002]` | The system SHALL apply penalty multipliers for tasks completed past their deadline. | Must |
| `[REQ-TMP-003]` | The system SHALL implement urgency escalation logic — opportunities due sooner SHALL be weighted and displayed with higher urgency. | Must |
| `[REQ-TMP-004]` | Decay curves and escalation thresholds SHALL be configurable by Admin. | Should |

#### 4.3.3 Amendment Impact Analysis

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-AMD-001]` | The system SHALL detect contract amendments when new data is synced. | Should |
| `[REQ-AMD-002]` | The system SHALL diff amendments against previous versions and classify changes as: Administrative, Technical, Pricing, or Scope expansion/contraction. | Should |
| `[REQ-AMD-003]` | The system SHALL auto-generate a "What changed and why it matters" summary for each amendment. | Should |
| `[REQ-AMD-004]` | Amendment detection SHALL trigger automatic win probability recalculation. | Should |

#### 4.3.4 Post-Award Intelligence Loop

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-PAL-001]` | The system SHALL detect and record award announcements. | Should |
| `[REQ-PAL-002]` | The system SHALL support ingestion of debrief data when available. | Should |
| `[REQ-PAL-003]` | The system SHALL tag loss reasons: price, technical, past performance, compliance gap, or other (configurable). | Should |
| `[REQ-PAL-004]` | Outcome data SHALL feed back into the scoring model to improve future predictions. | Should |
| `[REQ-PAL-005]` | The system SHALL generate client ROI reports from outcome data. | Should |

---

### 4.4 Traceability Pipeline

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-TRC-001]` | The system SHALL maintain full lineage: Lead Source → Matched Opportunity → Proposal Instance → Outcome (Win/Loss). | Must |
| `[REQ-TRC-002]` | Every entity in the pipeline SHALL have foreign key relationships enforcing referential integrity. | Must |
| `[REQ-TRC-003]` | The system SHALL support querying the full lineage of any given lead, opportunity, proposal, or outcome. | Must |
| `[REQ-TRC-004]` | Traceability data SHALL feed model improvement, client ROI reports, and subscription justification metrics. | Should |

---

### 4.5 Timelines & Accountability

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-TLN-001]` | Every lead and compliance step SHALL have an attached deadline. | Must |
| `[REQ-TLN-002]` | The system SHALL track progress in real time and display visual progress indicators. | Must |
| `[REQ-TLN-003]` | The system SHALL alert users to pending actions via in-app notifications. | Must |
| `[REQ-TLN-004]` | The system SHALL implement escalation chains for approaching and missed deadlines. | Should |

---

### 4.6 Dynamic Legal & Risk Disclaimers

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-DSC-001]` | The system SHALL generate contract-specific disclaimers (not static boilerplate). | Should |
| `[REQ-DSC-002]` | The system SHALL raise risk flags when: a client ignores guidance, submits non-compliant material, or a compliance gate is overridden. | Must |
| `[REQ-DSC-003]` | The system SHALL log all disclaimer acknowledgments with timestamps and user identity. | Must |
| `[REQ-DSC-004]` | Risk flags SHALL be visible to Consultants, Reviewers, and Admins. | Must |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-PRF-001]` | Dashboard page load SHALL complete within 2 seconds under normal load (< 100 concurrent users). | Must |
| `[REQ-PRF-002]` | Lead score recalculation on filter change SHALL complete within 500ms for up to 1,000 leads. | Must |
| `[REQ-PRF-003]` | Scheduled data sync jobs SHALL complete within 30 minutes for up to 50,000 records. | Should |
| `[REQ-PRF-004]` | All day-to-day operations SHALL query only the local PostgreSQL database (no live external calls). | Must |

### 5.2 Scalability

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-SCL-001]` | The system SHALL support up to 500 active client accounts at launch. | Must |
| `[REQ-SCL-002]` | The database schema SHALL support up to 1,000,000 lead records without degradation. | Should |
| `[REQ-SCL-003]` | The architecture SHALL allow horizontal scaling of the API layer. | Should |

### 5.3 Availability

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-AVL-001]` | The system SHALL target 99.5% uptime during business hours (Mon–Fri 6AM–10PM ET). | Must |
| `[REQ-AVL-002]` | Scheduled maintenance windows SHALL be communicated 48 hours in advance. | Should |

### 5.4 Maintainability

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-MNT-001]` | All business logic SHALL be separated from data/configuration (DRY, modular). | Must |
| `[REQ-MNT-002]` | Every service module SHALL document its purpose, inputs, outputs, and data flow. | Must |
| `[REQ-MNT-003]` | Configuration SHALL be version-controlled and environment-replicable. | Must |
| `[REQ-MNT-004]` | The codebase SHALL follow consistent coding standards enforced by linting. | Should |

### 5.5 Portability

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-PRT-001]` | The system SHALL be deployable on AWS, Azure, or any Docker-compatible environment. | Should |
| `[REQ-PRT-002]` | Environment setup SHALL be documented such that external development partners can replicate it independently. | Must |

---

## 6. Data Requirements

### 6.1 Entity Relationship Summary

```
┌──────────┐     ┌───────────────┐     ┌───────────┐     ┌──────────┐
│  leads   │────→│ opportunities │────→│ proposals │────→│ outcomes │
└──────────┘     └───────────────┘     └───────────┘     └──────────┘
     │                  │                                      │
     │                  │                                      │
     ▼                  ▼                                      ▼
┌──────────────┐ ┌─────────────────┐              ┌────────────────────┐
│ data_sources │ │compliance_gates │              │ post_award_feedback│
└──────────────┘ └─────────────────┘              └────────────────────┘
                        │
                        ▼
                 ┌─────────────────┐     ┌────────────────────────────┐
                 │compliance_events│     │ client_reputation_scores   │
                 └─────────────────┘     └────────────────────────────┘

┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐
│ compliance_rules │  │    users     │  │ incentives_penalties  │
└──────────────────┘  └──────────────┘  └──────────────────────┘

┌──────────────┐  ┌──────────────┐
│  amendments  │  │ disclaimers  │
└──────────────┘  └──────────────┘
```

### 6.2 Key Entity Definitions

#### 6.2.1 `leads`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique lead identifier |
| source_id | FK → data_sources | Origin data source |
| title | VARCHAR(500) | Lead/opportunity title |
| description | TEXT | Full description |
| naics_codes | VARCHAR[] | Applicable NAICS codes |
| verticals | VARCHAR[] | Industry vertical tags |
| subcategories | VARCHAR[] | Subcategory tags |
| raw_data | JSONB | Original fetched data (for audit) |
| enrichment_data | JSONB | Enriched attributes (extensible) |
| confidence_score | DECIMAL(5,2) | Source-weighted confidence |
| composite_score | DECIMAL(5,2) | Computed lead score |
| status | ENUM | active / archived / converted |
| deadline | TIMESTAMP | Associated deadline |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last modification |
| created_by | FK → users | Creating user/system |
| deleted_at | TIMESTAMP | Soft delete marker (nullable) |

#### 6.2.2 `opportunities`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique opportunity identifier |
| lead_id | FK → leads | Source lead |
| contract_number | VARCHAR(100) | Government contract number |
| agency | VARCHAR(255) | Issuing agency |
| set_aside | VARCHAR(100) | Set-aside type (8(a), SDVOSB, etc.) |
| estimated_value | DECIMAL(15,2) | Estimated contract value |
| response_deadline | TIMESTAMP | Submission deadline |
| win_probability | DECIMAL(5,2) | Calculated win probability |
| win_probability_factors | JSONB | Explainable factor breakdown |
| status | ENUM | identified / qualifying / pursuing / submitted / awarded / lost |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| created_by | FK → users | |
| deleted_at | TIMESTAMP | Soft delete |

#### 6.2.3 `proposals`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique proposal identifier |
| opportunity_id | FK → opportunities | Linked opportunity |
| client_id | FK → users | Submitting client |
| version | INTEGER | Proposal version number |
| status | ENUM | draft / in_review / submitted / withdrawn |
| compliance_status | ENUM | incomplete / pending_review / compliant / non_compliant |
| submitted_at | TIMESTAMP | Submission timestamp |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

#### 6.2.4 `outcomes`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| proposal_id | FK → proposals | |
| result | ENUM | win / loss / no_bid / withdrawn |
| loss_reason | VARCHAR(100) | Categorized loss reason |
| loss_detail | TEXT | Detailed explanation |
| award_amount | DECIMAL(15,2) | Award amount if won |
| debrief_data | JSONB | Debrief notes if available |
| feedback_processed | BOOLEAN | Whether fed back into model |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### 6.2.5 `compliance_rules`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| rule_id | VARCHAR(50) | Human-readable rule ID |
| name | VARCHAR(255) | Rule name |
| description | TEXT | Rule description |
| applicable_verticals | VARCHAR[] | Verticals this rule applies to |
| gate_type | ENUM | blocker / warning / informational |
| threshold | JSONB | Configurable threshold parameters |
| penalty_on_violation | JSONB | Penalty config (optional) |
| is_active | BOOLEAN | Whether rule is currently active |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### 6.2.6 `compliance_gates`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| opportunity_id | FK → opportunities | |
| rule_id | FK → compliance_rules | |
| status | ENUM | pending / passed / failed / overridden |
| evaluated_at | TIMESTAMP | Last evaluation time |
| evaluated_by | FK → users | User or system |
| override_reason | TEXT | If overridden, why |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### 6.2.7 `compliance_events`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| entity_type | VARCHAR(50) | What entity this event relates to |
| entity_id | UUID | ID of related entity |
| event_type | VARCHAR(100) | Type of compliance event |
| details | JSONB | Event details |
| user_id | FK → users | Acting user |
| ip_address | INET | Source IP |
| created_at | TIMESTAMP | |

#### 6.2.8 `client_reputation_scores`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| client_id | FK → users | |
| score | DECIMAL(5,2) | Current reputation score |
| factors | JSONB | Contributing factor breakdown |
| snapshot_date | DATE | Date of this snapshot |
| created_at | TIMESTAMP | |

#### 6.2.9 `amendments`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| opportunity_id | FK → opportunities | |
| amendment_number | INTEGER | Sequential amendment number |
| classification | ENUM | administrative / technical / pricing / scope_expansion / scope_contraction |
| diff_data | JSONB | Structured diff of changes |
| impact_summary | TEXT | Auto-generated impact summary |
| detected_at | TIMESTAMP | When amendment was detected |
| created_at | TIMESTAMP | |

#### 6.2.10 `users`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| email | VARCHAR(255) | Unique email |
| password_hash | VARCHAR(255) | Hashed password |
| role | ENUM | client / consultant / reviewer / admin |
| subscription_tier | ENUM | basic / mid / premium |
| is_active | BOOLEAN | Account active flag |
| last_login | TIMESTAMP | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

#### 6.2.11 `data_sources`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| name | VARCHAR(255) | Source name |
| url | VARCHAR(500) | Source URL |
| authority_tier | ENUM | authoritative / semi_authoritative / non_authoritative |
| confidence_weight | DECIMAL(3,2) | 0.00–1.00 |
| sync_frequency | VARCHAR(50) | weekly / monthly / custom |
| last_sync_at | TIMESTAMP | Last successful sync |
| status | ENUM | active / inactive / error |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### 6.2.12 `disclaimers`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| opportunity_id | FK → opportunities | |
| content | TEXT | Disclaimer text |
| risk_flags | JSONB | Associated risk flags |
| acknowledged_by | FK → users | |
| acknowledged_at | TIMESTAMP | |
| created_at | TIMESTAMP | |

#### 6.2.13 `incentives_penalties`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| client_id | FK → users | |
| type | ENUM | incentive / penalty |
| severity | ENUM | reminder / soft / escalating |
| trigger_rule | JSONB | What triggered this |
| description | TEXT | Human-readable description |
| amount | DECIMAL(10,2) | Monetary value if applicable |
| status | ENUM | active / resolved / waived |
| created_at | TIMESTAMP | |
| resolved_at | TIMESTAMP | |

### 6.3 Database Principles

| ID | Requirement |
|----|------------|
| `[REQ-DAT-001]` | All tables SHALL include `created_at` and `updated_at` audit columns. |
| `[REQ-DAT-002]` | Compliance-relevant tables SHALL use soft deletes (`deleted_at` column). Hard deletes are prohibited. |
| `[REQ-DAT-003]` | Foreign keys SHALL enforce referential integrity across the traceability pipeline. |
| `[REQ-DAT-004]` | Indexes SHALL be created on frequently filtered columns: `vertical`, `naics_codes`, `deadline`, `status`, `role`, `client_id`. |
| `[REQ-DAT-005]` | JSONB columns SHALL be used for extensible attributes (enrichment data, factors, thresholds) to support schema evolution without migrations. |
| `[REQ-DAT-006]` | All database migrations SHALL be version-controlled and reversible. |

---

## 7. Interface Requirements

### 7.1 User Interface Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-UI-001]` | The system SHALL provide a responsive web interface compatible with desktop browsers (Chrome, Firefox, Edge, Safari). | Must |
| `[REQ-UI-002]` | Each user role SHALL have a distinct dashboard view tailored to their responsibilities. | Must |
| `[REQ-UI-003]` | The lead list SHALL support real-time filtering by vertical, subcategory, NAICS code, deadline range, and score range. | Must |
| `[REQ-UI-004]` | Score breakdowns SHALL be accessible via click/expand interaction on any scored item. | Must |
| `[REQ-UI-005]` | Compliance status SHALL be displayed with clear visual indicators (color-coded: green/yellow/red). | Must |
| `[REQ-UI-006]` | Deadline tracking SHALL include visual timeline/progress bar components. | Must |
| `[REQ-UI-007]` | In-app notifications SHALL alert users to pending compliance actions, approaching deadlines, and risk flags. | Must |
| `[REQ-UI-008]` | The interface SHALL be intuitive enough to use without training documentation for basic operations. | Should |

### 7.2 API Interface Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-API-001]` | The system SHALL expose a RESTful API with JSON request/response format. | Must |
| `[REQ-API-002]` | All API endpoints SHALL require authentication (JWT or session-based). | Must |
| `[REQ-API-003]` | API responses SHALL include appropriate HTTP status codes and error messages. | Must |
| `[REQ-API-004]` | API endpoints SHALL enforce RBAC — users can only access data permitted by their role. | Must |
| `[REQ-API-005]` | List endpoints SHALL support pagination, sorting, and filtering. | Must |

### 7.3 External Interface Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-EXT-001]` | External data source integrations SHALL occur only during scheduled batch sync jobs. | Must |
| `[REQ-EXT-002]` | Each external integration SHALL have configurable connection parameters (URL, API key, rate limits). | Must |
| `[REQ-EXT-003]` | External sync failures SHALL be logged and SHALL NOT crash the system or corrupt local data. | Must |

---

## 8. Security Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-SEC-001]` | The system SHALL implement role-based access control (RBAC) with four roles: Client, Consultant, Reviewer, Admin. | Must |
| `[REQ-SEC-002]` | Passwords SHALL be hashed using bcrypt (or equivalent) with a minimum cost factor of 10. | Must |
| `[REQ-SEC-003]` | API authentication SHALL use JWT tokens with configurable expiration. | Must |
| `[REQ-SEC-004]` | All client-server communication SHALL use HTTPS/TLS. | Must |
| `[REQ-SEC-005]` | SQL injection SHALL be prevented via parameterized queries (no string concatenation for SQL). | Must |
| `[REQ-SEC-006]` | XSS SHALL be prevented via input sanitization and React's built-in escaping. | Must |
| `[REQ-SEC-007]` | API rate limiting SHALL be implemented to prevent abuse. | Should |
| `[REQ-SEC-008]` | Session tokens SHALL be invalidated on logout and password change. | Must |
| `[REQ-SEC-009]` | Admin actions (rule changes, user management, gate overrides) SHALL be logged in the audit trail. | Must |
| `[REQ-SEC-010]` | Database backups SHALL be encrypted at rest. | Should |

---

## 9. Compliance & Regulatory Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-FAR-001]` | The system SHALL NOT scrape restricted government portals. Source restrictions SHALL be enforced at the system level (not just policy). | Must |
| `[REQ-FAR-002]` | The system SHALL NOT blend or present data in ways that could imply insider access or misrepresent data provenance. | Must |
| `[REQ-FAR-003]` | The system SHALL maintain clean data provenance — every data point traceable to its source. | Must |
| `[REQ-FAR-004]` | The system SHALL enforce FAR-aligned guardrails as system controls, not just policy documents. | Must |
| `[REQ-FAR-005]` | Compliance-relevant data SHALL have a minimum retention period of 7 years (configurable). | Should |
| `[REQ-FAR-006]` | The audit log SHALL be append-only and tamper-evident. | Should |

---

## 10. Subscription Tier Requirements

### 10.1 Tier Definitions

| Tier | Monthly Access | Features |
|------|---------------|----------|
| **Basic** | Entry-level | Essential lead scoring, basic compliance tracking, standard filters, read-only dashboards |
| **Mid** | Professional | Advanced filters, deeper reporting, basic incentive system, compliance gate alerts, consultant access |
| **Premium** | Enterprise | Full predictive analytics, custom compliance rules, incentive/penalty system, amendment analysis, post-award intelligence, full RBAC, API access |

### 10.2 Feature Gating

| ID | Requirement | Priority |
|----|------------|----------|
| `[REQ-TIR-001]` | The system SHALL enforce feature gating based on the client's subscription tier. | Should |
| `[REQ-TIR-002]` | Attempts to access gated features SHALL display an upgrade prompt, not an error. | Should |
| `[REQ-TIR-003]` | Tier changes SHALL take effect immediately without requiring re-login. | Should |
| `[REQ-TIR-004]` | Tier-specific feature access SHALL be controlled via configuration, not hardcoded conditions. | Should |

---

## 11. Acceptance Criteria

### 11.1 MVP Acceptance Criteria

The MVP (Phase 1) is accepted when ALL of the following are demonstrated:

| # | Criterion | Verification Method |
|---|-----------|-------------------|
| AC-01 | At least 5 compliance rules are defined and operational, with at least 2 hard blocker gates. | Functional test: attempt to bypass a blocker gate → system prevents action. |
| AC-02 | Mock lead data is ingested with source classification and confidence weights. | Database inspection: leads have `source_id`, `confidence_score` populated. |
| AC-03 | Lead scoring produces explainable scores with factor breakdown. | UI test: click a lead score → see contributing factors and weights. |
| AC-04 | Scoring dashboard displays: lead list, scores, compliance status, deadlines. | UI walkthrough against all four display requirements. |
| AC-05 | Scheduled data sync job runs successfully and updates the database. | Execute sync job → verify new records in database with sync log. |
| AC-06 | RBAC enforces at minimum Client and Admin role separation. | Login as Client → verify restricted access. Login as Admin → verify full access. |
| AC-07 | Audit trail logs compliance events with timestamp, user, and context. | Perform compliance actions → query `compliance_events` table → verify entries. |
| AC-08 | Blocker gate prevents proposal submission when prerequisites are unmet. | Attempt to submit proposal with failed blocker → submission is blocked with explanation. |
| AC-09 | Filter changes recalculate lead scores in < 500ms for 1,000 leads. | Performance test with 1,000 seeded leads. |
| AC-10 | System runs entirely on local DB queries during normal operation (no external API calls). | Network monitor during dashboard usage → zero external calls. |

### 11.2 Post-MVP Acceptance (Phase 2+)

| # | Criterion |
|---|-----------|
| AC-11 | Amendment detection produces classified diffs with auto-generated impact summaries. |
| AC-12 | Post-award feedback loop: outcome data demonstrably changes future win probability scores. |
| AC-13 | Incentive/penalty system triggers automated escalation on configurable thresholds. |
| AC-14 | All four RBAC roles have distinct, functional dashboards. |
| AC-15 | Subscription tier gating restricts features correctly per tier definition. |
| AC-16 | Traceability pipeline: full lineage queryable from lead to outcome. |
| AC-17 | Compliance Reputation Score influences win probability and unlocks incentive tiers. |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **Blocker Gate** | A compliance checkpoint that prevents all downstream actions until satisfied. Cannot be bypassed. |
| **Compliance Reputation Score** | A rolling, per-client metric reflecting their historical compliance behavior. |
| **Confidence Weight** | A numeric value (0.00–1.00) assigned to a data source indicating the reliability of data from that source. |
| **DRY** | "Don't Repeat Yourself" — a software development principle aimed at reducing repetition. |
| **FAR** | Federal Acquisition Regulation — the primary body of rules governing federal government procurement. |
| **GovCon** | Government Contracting — the industry of bidding on and performing contracts with government agencies. |
| **NAICS** | North American Industry Classification System — standard used to classify businesses by industry. |
| **RBAC** | Role-Based Access Control — a method of restricting system access based on user roles. |
| **SAM.gov** | System for Award Management — the official U.S. government system for entity registration and contract data. |
| **Soft Delete** | Marking a record as deleted (via `deleted_at` timestamp) without removing it from the database. |
| **Source Authority** | The classification tier of a data source: Authoritative, Semi-authoritative, or Non-authoritative. |
| **Temporal Decay** | The reduction of a score or priority as a deadline approaches, reflecting increasing urgency. |
| **Traceability Pipeline** | The full lineage chain: Lead → Opportunity → Proposal → Outcome. |
| **Win Probability** | A calculated percentage (0–100%) indicating the likelihood of winning a specific contract opportunity. |

---

## 13. Appendices

### Appendix A: Requirement Traceability Matrix

| Requirement Category | ID Range | Count |
|---------------------|----------|-------|
| Compliance Rules | REQ-CMP-001 to REQ-CMP-005 | 5 |
| Compliance Gates | REQ-GAT-001 to REQ-GAT-008 | 8 |
| Reputation Score | REQ-REP-001 to REQ-REP-006 | 6 |
| Incentive/Penalty | REQ-INC-001 to REQ-INC-005 | 5 |
| Data Sourcing | REQ-SRC-001 to REQ-SRC-004 | 4 |
| Data Enrichment | REQ-ENR-001 to REQ-ENR-005 | 5 |
| Lead Attributes | REQ-LEA-001 to REQ-LEA-003 | 3 |
| Lead Scoring | REQ-SCR-001 to REQ-SCR-005 | 5 |
| Industry Verticals | REQ-VRT-001 to REQ-VRT-004 | 4 |
| Win Probability | REQ-WIN-001 to REQ-WIN-005 | 5 |
| Temporal Decay | REQ-TMP-001 to REQ-TMP-004 | 4 |
| Amendment Analysis | REQ-AMD-001 to REQ-AMD-004 | 4 |
| Post-Award Loop | REQ-PAL-001 to REQ-PAL-005 | 5 |
| Traceability | REQ-TRC-001 to REQ-TRC-004 | 4 |
| Timelines | REQ-TLN-001 to REQ-TLN-004 | 4 |
| Disclaimers | REQ-DSC-001 to REQ-DSC-004 | 4 |
| Performance | REQ-PRF-001 to REQ-PRF-004 | 4 |
| Scalability | REQ-SCL-001 to REQ-SCL-003 | 3 |
| Availability | REQ-AVL-001 to REQ-AVL-002 | 2 |
| Maintainability | REQ-MNT-001 to REQ-MNT-004 | 4 |
| Portability | REQ-PRT-001 to REQ-PRT-002 | 2 |
| UI | REQ-UI-001 to REQ-UI-008 | 8 |
| API | REQ-API-001 to REQ-API-005 | 5 |
| External Interfaces | REQ-EXT-001 to REQ-EXT-003 | 3 |
| Security | REQ-SEC-001 to REQ-SEC-010 | 10 |
| FAR Compliance | REQ-FAR-001 to REQ-FAR-006 | 6 |
| Subscription Tiers | REQ-TIR-001 to REQ-TIR-004 | 4 |
| Data Model | REQ-DAT-001 to REQ-DAT-006 | 6 |
| **Total** | | **130** |

### Appendix B: MVP vs Post-MVP Requirement Mapping

**MVP (Phase 1) — Must-Have Requirements:**
All requirements tagged `Must` priority, specifically:
- REQ-CMP-001 through REQ-CMP-005
- REQ-GAT-001 through REQ-GAT-007
- REQ-REP-001 through REQ-REP-005
- REQ-SRC-001 through REQ-SRC-004
- REQ-ENR-001 through REQ-ENR-005
- REQ-LEA-001 through REQ-LEA-002
- REQ-SCR-001 through REQ-SCR-005
- REQ-VRT-001 through REQ-VRT-003
- REQ-WIN-001 through REQ-WIN-005
- REQ-TMP-001 through REQ-TMP-003
- REQ-TRC-001 through REQ-TRC-003
- REQ-TLN-001 through REQ-TLN-003
- REQ-DSC-002 through REQ-DSC-004
- REQ-PRF-001, REQ-PRF-002, REQ-PRF-004
- REQ-SCL-001
- REQ-AVL-001
- REQ-MNT-001 through REQ-MNT-003
- REQ-PRT-002
- REQ-UI-001 through REQ-UI-007
- REQ-API-001 through REQ-API-005
- REQ-EXT-001 through REQ-EXT-003
- REQ-SEC-001 through REQ-SEC-006, REQ-SEC-008, REQ-SEC-009
- REQ-FAR-001 through REQ-FAR-004
- REQ-DAT-001 through REQ-DAT-006

**Post-MVP (Phase 2+) — Should-Have Requirements:**
- REQ-GAT-008, REQ-REP-006, REQ-INC-001 through REQ-INC-005
- REQ-LEA-003, REQ-VRT-004, REQ-TMP-004
- REQ-AMD-001 through REQ-AMD-004
- REQ-PAL-001 through REQ-PAL-005
- REQ-TRC-004, REQ-TLN-004, REQ-DSC-001
- REQ-PRF-003, REQ-SCL-002, REQ-SCL-003
- REQ-AVL-002, REQ-MNT-004, REQ-PRT-001
- REQ-UI-008, REQ-SEC-007, REQ-SEC-010
- REQ-FAR-005, REQ-FAR-006
- REQ-TIR-001 through REQ-TIR-004

### Appendix C: Revision History

| Version | Date       | Author       | Changes         |
|---------|------------|--------------|-----------------|
| 1.0     | 2026-02-10 | MercyRaineLLC | Initial draft  |

---

*End of Software Requirements Specification*
