## System Overview

### Purpose and Scope

- Angie Tutor is a web and mobile application for English voice lessons with an adaptive AI tutor.
- Supports:
    - Individual learning: personalization for each learner
    - Global improvement of methodology: analytics, experiments, content bank

### Personas and Primary Use Cases

- Learner: voice lessons, personalized exercises, instant feedback, progress and homework tracking
- Tutor (AI): dialogue management, adaptive difficulty, error evaluation, review recommendations
- Content and Methodics Owner: creation and maintenance of the content bank, topics, rubrics, CEFR map
- Ops and Admin: monitoring quality and latency, billing, moderation, running A/B experiments

### Capability Map

- Realtime Voice Tutoring: ASR ↔ LLM ↔ TTS streaming with barge-in and partial transcripts
- Adaptive Learning: Lesson Planner (CEFR and TBLT), Adaptive Engine (Elo and IRT), SRS repetition
- Personalization (RAG): personal memory of goals, errors, vocabulary, history; pedagogy knowledge base
- Pronunciation Feedback: phoneme alignment and GOP, stress and intonation hints, minimal pairs
- Analytics and Improvement: event collection, dashboards, quality rubrics, A/B testing for prompts and content
- Commerce and Compliance: subscriptions and limits with Stripe, privacy with GDPR, auditing, data deletion

### Logical Architecture

- Client to Edge or Gateway to Orchestrator to AI Core and RAG and Data to Pronunciation and SRS to Analytics and A/B to Billing and Admin and Observability and Privacy to CI and CD and Environments

### Layer Overview

| Layer | Responsibilities | Key Tech |
| --- | --- | --- |
| Client | Next.js UI, WebRTC, WebAudio, captions, push-to-talk, TTS playback, indicators | Next.js, WebRTC, Web Audio |
| Edge or Gateway | Authentication, rate-limit, WAF, moderation, protocol termination | Supabase Auth, Vercel Edge, Cloudflare |
| Orchestrator | Lesson state, tool orchestration, planning, policy enforcement, JSON schema validation | Next.js Server Actions |
| AI Core | OpenAI Realtime LLM for dialogue and methodics, Whisper ASR, TTS, constrained JSON outputs | OpenAI Realtime, Whisper |
| RAG and Data | Postgres and pgvector, pedagogy KB, object storage | Supabase Postgres, pgvector |
| Pronunciation Service | Phoneme alignment and GOP, scores and hints | Python, PyTorch, Kaldi or ESPnet |
| SRS Scheduler | SM-2 or Leitner scheduling with confidence | Postgres |
| Analytics and Events | ClickHouse or BigQuery, dashboards, tracing | Metabase or Looker, Sentry, OTel |
| A/B and Evaluation | Feature flags, assignment, runner, rubrics | Unleash or ConfigCat |
| Billing | Stripe subscriptions and entitlements | Stripe |
| Admin | Content and roles, quotas, support console | Next.js, Supabase |
| Observability | SLO alerts, uptime, synthetic tests, tracing | Sentry, OTel |
| Privacy and Compliance | Consents, redaction, right to delete or export, audits | RLS, KMS, policies |
| CI and CD and Environments | Dev and Staging and Prod, GitHub Actions, Vercel or Netlify, Canary and Blue-Green | GitHub Actions, Vercel or Netlify |

### Functional Architecture and Flows

### Lesson: Voice Dialogue

1. User presses talk. Client streams audio via WebRTC to Edge.
2. Orchestrator activates ASR for partial captions and LLM for dialogue management.
3. Orchestrator queries RAG for personal memory and Pedagogy KB materials.
4. LLM generates TASK and FEEDBACK JSON with structured hints, errors, and next steps.
5. Orchestrator calls TTS for playback and may query Pronunciation Service.
6. Events, scores, and errors are logged to Analytics. Tables updated: lesson_runs, error_log, srs_queue.

### Personalization: Online Adaptation

- Adaptive Engine adjusts next exercise difficulty with Elo or IRT and selects content.
- SRS Scheduler builds a review queue for time and type (word or structure) and shows it in later sessions.

### Global Improvement

- Collected events flow to Analytics and dashboards of progress, retention, and quality.
- Methodics team updates content, rubrics, CEFR maps in Pedagogy KB.
- Prompts, scenarios, and exercises are A/B tested and best variants become part of the gold set.

### Data Architecture: Key Entities

| Entity | Columns or Notes |
| --- | --- |
| profiles | user_id, cefr_range, goals, interests, L1, prefs |
| lesson_runs | id, user_id, target_structures[], target_vocab[], feedback_json, audio_ref, started_at, ended_at |
| error_log | id, user_id, type{phon, gram, lex}, snippet, correction, severity, ts |
| srs_queue | user_id, item_id, type{word, pattern}, due_at, ease, interval |
| events | ts, user_id?, event_name, props(JSON) in ClickHouse or BigQuery sharded tables |
| kb_docs | CEFR and TBLT and andragogy, lesson templates, topic packs, embeddings |
| media | audio and transcripts with signed URLs |

### Non-Functional Requirements

- Latency SLOs:
    - ASR first token under 300 ms
    - LLM first chunk under 600 ms
    - TTS onset under 350 ms
    - End-to-end replica latency under 1.2 s
- Availability: 99.9% in production, graceful degradation with text fallback and backup region
- Security: OAuth2 with Google, Postgres RLS, signed URLs, secrets in KMS, least privilege
- Privacy: explicit consents, opt-out and delete, PII redaction before logging
- Scalability: stateless orchestration, horizontal scaling of ASR and TTS and LLM channels, event queues

### Operations and Observability

- Monitoring: latency charts for ASR, LLM, TTS, barge-in percent, WER or CER, 5xx, RPS
- Alerts: SLO thresholds, error budget, conversion and retention drops
- Tracing: OTel traces Client to Edge to Orchestrator to AI and RAG to TTS with span attributes

### Environments and CI and CD

- Dev: preview per PR, seed data, fake billing
- Staging: UAT, synthetic load, red-team tests
- Prod: canary and blue-green, autoscale, 24/7 alerts, backup region
- CI and CD: GitHub Actions for lint, tests, typecheck, static prompt and schema analysis, DB migrations

### Risks and Mitigations

- Vendor lock-in for LLM: standardized schemas, RAG-centric design, provider switchability
- Latency spikes: edge caching of proto-materials, pre-warm channels, adaptive timeouts
- Data quality: rubrics, validation, moderation of gold set, incremental A/B expansion
- Privacy: data minimization, short retention, transparent consent UX

### Next Steps

- Approve data schemas and JSON contracts for TASK and FEEDBACK
- Implement MVP lesson flow with event logging
- Add SRS, Pronunciation, and basic A/B
- Launch NFR and SLO dashboards for learning progress and quality

---

## Module: Client (Web and Mobile UI)

### Purpose

- User interface for login, lesson topic selection, and real-time voice communication with the AI model
- Captures audio, plays spoken responses, displays textual hints, visualizes progress

### Key Responsibilities

- User Interface: landing, login, dashboard, learning plan, glossary, analytics
- Voice Channel: WebRTC stream microphone to server to TTS playback
- Realtime Feedback: partial captions, mic activity indicators, connection status
- Lesson Interaction: start or stop lessons, display tasks, exercises, and feedback
- Personalization UX: onboarding for goals and interests, level testing, plan generation
- Account and Settings: profile, Google OAuth, notification and reminders
- Glossary and Progress: terms and phrases, statistics for CEFR percent, minutes, completed lessons

### Technologies

- Framework: Next.js App Router
- Styling and UI: TailwindCSS and UntitledUI
- Realtime Audio: WebRTC, Web Audio API
- State Management: React hooks and context, optional Zustand or Redux
- Auth: Supabase Auth with Google OAuth

### Components and Screens

- Landing Page
- Login and Sign Up
- Dashboard
- Onboarding
- Lesson Flow
- Analytics
- Glossary
- Profile Settings

### Data Handled

- User profile cache: id, name, email, settings
- Voice or audio chunks: temporary WebRTC buffers
- Lesson state: session progress, partial captions
- UI preferences: theme, language, reminders

### Integration Points

- Edge or Gateway: audio streaming and TTS
- Orchestrator: lesson events for start, stop, next task, feedback JSON
- Supabase Auth: sessions
- Analytics: frontend events for clicks, timings, drop-offs

### Non-Functional

- UX: one-tap start, optimized mobile
- Performance: under 150 ms to display partial captions after ASR output
- Resilience: fallback to text chat
- Accessibility: captions, scaling, contrast, ARIA

---

## Module: Edge and Gateway

### Purpose

- Controls access, authentication, routing, and initial validation
- First point of entry for secure, low-latency communication

### Key Responsibilities

- Authentication and Authorization: Supabase Auth with Google OAuth
- Traffic Management: WebRTC, WebSocket, HTTP
- Routing and Caching
- Rate Limiting
- Security with WAF
- Pre-Moderation for audio and text safety

### Technologies

- Edge Compute: Vercel Edge Functions or Cloudflare Workers
- Authentication: Supabase Auth
- Security: Cloudflare, Vercel Edge Middleware
- Networking: WebRTC termination, WebSockets, HTTP/2 or 3

### Components

- Routing Layer with geo-routing
- Auth Layer
- Rate Limit Layer
- Firewall Layer

### Data Handled

- Session tokens: JWT or OAuth
- Connection metadata
- Rate limit counters
- Audit logs

### Integration Points

- Client
- Orchestrator
- Supabase Auth
- Security Services

### Non-Functional Requirements

- Performance: under 50 ms overhead
- Scalability: global PoPs
- Reliability: regional failover
- Security: TLS, OAuth
- Compliance: audit logging

---

## Orchestration Layer

### Module: Orchestrator

### Purpose

- Central lesson manager coordinating session flow, AI services, rules, and structured adaptive tutoring

### Key Responsibilities

- Lesson Flow Management
- Tool Orchestration for ASR, TTS, RAG, Pronunciation, SRS
- Adaptive Learning with Elo or IRT
- Lesson Planning aligned to CEFR and TBLT
- Policy Enforcement with system prompts and JSON schema validation
- Integration Hub across Client, AI Core, RAG, and Analytics

### Technologies

- Next.js Server Actions
- JSON contracts for TASK and FEEDBACK validated by schemas
- Elo or IRT adaptation
- REST or WebSocket for AI services

### Components

- Server Actions
- Lesson Planner
- Adaptive Engine
- Policy Engine

### Data Handled

- Lesson state
- Learner profile inputs
- Adaptive metrics
- Feedback JSON

### Integration Points

- Client
- AI Core: LLM, ASR, TTS
- RAG and Data
- Pronunciation Service
- Analytics and Events
- Billing

### Non-Functional Requirements

- Performance: under 100 ms orchestration overhead
- Scalability: stateless, horizontal scale
- Reliability: retries and text fallback
- Consistency: contract enforcement
- Security: validation and auth

---

### Submodule: Lesson Planner

### Purpose

- Generates sequenced plans per session aligned to CEFR and TBLT and andragogy

### Scope

- Session and micro-planning
- CEFR alignment
- Scripted templates and dynamic LLM-assisted plans

### Key Responsibilities

- Objective Selection
- Structure: Warm-up, Input, Task, Feedback, Review or SRS
- Task Authoring with prompts and success criteria
- Material Retrieval from Pedagogy KB and personal memory
- Assessment Hooks with rubrics
- Runtime Adaptation and branching

### Inputs

- Learner profile
- Recent telemetry
- Context
- KB assets

### Outputs: Contract

```json
{
  "lesson_id": "uuid",
  "targets": [{"type":"structure","id":"past_simple_neg"},{"type":"vocab","id":"travel_a2"}],
  "stages": [
    {"id":"warmup","kind":"dialogue","goal":"activate schema","prompt":"Small talk about recent trips"},
    {"id":"input","kind":"modeling","examples":["I didn't go...","We didn't have..."],"kb_refs":["kb://a2/past_simple"],"checks":["ccq1","ccq2"]},
    {"id":"task","kind":"roleplay","scenario":"booking a hostel","success_criteria":["uses didn't correctly 3+ times"],"timeouts":{"soft":120}},
    {"id":"feedback","kind":"formative","rubric":"rubric://a2/past_simple_clarity","format":"TASK/FEEDBACK"},
    {"id":"review","kind":"srs","items":[{"type":"word","id":"hostel"}]}
  ],
  "branching": {"on_high_error":"repeat_task_variant_b","on_fast_success":"advance_to_extension"}
}
```

### Data Model

- lesson_templates: id, cefr, topic, stages(jsonb), rubric_refs[]
- task_bank: id, kind, inputs, kb_refs[], min_cefr, max_cefr
- plans: lesson_id, user_id, plan_jsonb, created_at

### Algorithms

- Targeting:
    - Rank by recent errors times severity plus goal alignment minus recency penalty
- Stage Composer:
    - Warm-up to Input to Task to Feedback to Review backbone
    - Optional Extension stage on early success
- Variant Generator:
    - Two or more variants per task for branching and A/B

### 

### APIs

- POST /planner/plan
- GET /planner/next?lesson_id=…
- POST /planner/branch
- POST /planner/complete_stage

### Integration Points

- Orchestrator
- RAG and Data
- A/B and Evaluation
- SRS Scheduler

### Non-Functional Requirements

- Determinism
- Latency: under 300 ms cached and under 800 ms with LLM
- Auditability: persist plan_jsonb
- Safety: plan schema validation

### Acceptance Criteria

- Valid plan for A1 to B2 with grammar and vocab targets
- Branching for high error and early success
- Rubric references with measurable criteria
- Full round-trip with Orchestrator without manual fixes

---

### Submodule: Adaptive Engine

### Purpose

- Adjusts difficulty, content selection, and pacing in real time

### Scope

- Within-lesson and between-lesson adaptation
- Grammar, vocabulary, pronunciation, fluency
- Rules plus probabilistic models

### Key Responsibilities

- Proficiency Estimation
- Difficulty Calibration
- Next-Step Policy
- Mastery or Readiness Decisions
- Signal Fusion

### Inputs

- Observed performance
- Confidence signal
- Task metadata
- History and prior

### Outputs: Contract

```json
{
  "lesson_id": "uuid",
  "stage_id": "task",
  "ability": {"structure.A2.past_simple": {"theta": -0.2, "sigma": 0.35}},
  "decision": {"action": "advance|repeat|remediate", "delta": "+1|0|-1"},
  "next_task": {"id": "task_123b", "difficulty": 0.3, "variant": "b"},
  "rationale": {"signals": {"acc": 0.67, "rt_ms": 5200, "conf": 2}, "rule": "IRT.low_info+errors>threshold"}
}
```

### Data Model

- abilities: user_id, skill_id, theta, sigma, updated_at
- task_difficulty: task_id, skill_id, beta, discrimination, source
- adapt_events: lesson_id, stage_id, decision, signals(jsonb), ability_before or after

### Algorithms

- Elo-style update
- 2PL or 3PL IRT
- Decision policy for advance, repeat, remediate
- Cold start with CEFR prior
- Confidence weighting
- Multi-skill fusion

### APIs

- POST /adaptive/observe
- POST /adaptive/recommend
- GET /adaptive/ability
- POST /adaptive/batch_calibrate

### Integration Points

- Orchestrator
- Lesson Planner
- RAG and Data
- A/B and Evaluation

### Non-Functional Requirements

- Latency: under 50 to 80 ms
- Stability: bounded oscillation
- Auditability
- Fairness: cap updates on low ASR confidence

### Acceptance Criteria

- Per-skill ability for ten or more skills
- Decisions with rationale and signals
- Integrates observe to recommend across three or more task types
- Measurable improvement over non-adaptive baseline

---

### Submodule: Policy Engine

### Purpose

- Enforces safety, pedagogy, UX, privacy, and technical constraints across AI interactions

### Scope

- Applies to all AI calls and data flows

### Key Responsibilities

- Prompt Governance
- Output Validation against JSON Schemas
- Safety Filters
- Pedagogical Compliance
- Privacy and Consent Gates
- Rate and Quota Enforcement

### Inputs

- Context
- Requested Action
- Draft Prompt or Output

### Outputs and Contracts

- Governed Prompt
- Validated Output or Rejection with reason and remediation
- Audit Record

### Components

- Rule Engine
- Schema Validator
- Safety Classifiers
- Prompt Templater
- Redactor
- Rate Limiter

### Policies

- Safety: disallow sexual content, harassment, hate, extremist praise; escalate self-harm appropriately
- Pedagogy: target language, CEFR alignment, feedback style, standard lesson structure
- Privacy: consent-based storage, PII redaction
- Technical: all Orchestrator responses validate against TASK and FEEDBACK schema with token and latency caps

### Data Model

- policy_rules: id, type, version, payload(jsonb), enabled
- policy_audit: id, ts, user_id?, session_id, rule_id, action, meta
- quotas: user_id, window, tool, limit, used

### Algorithms and Flows

- Prompt Governance Flow: draft to headers to limits to model
- Validation Flow: schema to safety to pedagogy to approve or reject and regenerate
- Rate Control: sliding window with backoff

### APIs

- POST /policy/govern_prompt
- POST /policy/validate_output
- POST /policy/redact
- POST /policy/check_quota

### Integration Points

- Orchestrator
- AI Core
- RAG and Data
- Analytics and Observability
- Admin

### Non-Functional Requirements

- Latency under 30 to 50 ms
- Reliability: versioned rulesets
- Security: signed rules and admin-only changes
- Compliance: auditable and exportable

### Acceptance Criteria

- Orchestrator outputs pass schema validation
- Safety filters catch more than 95% test cases with under 2% false positives
- Prompt governance covers three or more flows
- Admin toggles rules with audits visible

---

## Module: AI Core

### Purpose

- Dialogue engine for ASR, NLU, response generation, and TTS for real-time conversation

### Key Responsibilities

- Speech Recognition
- Dialogue Management with pedagogical prompts and structured outputs
- Response Generation
- Speech Synthesis
- Streaming Interaction with barge-in and partials

### Technologies

- LLM and TTS: OpenAI Realtime API
- ASR: Whisper streaming
- Protocols: WebRTC and WebSockets

### Components

- OpenAI Realtime
- Whisper Streaming ASR

### Data Handled

- Audio streams
- Transcripts
- Structured outputs: TASK and FEEDBACK JSON
- Audio responses

### Integration Points

- Client
- Orchestrator
- RAG and Data
- Pronunciation Service

### Non-Functional Requirements

- Latency targets as specified in SLOs
- Reliability: fallback to text mode
- Scalability: concurrent channels per user, horizontal scale
- Safety: governed prompts and validated outputs

---

## Knowledge and Data Layer

### Module: RAG and Data

### Purpose

- Personal memory and pedagogical knowledge base for adaptive lessons

### Key Responsibilities

- Learner Profiles
- Lesson Data
- Personal Memory embeddings
- Pedagogy Knowledge Base
- Support RAG

### Technologies

- Supabase Postgres
- pgvector
- Pedagogy KB
- Storage integration

### Components

- Postgres
- pgvector
- Pedagogy KB

### Data Handled

- Profiles
- Lessons
- Errors
- Vectors
- KB docs

### Integration Points

- Orchestrator
- AI Core
- Analytics
- Pronunciation and SRS

### Non-Functional Requirements

- Vector search under 100 ms
- Scalability for thousands of learners
- Reliability and backups
- Security with RLS
- Compliance with GDPR

---

### Module: Object Storage

### Purpose

- Reliable storage for audio, transcripts, and large binary objects

### Key Responsibilities

- Audio Storage
- Transcript Storage
- Secure Access with signed URLs
- Lifecycle Management
- Integration references

### Technologies

- Supabase Storage
- Signed URLs
- Lifecycle Policies

### Components

- Buckets
- Signed URL Service
- Retention Engine

### Data Handled

- Audio files
- Transcripts
- Metadata

### Integration Points

- Client
- Orchestrator
- RAG and Data
- Analytics

### Non-Functional Requirements

- Signed URL generation under 100 ms
- High durability
- Scalability
- Security and compliance

---

## Learning Services

### Module: Pronunciation Service

### Purpose

- Phonetic and prosodic feedback with objective metrics

### Key Responsibilities

- Phoneme Alignment
- GOP Scoring
- Prosody Analysis
- Feedback Generation
- Integration with lesson feedback JSON

### Technologies

- Forced alignment
- Neural ASR likelihood scoring
- Prosody analysis
- Python, PyTorch, Kaldi or ESPnet

### Components

- Alignment Engine
- Scoring Module
- Prosody Module
- Feedback Formatter

### Data Handled

- Input audio
- Reference text
- Output alignment, GOP, prosody, structured feedback

### Integration Points

- Orchestrator
- Client
- RAG and Data
- Analytics

### Non-Functional Requirements

- Feedback latency under 1.5 s
- Alignment error under 10 ms
- Scalability and security
- Compliance

---

### Module: SRS Scheduler

### Purpose

- Spaced repetition for retention of vocabulary and grammar

### Key Responsibilities

- Interval Scheduling with SM-2 or Leitner
- Adaptive Review
- Content Selection
- Lesson Integration
- Feedback Loop

### Technologies

- SM-2 and Leitner
- Supabase Postgres
- Optional embeddings

### Components

- Review Queue Engine
- Scoring Engine
- Scheduler API
- Data Store

### Data Handled

- SRS Items: user_id, item_id, type, due_at, ease, interval
- Responses
- History

ntegration Points

- Orchestrator
- Client
- RAG and Data
- Analytics

### Non-Functional Requirements

- Serve due items in under 50 ms
- Scalability to millions of items
- Reliability and personalization
- Compliance

---

## Analytics and Evaluation

### Module: Analytics and Events

### Purpose

- Collect, store, and analyze learner progress, lesson quality, and product usage

### Key Responsibilities

- Event Collection
- Progress Tracking
- Product Analytics
- Dashboards and BI
- Data Pipeline

### Technologies

- ClickHouse or BigQuery
- Metabase or Looker
- JSON event schema
- Sentry and OTel

### Components

- Event Schema
- Ingestion Layer
- Warehouse
- Visualization Layer

### Data Handled

- Lesson Events
- User Behavior
- System Metrics
- Aggregated KPIs

### Integration Points

- Client
- Orchestrator
- AI Core and Pronunciation
- SRS Scheduler
- Admin and Ops
- Non-Functional Requirements
- Ingestion latency under 200 ms
- Scalability to millions of events per day
- Reliability: exactly-once or idempotent
- Compliance and security

---

### Module: A/B and Evaluation

### Purpose

- Controlled experiments for prompts, exercises, and pedagogy with rigorous evaluation

### Key Responsibilities

- Experiment Management
- Feature Flagging
- Automated Evaluation with rubrics
- Data-Driven Decisions
- Continuous Improvement

### Technologies

- Unleash or ConfigCat
- Experiment Runner
- Rubric Engine
- Analytics integration

### Components

- Feature Flag Layer
- A/B Runner
- Pedagogical Rubrics

### Data Handled

- Assignments
- Experiment Events
- Scoring Data
- Performance Metrics

### Integration Points

- Client
- Orchestrator
- Analytics
- Admin

### Non-Functional Requirements

- Statistical rigor
- Performance under 20 ms overhead
- Scalability to dozens of experiments
- Transparency and compliance

---

## Platform Services

### Module: Billing

### Purpose

- Payments, subscriptions, and access control

### Key Responsibilities

- Subscription Management
- Entitlement Control
- Metered Billing
- Webhook Processing
- Orchestrator entitlement checks

### Technologies

- Stripe
- Webhook service
- Supabase Postgres
- Usage tracking

### Components

- Stripe Subscriptions
- Webhook to Entitlements
- Metered Usage Tracker

### Data Handled

- User Billing Records
- Entitlements
- Usage Data
- Payment Events

### Integration Points

- Client
- Orchestrator
- Analytics
- Admin

### Non-Functional Requirements

- Webhook idempotency
- Security and PCI compliance
- Scalability
- Availability and latency under 50 ms
- Compliance

---

### Module: Admin

### Purpose

- Tools for content, roles, quotas, and support

### Key Responsibilities

- Content Management
- Role and Quota Management
- Support Console
- Moderation

### Technologies

- React and Next.js
- Supabase and Postgres
- RBAC via Supabase Auth
- Sentry and Analytics integrations

### Components

- Content and Topics Manager
- Flags, Quotas, Roles
- Support Console

### Data Handled

- Content Metadata
- User Roles and Quotas
- Support Data with PII redaction

### Integration Points

- Billing
- RAG and Data
- Analytics
- Observability

### Non-Functional Requirements

- Security: RBAC and MFA
- Reliability 99.9%
- Privacy: GDPR and PII redaction
- Auditability

---

### Module: Privacy and Compliance

### Purpose

- Safeguard data, enforce privacy controls, ensure regulatory compliance

### Key Responsibilities

- Consent Management
- PII Redaction
- Data Rights Management
- Audit and Compliance
- Policy Enforcement

### Technologies

- Consent Manager
- PII detection and redaction pipelines
- RLS and storage lifecycle rules
- Immutable audit logs

### Components

- Consent Manager
- PII Redaction Service
- Data Rights API
- Audit Trail

### Data Handled

- Consents
- User Data
- Requests for DSAR
- Audit Logs

### Integration Points

- Client
- Orchestrator
- Analytics and Events
- Billing
- Admin

### Non-Functional Requirements

- Security
- Performance: exports under 24 hours, deletions under 7 days
- Compliance: GDPR, CCPA, FERPA, ISO
- Transparency
- Reliability

---

## Operations and Reliability

### Module: Observability

### Purpose

- Monitoring, logging, tracing, and uptime verification

### Key Responsibilities

- Error Monitoring
- Tracing
- Uptime Verification
- Alerting
- Diagnostics

### Technologies

- Sentry FE and BE
- OpenTelemetry
- Synthetic testing
- Dashboards with Grafana or Datadog

### Components

- Sentry FE and BE
- OTel Tracing
- Uptime Monitors
- Alerting Engine

### Data Handled

- Error Logs
- Traces
- Synthetic Results
- SLO Metrics

### Integration Points

- Client
- Edge and Orchestrator
- AI Core and Services
- Ops and Admin

### Non-Functional Requirements

- Overhead under 5%
- Monitoring uptime 99.9%
- PII redaction
- Retention per policy
- Scalability

---

### Module: Latency SLOs

### Purpose

- Defines and enforces performance thresholds for natural, real-time experience

### Key Responsibilities

- ASR Latency under 300 ms first token
- LLM Latency under 600 ms first chunk
- TTS Latency under 350 ms onset
- End-to-End latency under about 1.2 seconds

### Technologies

- OTel span timing
- Custom latency probes
- ClickHouse or BigQuery
- Sentry and Ops dashboards

### Components

- ASR Measurement
- LLM Measurement
- TTS Measurement
- Aggregator

### Data Handled

- Latency Metrics
- Aggregates: p50, p95, p99
- Anomalies

### Integration Points

- Orchestrator
- Analytics and Events
- Observability

### Non-Functional Requirements

- Millisecond precision
- 24/7 availability
- Content exclusion from logs
- Scalability

---

## CI and CD and Hosting

### Module: CI and CD and Hosting

### Purpose

- Automates deployment, testing, and delivery across Dev, Staging, and Prod

### Key Responsibilities

- Continuous Integration
- Continuous Delivery
- Preview Environments
- Safe Releases with blue or green and canary
- Deployment Health and rollback

### Technologies

- Vercel or Netlify
- GitHub Actions
- Blue or Green and Canary
- GitHub

### Components

- Build Pipeline
- Deployment Pipeline
- Preview Deployment Engine
- Release Manager

### Data Handled

- Source Code
- Build Artifacts
- Deployment Metadata

### Integration Points

- Client and Orchestrator hosting
- GitHub Actions
- Monitoring and Observability
- Admin and Ops

### Non-Functional Requirements

- Build and deploy in 5 to 10 minutes
- Automatic rollback
- Concurrent deployments
- Security: branch protection, signed commits, secrets
- Compliance: deployment audit logs

---

### Module: Environments

### Purpose

- Separate development, testing, and production contexts

### Key Responsibilities

- Isolation
- Validation
- Release Readiness
- Monitoring

### Technologies

- Vercel or Netlify
- GitHub Actions pipelines
- Sentry, OTel, SLO dashboards
- Synthetic testing

### Components

- Dev Environment
- Staging Environment
- Prod Environment

### Data Handled

- Dev: seed data and mock accounts
- Staging: anonymized or synthetic data
- Prod: real user data and billing

### Integration Points

- CI and CD and Hosting
- Observability
- Admin and Ops
- Privacy and Compliance

### Non-Functional Requirements

- Reliability through isolation
- Performance mirroring in Staging
- Security with restricted Prod access
- Compliance: no Prod data in Dev or Staging
- Scalability

---

## Appendix: Contracts, Schemas, and APIs

### TASK and FEEDBACK JSON

- Produced by LLM
- Validated by Policy Engine and Orchestrator
- Used by Client to render tasks, hints, and feedback

### Planner APIs

- POST /planner/plan
- GET /planner/next?lesson_id=…
- POST /planner/branch
- POST /planner/complete_stage

### Adaptive APIs

- POST /adaptive/observe
- POST /adaptive/recommend
- GET /adaptive/ability?user=…&skill=…
- POST /adaptive/batch_calibrate

### Policy APIs

- POST /policy/govern_prompt
- POST /policy/validate_output
- POST /policy/redact
- POST /policy/check_quota