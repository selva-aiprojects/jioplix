# HIMS Enhancement Roadmap — Implementation Plan

**Scope:** Helpdesk, Analytics, Mobile App, AI Assistant, HRMS, Payroll, Procurement, CRM, Finance, Inventory
**Platform:** Jioplix HIMS (PostgreSQL schema-per-tenant, Express backend, React+Vite web, Flutter mobile)
**Last Updated:** 2026-08-08

---

## 0. Executive Summary & Sequencing

| Priority | Module | Effort | Recommended order |
|---|---|---|---|
| 1 | Helpdesk | Low–Medium | **Phase A** (1–2 wks) |
| 2 | Analytics | Medium | **Phase A** (2–3 wks) |
| 3 | AI Assistant | High | **Phase B** (start with 3 high-ROI use cases, 3–4 wks) |
| 4 | Mobile App | High | **Phase C** (4–6 wks, parallelizable) |
| 5 | HRMS | Medium | **Phase D** (2–3 wks) |
| 6 | Payroll | Low–Medium | **Phase D** (2 wks) |
| 7 | Procurement | Medium | **Phase D** (2–3 wks) |
| 8 | CRM (Patient) | Medium | **Phase E** (2–3 wks) |
| 9 | Finance (Billing) | Medium–High | **Phase E** (3 wks) |
| 10 | Inventory (Pharmacy) | Medium | **Phase E** (2–3 wks) |

**Sequencing rationale:** Helpdesk and Analytics are pure wins — they surface existing data (tickets, metrics) through new screens and need no AI or new platform. AI Assistant must wait for the Analytics layer so its operational queries/alerts read from trusted aggregates. Mobile reuses the same backend endpoints and benefits from the finalized Analytics/AI APIs. **HRMS, Payroll, Procurement (Phase D)** are staffing-and-cost domains built on existing shard data. **CRM, Finance, Inventory (Phase E)** sit on top of the OPD/billing/pharmacy core — Finance consumes the Payroll `doctor-share` driver, Inventory's auto-reorder hooks into Procurement PRs, and CRM's consent/identifier data feeds dedup at registration. Phases D/E can overlap with B/C where backend endpoints are stable.

**Phasing:**
- **Phase A (v14):** Helpdesk + Analytics (operational dashboards + doctor/specialty performance + predictive alerts).
- **Phase B (v15):** AI Assistant — conversational operational queries, discharge summary draft polish, drug-interaction + differential-diagnosis panel.
- **Phase C (v16):** Mobile — Doctor app first, then Nurse, then Admin, then offline capability.
- **Phase D (v17):** HRMS (rosters, credentials, attendance, on-call) → Payroll (incentives, allowances, statutory) → Procurement (rate contracts, auto-PR, GRN+QC, three-way match).
- **Phase E (v18):** CRM (smart scheduling, dedup, referrals/corporate, DPDP consent, family accounts) → Finance (packages, surgery billing, insurance eligibility, GST/e-invoice, payments) → Inventory (indents, narcotics, auto-reorder, expiry/dead-stock analytics).

---

## 1. Cross-Cutting Patterns (read first)

Every new feature in this codebase must follow these established patterns or it will drift from the architecture:

1. **Schema-per-tenant, raw SQL.** Add new tables via a `ensureHelpdeskTables(schemaName)`-style helper in the module (`CREATE TABLE IF NOT EXISTS ...` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`), following `backend\src\modules\hospital\index.js` self-healing DDL pattern. Also append the canonical tables to `backend\src\SHARD_Base_Schema.sql` so new tenants get them at provisioning time.
2. **Route mounting.** New routes go in `backend\src\modules\<module>\index.js` and are mounted in `backend\src\routes\index.js` behind `auth` + `tenant` middleware. Tenant resolution and `req.prisma` come free from `backend\src\middleware\tenant.js`.
3. **RBAC & menus.** Register new permissions in `rbac_permissions` and menus in `rbac_menus` (with `required_plan` gating). The web sidebar is server-driven (`userMenus` from localStorage) — new screens must be added to the label→path mapping in `client\src\modules\tenant\Sidebar.tsx`.
4. **Frontend conventions.** No shared axios instance exists; pages call axios inline with `Authorization` + `x-tenant-id` headers built from localStorage. Follow that convention (or introduce a shared `api.ts` wrapper as a deliberate refactor — do not do half). Toast via `client\src\components\ToastProvider.tsx`.
5. **SQL safety.** Use positional `$1` params (as in nexus tickets) rather than string interpolation. The existing hospital routes interpolate with `s()` escaping — new code should prefer positional params.
6. **Self-healing + reconciliation.** Extend `database\migrations\20260520_reconcile_tenants.sql` (or add a new reconciliation script) to propagate new tables to already-provisioned tenant shards. Add the new tables to the `heal-all-masters` endpoint where relevant.

---

## 2. Module 1 — Helpdesk (Patient Grievance + Internal Ticketing)

**Existing state:** SaaS-level `nexus.support_tickets` (open/support-ticket flow with Resend emails) + `client\src\modules\tenant\support\SupportTicketsPage.tsx` + `client\src\modules\nexus\NexusTicketingPage.tsx`. There is **no per-tenant internal ticket system** with categories, SLAs, escalation, or links to patient/equipment/department.

### 2.1 Data Model (per-tenant schema)

New tables (add to `SHARD_Base_Schema.sql` + ensure-helper):

| Table | Purpose | Key columns |
|---|---|---|
| `helpdesk_tickets` | Master ticket | `ticket_no` (TK-xxxx), `category`, `channel` (INTERNAL/PATIENT_GRIEVANCE), `subject`, `description`, `priority` (LOW/MEDIUM/HIGH/CRITICAL), `status` (OPEN/IN_PROGRESS/PENDING_CUSTOMER/RESOLVED/CLOSED/ESCALATED), `source_id` (patient/equipment/department refs), `source_type` (PATIENT/EQUIPMENT/DEPARTMENT), `reported_by_user_id`, `assigned_user_id`, `department_id`, `sla_due_at`, `escalation_level`, `first_response_at`, `resolved_at`, `closed_at`, `rating`, `attachments` (JSONB urls) |
| `helpdesk_categories` | Ticket category master | `name`, `type` (INTERNAL/PATIENT_GRIEVANCE), `default_priority`, `is_active` |
| `helpdesk_sla_policies` | SLA definitions | `priority`, `response_hours`, `resolution_hours`, `auto_escalate_minutes`, `escalation_email_roles`, `is_active` |
| `helpdesk_escalations` | Escalation audit trail | `ticket_id`, `from_level`, `to_level`, `triggered_at`, `reason`, `assigned_to_user_id` |
| `helpdesk_ticket_notes` | Internal comment thread | `ticket_id`, `user_id`, `body`, `is_internal` (public vs staff-only), `created_at` |
| `helpdesk_equipment` | Equipment registry (new master) | `asset_tag`, `name`, `category`, `department_id`, `status` (OPERATIONAL/FAULTY/UNDER_REPAIR/SCRAPPED), `vendor_id`, `purchase_date`, `warranty_till`, `last_maintenance_at` |

`source_type` + `source_id` gives the "link to patient / equipment / department" requirement without join-table bloat. Patient tickets surface the patient name via a LEFT JOIN on `patients` in queries (respecting `PrivacyValue`/PII rules).

### 2.2 SLA Engine

- **On create:** look up `helpdesk_sla_policies` by priority → set `sla_due_at = now() + resolution_hours`, `first_response_due = now() + response_hours`.
- **On assignment/first note:** set `first_response_at` (guards against silent tickets).
- **Escalation matrix** (seeded data): e.g. CRITICAL/HIGH escalate automatically every `auto_escalate_minutes` to the next level:
  1. Level 1 → assigned agent (SUPPORT role)
  2. Level 2 → department HOD (`users.is_manager`)
  3. Level 3 → hospital ADMIN
  - A `cron`-style sweep runs on each metrics poll (or a lightweight `setInterval` inside the module, as the codebase has no job scheduler) — queries `OPEN/IN_PROGRESS` tickets where `escalation_level < max` and `now() > last_escalated_at + auto_escalate_minutes`, then inserts an escalation row and reassigns. Emails via Resend (reuse `nexus.communication_logs` best-effort pattern).
- **SLA breach flag:** computed on read (or a column refreshed by the sweep): `is_breached`, `breach_minutes`.

### 2.3 API Endpoints (`/api/helpdesk`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/categories` | Category list (grouped INTERNAL/PATIENT_GRIEVANCE) |
| POST/GET | `/tickets` | Create (auto ticket_no, SLA, optional patient link via `source_id`) / list w/ filters (status, priority, category, source_type, assigned_to, date range) + PII masking |
| GET | `/tickets/:id` | Detail + notes + escalation trail + SLA status |
| PATCH | `/tickets/:id` | Status transition, reassign, priority change (recompute SLA), add note |
| POST | `/tickets/:id/notes` | Internal / public reply |
| GET | `/tickets/:id/escalations` | Escalation history |
| GET | `/escalations/pending` | The sweep trigger (called by frontend poll or cron) |
| CRUD | `/equipment` | Equipment registry (status, maintenance) |
| GET | `/analytics` | Ticket volume by category/status/priority, avg first-response & resolution time, SLA breach %, department backlog, grievance trend (feeds Analytics module) |

Reuse: `backend\src\modules\public` `POST /patients/:id/complaints` can gain a mode that creates a `helpdesk_tickets` row with `source_type=PATIENT` (patient-facing grievance intake).

### 2.4 UI Screens (`client\src\modules\tenant\helpdesk\`)

1. **HelpdeskDashboard.tsx** — KPI cards (open tickets, breached, avg response time, per-department backlog) + priority doughnut (ECharts).
2. **TicketList.tsx** — filterable table/cards, SLA countdown badges (color: green/amber/red), quick reassign.
3. **TicketDetail.tsx** — thread, timeline (status/escalation events), linked patient/equipment/department chip, SLA meter, reply box, escalation button.
4. **NewTicketModal.tsx** — category → priority auto-suggest, source picker (Patient MRN lookup / Equipment / Department), description.
5. **EquipmentRegister.tsx** — asset list + status + maintenance history.
6. Add route `/tenant/helpdesk`, sidebar item under "Clinical Administration" (plan-gated professional+ for patient-grievance category; internal ticketing for all plans).

### 2.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| H1 | Tables + ensure-helper + SHARD schema + reconciliation script | 0.5 wk |
| H2 | Ticket CRUD + SLA + escalation sweep + Resend emails + RBAC permissions | 1 wk |
| H3 | Web screens (dashboard, list, detail, equipment) + sidebar | 0.5–1 wk |
| H4 | Grievance intake from public complaint endpoint + analytics endpoint | 0.5 wk |

---

## 3. Module 2 — Analytics (Operational Intelligence)

**Existing state:** `GET /hospital/metrics/stats` and `GET /hospital/metrics/clinical-command-overview` (in `backend\src\modules\hospital\metrics.js`) already return KPIs, predictive complexity, utilization, ward stats, and a 24h ops feed. `client\src\modules\tenant\analytics\ClinicalAnalyticsDashboard.tsx` (admin-only, 30s poll) + `DashboardPage.tsx` + `PharmacyDashboard.tsx` render them. **Gaps:** no live OPD-load page, no real-time bed occupancy board, no pharmacy stock-out risk scoring, no revenue-vs-target tracking (no target configuration), no doctor/specialty performance screens, no push-style predictive alerts.

### 3.1 Config & Data Additions

- **`targets` table** (per-tenant): `period` (MONTHLY/QUARTERLY), `metric` (REVENUE/OPD_COUNT/IPD_COUNT/PHARMACY_SALES), `target_value`, `is_active`. Optional: historical snapshots to show trend-vs-target. Seeded with sensible defaults on provision.
- **`operational_alerts` table**: `alert_type` (BED_SHORTAGE / HIGH_ALOS / EXPIRY_RISK / STOCK_OUT_RISK / REVENUE_GAP), `severity`, `message`, `ref_data` (JSONB: ward_id, medicine_id, etc.), `status` (ACTIVE/ACKNOWLEDGED/RESOLVED), `created_at`. Written by the alert engine, read by the dashboard + chatbot + mobile admin app.
- **`analytics_events`** (optional, lightweight): append-only operational event log (encounter start/end, admission, discharge, dispensing) so new dashboards don't hammer transactional tables. Note: `consultation_events` already exists — reuse for OPD timing before adding a new table.

### 3.2 New API Endpoints (`/api/hospital/analytics`)

| Method | Path | Purpose / source |
|---|---|---|
| GET | `/opd-load` | Live load: waiting counts per doctor, average wait time, doctor availability, in-consultation count, per-hour inflow (from `encounters`, `doctor_status`, `consultation_events`) |
| GET | `/bed-occupancy` | Per-ward occupancy %, free beds, utilization trend, predicted shortage window (from `wards`, `beds`, `ipd_admissions`) |
| GET | `/pharmacy-risk` | Stock-out risk score per medicine = f(stock qty, FEFO batch run-rate from `pharmacy_dispense_items` last 30d), expiring-soon list (`pharmacy_batches.expiry_date`), low-stock items |
| GET | `/revenue` | Actual vs target by period, revenue by bill_type/source_module (`invoices`), collection %, forecast (simple linear projection or AI) |
| GET | `/performance/doctors` | Per-doctor: consultations, avg duration, prescriptions/lab orders per consult, revenue generated, wait time, ALOS for their IPD patients |
| GET | `/performance/specialties` | Same rollup by `specialities` via doctor specialization |
| GET | `/alerts` | Active alerts + `POST /alerts/:id/ack`, `POST /alerts/:id/resolve` |
| POST | `/targets` / PUT `/targets/:id` | Target CRUD |

### 3.3 Predictive Alert Engine

A server-side evaluator (swept on metrics poll or a `setInterval`; same pattern as helpdesk SLA sweep):

1. **Bed shortage:** for each ward, if projected demand (recent admission rate × lead time) ≥ free beds → emit `BED_SHORTAGE` with ward ref.
2. **High ALOS:** per-ward or per-doctor rolling ALOS (`ipd_admissions` discharged last 30d) above specialty threshold → `HIGH_ALOS`.
3. **Expiry risk:** medicines with batches expiring within N days (default 30) and qty > 0 → `EXPIRY_RISK`, grouped per medicine, suggest auto-`is_blocked` on `pharmacy_inwards` after review.
4. **Stock-out risk:** predicted depletion date (stock ÷ avg daily dispense) within reorder horizon → `STOCK_OUT_RISK` (feeds pharmacy + suggestion to create `pharmacy_orders`).
5. **Revenue gap:** month-to-date actual < linear target interpolation by >X% → `REVENUE_GAP`.

Dedupe: only emit if no ACTIVE alert of same type+ref exists. Acknowledge on click.

### 3.4 UI Screens (`client\src\modules\tenant\analytics\`)

1. **OperationsCommandCenter.tsx** (`/tenant/analytics/ops`) — live tiles: OPD load, bed occupancy, pharmacy risk, revenue vs target. Tabs or drill-down panels per domain. Reuse existing ECharts + glassmorphism style from `ClinicalAnalyticsDashboard.tsx`.
2. **PerformanceInsights.tsx** (`/tenant/analytics/performance`) — doctor-wise & specialty-wise leaderboards (tables + bar/line charts), drill into a doctor's metrics; filters by date range. Doctor-scoped users see only their own row (respect RBAC).
3. **AlertCenter.tsx** (`/tenant/analytics/alerts`) — active alert feed with severity color coding, ack/resolve actions, filterable. Optionally integrate into the existing dashboard header as a bell icon.
4. Extend `ClinicalAnalyticsDashboard.tsx` with tabs (Overview / OPD Load / Beds / Pharmacy / Revenue) rather than a second standalone page where feasible.

### 3.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| A1 | `targets` + `operational_alerts` tables, ensure-helper, reconciliation | 0.5 wk |
| A2 | OPD-load + bed-occupancy + pharmacy-risk endpoints | 1 wk |
| A3 | Revenue-vs-target + doctor/specialty performance endpoints | 1 wk |
| A4 | Alert engine (all 5 signals) + ack/resolve | 0.5 wk |
| A5 | Ops command center + performance + alert UI | 1–1.5 wk |

---

## 4. Module 3 — Mobile App (Doctor / Nurse / Admin + Offline)

**Existing state:** Flutter project at `mobile\` with login + biometrics (`mobile\lib\screens`, `mobile\lib\services`), multi-tenant header handling, and an in-progress Clinical Co-pilot. Backend API surface is ready to be consumed. See `docs\Requirements\Mobile_Implementation_Plan_Flutter.md`.

### 4.1 Product Decision — one app, role-driven

Ship **a single Flutter app** (one bundle) that routes to a role-specific home shell after login (Doctor / Nurse / Admin). Rationale: one codebase, shared auth/theme/networking, simpler store listing and provisioning; the web already does role-based UI.

### 4.2 Screens by Role

**Doctor shell** (Phase C1):
- Today list: appointments + IPD rounds (from `/api/appointments`, `/api/hospital/ipd/admissions`).
- Patient timeline: history, vitals, labs, prescriptions (from `/api/patients/:id/timeline`, `/api/hospital/lab/orders`, `/api/hospital/encounters`).
- E-prescription + lab order entry (reuse `/api/hospital/encounters/:id/prescriptions`, `/lab-orders`).
- Lab results viewer (PDF) + critical value notification (poll `/api/hospital/metrics/clinical-command-overview` or a new `/mobile` bundle endpoint).
- AI voice dictation (reuse `/api/consultations/summarize-note`; STT via `speech_to_text` already in build).

**Nurse shell** (Phase C2):
- Task list: pending lab draws, medication administration, vitals entry per IPD patient (new lightweight endpoints `GET/POST /mobile/nurse/tasks`, `POST /api/hospital/ipd/admissions/:id/notes`).
- Bed map + quick vitals (from `/api/hospital/ipd/bedmap`).
- Barcode scan (optional, later): dispense/administration confirmation.

**Admin shell** (Phase C3):
- KPI snapshot + pending approvals (staff leaves approve, pharmacy orders approve, discharge sign-off) — reuse existing endpoints.
- Alert feed (from Analytics `GET /api/hospital/analytics/alerts`).

### 4.3 Offline Capability (Phase C4)

- **Local store:** `Hive` (already chosen) for token cache; `sqflite` or `drift` for structured offline queues (recommend `drift` for relational task/queue data).
- **Sync pattern:** write-through action queue — every mutating action enqueues locally, flushes when online (POST with idempotency key `client_txn_id` column added to server tables: `billing_queue`, `lab_orders`, `prescriptions`, `ipd_notes`). This mirrors the existing `billing_queue` ledger concept.
- **Critical offline screens:** doctor's today list + patient timeline (read cache), nurse vitals entry (queued), admin approvals (view + queue).
- **Read cache TTL:** 5 min default; force-refresh on pull-to-refresh. PHI cleared on logout per existing security doc.

### 4.4 Backend additions for mobile

- `client_txn_id` idempotency column + conflict handling on the write endpoints used by mobile (POST prescriptions, lab-orders, ipd notes, nurse vitals).
- Batch endpoints to reduce round-trips: `GET /api/mobile/doctor-home`, `GET /api/mobile/patient-card/:id` (timeline bundle), `GET /api/mobile/nurse-tasks`, `GET /api/mobile/admin-home`.
- Device registration for push (FCM) — store device tokens per user; the existing metrics/alerts sweep can fire pushes for critical alerts. *(Push infra is a separate sub-milestone; backend just needs a `push_tokens` table + send hook.)*

### 4.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| M1 | Shared mobile foundation: single app shell, role routing, token refresh, theme, error/toast | 1 wk |
| M2 | Doctor app complete (today, patient card, e-Rx, labs, voice summary) | 1.5–2 wks |
| M3 | Nurse app (tasks, vitals, bed map) + idempotency/`client_txn_id` on backend | 1.5 wks |
| M4 | Admin app (KPIs, approvals, alerts) | 1 wk |
| M5 | Offline read cache + write queue + sync UI | 1.5 wks |
| M6 | Push notifications (FCM + `push_tokens` + alert→push hook) | 1 wk |

---

## 5. Module 4 — AI Assistant

**Existing state:** `backend\src\services\aiService.js` (Groq `llama-3.3-70b` + Gemini `1.5-flash`, vision + text), consumers: `/consultations/ai-suggest`, `/summarize-note`, `/ipd/:id/generate-summary`, `/ai/chat` (dashboard chatbot with live stats + text-to-action + MRN lookup), `/lab/upload-external`, `/recruitment/matches`. Web widget: `client\src\components\AIChatbot.tsx` (STT/TTS, attachments, quick actions). Doc: `docs\Requirements\AI_Assistant.md` (Professional tier only).

**Strategic call — start with 3 high-ROI use cases (per the roadmap's Effort Guide):**

### 5.1 Use Case B1 — Conversational operational queries ("Show today's pending high-value claims")

- **Goal:** turn natural language into read-only SQL/aggregate queries over tenant data, returning charts + rows in chat.
- **Design (safe pattern):**
  1. Classify intent server-side. Route to a **safe aggregate API** (the Analytics endpoints from Module 2) for known intents (KPIs, pending claims, low stock, bed status, revenue) — no generative SQL needed for the common 80%.
  2. For open-ended free-text, use a **locked-down generative SQL path**: AI produces SQL against an allow-listed schema (read-only role, `LIMIT`, no DDL, `SELECT` only), executed with a read-only DB user, results summarized by the LLM. Row-level tenant isolation is automatic via `search_path`.
  3. Cap rows returned, strip PHI fields by privacy level before rendering.
- **Schema surface exposed to the model:** `invoices` (status, billed_amount, claim refs), `insurance_claims` (status, sanctioned_amount), `lab_orders` (status), `medicines`/`pharmacy_batches` (stock, expiry), `encounters`/`ipd_admissions` (counts). Table list + column comments become the prompt context.
- **Extend `POST /hospital/ai/chat`** with a tool/action registry: `[chat] → [query_op_metrics | query_sql | take_action (existing)]`; add an `ai_query_audit_log` table (question, generated SQL, execution ok, rows, latency) for HIPAA/audit.

### 5.2 Use Case B2 — Discharge summary draft (polish existing)

- Already implemented in `/ipd/admissions/:id/generate-summary` with template fallback. **Polish:** include average of vitals, chief complaints, medication regimen from prescriptions, pending lab results, follow-up plan; two-click copy into editable draft (`discharge_summaries` already stores drafts + PDF). Add "language style" (concise/full) toggle. Low effort, high demo value.

### 5.3 Use Case B3 — In-consultation clinical panel: differential diagnosis + drug interaction alert

- **Differential diagnosis:** extend `/consultations/ai-suggest` with a structured prompt — symptoms/chief complaints (from `encounters.complaints`), vitals, past disease history (`patients.medical_history`, `diseases` ICD codes) → returns ranked differentials with supporting evidence + suggested labs. Render in the existing AI panel in `OPDConsultationPage.tsx`.
- **Drug interaction:** build a **local static interaction check** first (rules table keyed by drug generic/class, e.g. `drug_interactions` table seeded with top ~50 common interactions + severity), running at prescription time over current regimen (`prescription_items` across recent encounters). Fall back to LLM only for unknown pairs, flagged as AI-suggested (not authoritative). **Never auto-block; always show severity + rationale and let the doctor override.**
- Wire into the OPD prescription tab as a live warning strip when the composed regimen has a matching rule.

### 5.4 Future (Phase B+ / roadmap remainder)

- Smart scheduling suggestions (slot allocation from doctor availability + historical load).
- Stock prediction (auto-refine the Analytics stock-out forecast using ML on `pharmacy_dispense_items`).
- Claim rejection prediction (score `insurance_claims` against historical rejection reasons → flag risky fields before submission).
- These reuse the Analytics endpoint + alert infra; add as AI-scored fields on existing tables.

### 5.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| B1 | Conversational ops: intent routing + safe aggregate queries + audit log + chat UI polish | 1.5–2 wks |
| B2 | Discharge draft polish (vitals/meds/labs/follow-up + style toggle) | 0.5 wk |
| B3 | Differential diagnosis panel + drug interaction rules engine + OPD warnings | 1.5 wks |
| B4 | (Optional) stock prediction + claim rejection prediction | 1–1.5 wks |

---

## 6. Dependencies & Risks

**Dependencies:**
- Analytics endpoints (Module 2) are prerequisites for AI conversational queries (B1) and admin mobile alerts (M4).
- `client_txn_id` idempotency (M3) is a prerequisite for offline write-queue (M5).
- Helpdesk (H2) SLA sweep and Analytics alert engine share the same lightweight server-side sweep pattern — build the sweep helper once (`src\services\sweeper.js`) and reuse.

**Risks & mitigations:**
| Risk | Mitigation |
|---|---|
| Generative SQL safety (B1) | Read-only DB user + allow-list + `SELECT`-only validation + result cap + audit log |
| Multi-tenant sweep timers on serverless (Vercel) | Sweeps run lazily on metrics/API polls + cron; state persisted in tables so sweeps are idempotent |
| No job scheduler | Reuse existing poll-driven patterns; add `vercel.json` cron if push (email/FCM) requires it |
| Offline PHI leakage | Hive/`drift` encrypted store, TTL cache, wipe on logout (aligns with `SECURITY_COMPLIANCE.md`) |
| AI hallucinated clinical advice | All AI clinical outputs labelled "AI-suggested, doctor-verified"; rule-based checks for drug interactions first; HIPAA `ai_query_audit_log` |
| Manual header plumbing in ~30 client files | Optional refactor to a shared axios instance; do it as a standalone task, not mixed into feature PRs |

## 7. Module 5 — HRMS (Rosters, Credentials, Attendance, On-Call)

**Existing state:** `users` (staff incl. `specialization`, `department`, `employment_type`, `is_manager`, `vendor_id`), `departments`, `designations`, `specialities`; doctor scheduling (`doctor_schedules`, `doctor_leaves`, `doctor_overrides`, `doctor_status`); `employee_leaves` (CASUAL/Pending flow with approve endpoint); staff CRUD at `backend\src\modules\hospital\index.js` (`/staff`, `/staff/vendors`, `/staff/leaves`); HR recruitment (`resource_requisitions`, `candidates`, `requisition_matches`). **Gaps:** no structured duty roster, no conflict detection, no attendance clocking, no credential/privilege register, no on-call/emergency duty ledger.

### 7.1 Data Model (per-tenant schema; append to `SHARD_Base_Schema.sql` + ensure-helper)

| Table | Purpose | Key columns |
|---|---|---|
| `duty_shifts` | Shift master | `name` (MORNING/GENERAL/NIGHT/ON_CALL), `start_time`, `end_time`, `is_night_shift`, `allowance_rule_id`, `is_active` |
| `duty_roster` | Published roster rows | `user_id`, `department_id`, `shift_id`, `duty_date`, `start_time`, `end_time`, `role` (DOCTOR/NURSE/…), `status` (DRAFT/PUBLISHED/CONFIRMED/SWAPPED), `conflict_flag`, `conflict_reason`, `created_by` |
| `roster_swaps` | Shift-swap requests | `roster_id`, `requested_by`, `replacement_user_id`, `status` (PENDING/APPROVED/REJECTED), `reason`, `approved_by` |
| `attendance` | Clock-in/out | `user_id`, `duty_date`, `roster_id`, `clock_in`, `clock_out`, `source` (ROSTER/ON_CALL/EMERGENCY), `status`, `work_hours` (computed) |
| `staff_credentials` | Licenses/certificates | `user_id`, `credential_type` (MEDICAL_LICENSE/COURSE/CERTIFICATION), `title`, `issuer`, `number`, `issued_on`, `expiry_date`, `verified`, `document_url` |
| `staff_privileges` | Procedure/speciality rights | `user_id`, `privilege_type` (PROCEDURE/SPECIALITY/DIAGNOSTIC), `name`, `granted_by`, `granted_at`, `revoked_at`, `notes` |
| `on_call_duty` | On-call & emergency ledger | `user_id`, `duty_date`, `start_time`, `end_time`, `type` (ON_CALL/EMERGENCY/STAND-BY), `allowance_rule_id`, `status`, `emergency_calls_answered` |

Reference the existing duty/leave/attendance data where possible: `doctor_leaves`/`doctor_overrides` already capture availability — the roster conflict engine must read them, not duplicate.

### 7.2 Roster & Conflict Detection Engine

- **Generation:** admin picks department + date range → system proposes shifts from `duty_shifts` + `doctor_schedules`; auto-assigns while respecting `doctor_leaves`, `doctor_overrides`, and prior `duty_roster` entries.
- **Conflict detection (on save/generate):** flag rows where (1) user already rostered on that date/time window (`duty_roster` overlap), (2) user has approved leave (`employee_leaves`/`doctor_leaves`), (3) user already has an overlapping `on_call_duty`, (4) total hours in a rolling 7-day window exceed a configurable cap. Store `conflict_flag` + `conflict_reason`; refuse to publish while unresolved unless an admin overrides (`force=true`).
- **Attendance linkage:** clock-in validates the user has a roster entry or on-call duty for that day (or records `EMERGENCY` / `MISSING_ROSTER`); work hours = clock_out − clock_in, consumed by Payroll.
- **Leave↔roster:** on leave approval, flag any overlapping published roster rows `conflict_flag=TRUE` and prompt reassignment (sweeper-assisted).

### 7.3 API Endpoints (`/api/hospital/hrms`)

| Method | Path | Purpose |
|---|---|---|
| CRUD | `/shifts` | Shift master |
| GET/POST | `/roster` | List / generate (with conflict scan) |
| PATCH | `/roster/:id` | Update row (re-run conflict check) |
| POST | `/roster/:id/swap` | Swap request; `POST /roster/:id/swap/:swapId/approve` |
| POST | `/roster/publish` | Publish draft; blocks on unresolved conflicts unless `force=true` |
| GET | `/roster/conflicts` | All flagged rows with reasons |
| POST/GET | `/attendance` | Clock-in/out + list; `GET /attendance/summary/:userId` (hours by period) |
| CRUD | `/credentials` | Credential register (expiry warnings surfaced to Analytics alerts) |
| CRUD | `/privileges` | Procedure/speciality rights per user |
| POST/GET | `/on-call` | On-call duty ledger + `GET /on-call/today` |
| GET | `/duty-load/:userId` | Rolling hours + conflict status (feeds mobile doctor app + Payroll) |

RBAC: new permissions `HRMS_MANAGE` (admin/HR), `ROSTER_VIEW` (nurses see own), doctors see own `duty-load`.

### 7.4 UI Screens (`client\src\modules\tenant\hrms\`)

1. **RosterCalendar.tsx** (`/tenant/hrms/roster`) — weekly/monthly calendar grid by department; conflict badges; swap modal; publish flow.
2. **ShiftManagement.tsx** — shift master + allowance-rule binding.
3. **AttendanceLog.tsx** — clock-in/out grid, hours, exceptions (missing/emergency).
4. **CredentialRegister.tsx** — per-doctor licenses with expiry countdown + verify toggle.
5. **PrivilegesMatrix.tsx** — doctor × procedure matrix with grant/revoke.
6. **OnCallBoard.tsx** (`/tenant/hrms/on-call`) — tonight's on-call + emergency duty assignment.
7. Sidebar: new "Human Resources" section under System Administration (professional+ plan for roster; all plans for attendance/credentials).

### 7.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| R1 | Tables + ensure-helper + SHARD + reconciliation | 0.5 wk |
| R2 | Roster engine + conflict detection + publish/swap | 1 wk |
| R3 | Attendance + leave linkage + credentials/privileges | 0.5–1 wk |
| R4 | On-call ledger + UI screens + RBAC menus | 1 wk |

---

## 8. Module 6 — Payroll (Incentives, Allowances, Statutory)

**Existing state:** `users` (doctor/staff with `is_manager`, `employment_type`), billing attribution chain `billing_queue` (per-line `source_module`/`source_id`) → `invoices`/`invoice_items` (amount, tax) → encounters carry `doctor_id`; `invoice_items.source_queue_id` links back. Pharmacy dispensing also pushes `billing_queue` rows. **Gaps:** no incentive computation, no allowance rules, no payroll runs, no statutory (PF/ESI/professional tax) config, no payslip output.

### 8.1 Data Model (per-tenant)

| Table | Purpose | Key columns |
|---|---|---|
| `payroll_rules` | Incentive & allowance rule engine | `rule_type` (INCENTIVE_PERCENT/NIGHT_DUTY_ALLOWANCE/EMERGENCY_ALLOWANCE/ON_CALL_ALLOWANCE), `apply_to` (DOCTOR/STAFF/ROLE), `role` (NULL=all), `rate` (percent or fixed), `base` (CONSULTATION_FEE/GROSS_BILLING/COLLECTED_AMOUNT), `is_active` |
| `payroll_runs` | Monthly run header | `period_start`, `period_end`, `status` (DRAFT/RUNNING/LOCKED/PAID), `computed_by`, `locked_at`, `summary` JSONB |
| `payroll_items` | Per-employee earnings | `payroll_run_id`, `user_id`, `base_pay`, `incentive_amount`, `incentive_detail` JSONB, `night_allowance`, `emergency_allowance`, `on_call_allowance`, `deductions` JSONB, `gross`, `net`, `payslip_pdf_path` |
| `payroll_statutory` | Hospital-specific statutory config | `statutory_type` (PF/ESI/PT), `enabled`, `employee_rate` NUMERIC, `employer_rate` NUMERIC, `threshold_amount`, `ceiling_amount`, `is_active` |
| `payroll_slip_items` | Itemized payslip lines | `payroll_item_id`, `head`, `type` (EARNING/DEDUCTION), `amount` |

### 8.2 Computation Engine

1. **Doctor incentive/share** (core promise, Low effort): per doctor, per period, sum billable amounts attributed to their encounters via `billing_queue`/`invoice_items` (PAID invoices by default, configurable), grouped by source module, then apply `payroll_rules` incentive percent (e.g. 30% of consultation fee, 10% of procedure gross). Persist `incentive_detail` (per-line breakdown) for audit.
2. **Allowances:** `NIGHT_DUTY_ALLOWANCE`/`EMERGENCY_ALLOWANCE`/`ON_CALL_ALLOWANCE` computed from `attendance` + `on_call_duty` rows in the period (per-shift rate × count), using the `allowance_rule_id` bound on `duty_shifts`.
3. **Statutory:** apply `payroll_statutory` rules in order — PF (threshold + ceiling), ESI (employee/employer split), professional tax (state slab via `threshold_amount`) — hospital-specific, not hardcoded.
4. **Run lifecycle:** DRAFT → calculate → LOCKED (immutable snapshot) → PAID; re-runs only in DRAFT. Payslip via `pdfService` (existing pattern) stored on `payroll_items`.
5. **Audit:** every computed line references its source (`billing_queue.id` / `attendance.id` / `on_call_duty.id`) so amounts are traceable.

### 8.3 API Endpoints (`/api/hospital/payroll`)

| Method | Path | Purpose |
|---|---|---|
| CRUD | `/rules` | Incentive/allowance rule engine |
| CRUD | `/statutory` | PF/ESI/PT config per hospital |
| POST/GET | `/runs` | Create DRAFT run (period) / list |
| POST | `/runs/:id/calculate` | Compute all `payroll_items` + `incentive_detail` |
| GET | `/runs/:id/items` | Per-employee breakdown (expandable per line) |
| POST | `/runs/:id/lock`, `/runs/:id/pay` | Lifecycle transitions |
| GET | `/runs/:id/payslip/:userId` | PDF payslip |
| GET | `/doctor-share/:userId` | Live month-to-date incentive preview (pre-run) |
| POST | `/drivers/sync-billing` | Recompute attribution from `billing_queue`/`invoices` (idempotent per run period) |

### 8.4 UI Screens (`client\src\modules\tenant\payroll\`)

1. **PayrollDashboard.tsx** (`/tenant/payroll`) — run list, status badges, totals, statutory exposure summary.
2. **RulesConfig.tsx** — incentive % per role/speciality + allowance rates (tabbed).
3. **StatutoryConfig.tsx** — PF/ESI/PT sliders + thresholds (hospital-specific).
4. **RunDetail.tsx** — employee table (gross/net/allowances), drill into one doctor's `incentive_detail` (billing-attributed lines), lock/approve buttons.
5. **PayslipView.tsx** — printable/PDF payslip modal.
6. Sidebar: "Payroll & Compliance" under Finance & Revenue (professional+ plan).

### 8.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| P1 | Tables + ensure-helper + SHARD + reconciliation | 0.5 wk |
| P2 | Billing attribution driver + incentive engine (`doctor-share`) | 0.5–1 wk |
| P3 | Allowances from attendance/on-call + run lifecycle + payslip PDF | 0.5–1 wk |
| P4 | Statutory config + UI screens + RBAC menus | 0.5–1 wk |

---

## 9. Module 7 — Procurement (Rate Contracts, Auto-PR, GRN+QC, Three-Way Match)

**Existing state:** `suppliers` (pharmacy supplier registry + `/masters/suppliers` hub), `medicines` (with stock levels), `pharmacy_inwards` (GRN-style inward receipt with `batch_number`, `expiry_date`, `is_blocked`), `pharmacy_orders` (simple replenishment order — single-line, `status` Ordered/Received, no PO numbering, no QC, no match). **Gaps:** no vendor rate contracts or price comparison, no reorder-level auto PR, no quality-check/quarantine workflow, no three-way match (PO–GRN–Invoice), no multi-line POs.

### 9.1 Data Model (per-tenant)

| Table | Purpose | Key columns |
|---|---|---|
| `vendor_rate_contracts` | Rate agreement per supplier+item | `supplier_id`, `item_type` (MEDICINE/SERVICE/EQUIPMENT), `item_id`, `item_name`, `rate`, `currency`, `effective_from`, `effective_to`, `is_current`, `terms` TEXT |
| `purchase_requisitions` | PR header | `pr_no`, `source_module` (PHARMACY/STORES/…), `status` (DRAFT/APPROVED/CONVERTED/REJECTED), `requested_by`, `requested_at`, `priority` |
| `purchase_requisition_items` | PR lines | `requisition_id`, `item_type`, `item_id`, `item_name`, `required_qty`, `suggested_qty` (from reorder calc), `current_stock`, `reorder_level` |
| `purchase_orders` | PO header (supersedes `pharmacy_orders` for procurement flow) | `po_no`, `supplier_id`, `status` (DRAFT/SENT/APPROVED/PARTIAL/RECEIVED/CLOSED/CANCELLED), `order_date`, `expected_delivery`, `total_amount`, `created_by` |
| `purchase_order_items` | PO lines | `po_id`, `item_type`, `item_id`, `item_name`, `qty_ordered`, `unit_rate`, `amount`, `received_qty` |
| `grn` | Goods receipt header | `grn_no`, `po_id`, `supplier_id`, `received_at`, `invoice_ref`, `status` (DRAFT/UNDER_QC/APPROVED/REJECTED/QUARANTINED) |
| `grn_items` | GRN lines with quality check | `grn_id`, `po_item_id`, `item_id`, `qty_received`, `qty_accepted`, `qty_rejected`, `batch_number`, `expiry_date`, `qc_result` (PASS/FAIL/QUARANTINE), `qc_notes` |
| `procurement_matching` | Three-way match log | `po_id`, `grn_id`, `invoice_ref`, `match_status` (MATCHED/QUANTITY_MISMATCH/PRICE_MISMATCH/NO_INVOICE), `po_amount`, `grn_amount`, `invoice_amount`, `matched_at` |

For inventory, `pharmacy_inwards` remains the stock-ledger write target — GRN approval auto-inserts the accepted lines into `pharmacy_inwards` (reusing its FEFO/batch/expiry handling), so the existing dispensing/billing path is untouched.

### 9.2 Engine Logic

1. **Auto-PR from reorder levels:** a sweep (reuse the Phase-A sweeper) scans `medicines` where `stock_quantity <= reorder_level` and no open PR/PO covers the item → creates `purchase_requisitions` with `suggested_qty` (reorder_qty − stock, min qty). Supplier suggested from the item's cheapest current `vendor_rate_contract`.
2. **Vendor rate comparison:** `GET /vendor-rates/compare` returns per item all current contracts sorted by rate with validity + historical rate trend (enables "Vendor A vs B" at PO time).
3. **PO → GRN:** PO lines receive against a GRN; each line records `qty_accepted`/`qty_rejected`; QC outcome gates stock entry (`qc_result=PASS` → update stock; `FAIL` → quarantine; `QUARANTINE` → hold, matching `pharmacy_inwards.is_blocked` semantics).
4. **Three-way match:** on GRN approval, compare PO line rate/qty vs GRN accepted vs supplier invoice (`invoice_ref` at GRN entry, or `pharmacy_inwards.invoice_number` for legacy receipts). Emit `procurement_matching` rows; `MATCHED` closes the PO line; mismatches flag the PO for Accounts approval (and can surface as an Analytics alert).

### 9.3 API Endpoints (`/api/hospital/procurement`)

| Method | Path | Purpose |
|---|---|---|
| CRUD | `/rate-contracts` (+ `/rate-contracts/compare?item=`) | Vendor rate agreements + comparison |
| POST/GET | `/requisitions` (+ `POST /requisitions/generate`) | Reorder-triggered PR creation |
| POST | `/requisitions/:id/convert` | PR → PO (auto-pick best vendor contract) |
| CRUD | `/purchase-orders` (+ `/purchase-orders/:id/items`) | Multi-line PO lifecycle |
| POST | `/purchase-orders/:id/receive` | Create GRN from PO |
| POST/GET | `/grn` (+ `/grn/:id/qc`) | GRN + quality check; approve→stock |
| POST | `/grn/:id/match` | Run three-way match |
| GET | `/matches` | Matching ledger + exceptions |

RBAC: `PROCUREMENT_MANAGE` (admin/purchase), `PROCUREMENT_APPROVE` (accounts for three-way match exceptions).

### 9.4 UI Screens (`client\src\modules\tenant\procurement\`)

1. **ProcurementDashboard.tsx** (`/tenant/procurement`) — PR/PO/GRN counts, pending QC, matching exceptions, spend by supplier (ECharts).
2. **RateContracts.tsx** — contract registry + item comparison table (rate, validity, supplier).
3. **RequisitionsPage.tsx** — auto-generated PR list (source: reorder), approve/convert to PO.
4. **PurchaseOrdersPage.tsx** — multi-line PO wizard (vendor picker w/ rate comparison), status timeline.
5. **GRNPage.tsx** — receipt screen with per-line QC (accept/reject/quarantine) + batch/expiry.
6. **ThreeWayMatchPage.tsx** — PO–GRN–Invoice reconciliation board with exception list.
7. Sidebar: "Procurement & Supply Chain" under Finance & Revenue (professional+ plan).

### 9.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| G1 | Tables + ensure-helper + SHARD + reconciliation + reorder sweep | 0.5–1 wk |
| G2 | Rate contracts + comparison + PR/PO lifecycle | 0.5–1 wk |
| G3 | GRN + QC/quarantine + stock integration via `pharmacy_inwards` | 0.5–1 wk |
| G4 | Three-way match + UI screens + RBAC menus | 0.5–1 wk |

---

## 10. Module 8 — CRM (Patient) — Scheduling, Dedup, Referrals, Consent, Family

**Existing state:** `patients` (`mrn`, name, phone, guardian, medical_history, allergies, `ai_summary`, plus ABHA columns added dynamically); `/api/patients` search/pagination/timeline; ABHA/ABDM module (Aadhaar OTP, UHID discovery, consent via PHR/Aarogya Setu); `appointments` (patient_id, doctor_id, appointment_time, status — single doctor, no location/token); `doctor_availability` + `doctor_schedules` (already carry `location`, `slot_duration`, `consultation_type`); `patient_insurance`/`insurance_patient_mapping` (policy mapping); `visits`. **Gaps:** no multi-doctor/multi-location slot engine with token+time hybrid, no smart dedup (Aadhaar/mobile/UHID), no referral or corporate/TPA account handling, no DPDP consent register, no family/linked accounts.

### 10.1 Data Model (per-tenant; append to `SHARD_Base_Schema.sql` + ensure-helper)

| Table | Purpose | Key columns |
|---|---|---|
| `patient_identifiers` | Alternate identities for dedup/verification | `patient_id`, `id_type` (AADHAAR/MOBILE/UHID/ABHA/PAN), `id_value` (Aadhaar hashed/masked), `is_primary`, `verified`, `verified_at` |
| `patient_duplicates` | Dedup match queue | `patient_id`, `duplicate_of_id`, `match_score`, `matched_rules` JSONB, `status` (PENDING/MERGED/DISMISSED), `merged_by`, `merged_at` |
| `patient_groups` | Family/group account header | `group_name`, `primary_patient_id`, `billing_account_id`, `created_by` |
| `patient_links` | Family member links | `group_id`, `patient_id`, `link_type` (SELF/SPOUSE/CHILD/PARENT/SIBLING/GUARDIAN), `is_primary`, `created_by` |
| `patient_consents` | DPDP-ready consent register | `patient_id`, `consent_type` (MARKETING/HEALTH_DATA_SHARING/RESEARCH/ABDM), `scope` JSONB, `status` (GRANTED/REVOKED/EXPIRED), `granted_at`, `revoked_at`, `evidence` (OTP/ESIGN/IN_PERSON), `version` |
| `referrals` | Referral tracking | `patient_id`, `referring_doctor_id`, `referred_to_doctor_id`, `external_source`, `reason`, `status`, `referred_on`, `commission_rate` |
| `corporate_accounts` | Corporate / TPA / employer billing accounts | `name`, `type` (CORPORATE/TPA/EMPLOYER/GOVT), `provider_id`, `contract_terms` JSONB, `credit_limit`, `is_active` |
| `appointment_slots` | Multi-doctor, multi-location slot ledger | `doctor_id`, `schedule_rule_id`, `location`, `slot_start`, `slot_end`, `mode` (TIME/TOKEN/HYBRID), `token_number`, `appointment_id`, `status` (FREE/HELD/BOOKED/CANCELLED), `unique(doctor_id, slot_start)` |

Also `ALTER appointments ADD location VARCHAR(255), token_number INT, schedule_rule_id UUID` so existing rows stay compatible.

### 10.2 Engines

1. **Smart scheduling (multi-doctor, multi-location, token+time hybrid):** generate slot rows from `doctor_schedules` (slot_duration × location). `mode=TIME` = fixed appointment time; `TOKEN` = sequential token per doctor/day; `HYBRID` = token groups within a time window (e.g. tokens 1–10 → 9:00–9:30). Slot availability matrix endpoint returns the nearest free slot across all requested doctors/locations. Booking inserts into `appointment_slots` (unique constraint prevents double-book) and sets token. Conflict-guard against HRMS roster (`duty_roster`) and `doctor_status` (available/delay).
2. **Smart dedup:** on registration (and nightly sweep), score the new patient against `patient_identifiers` + `patients` (exact Aadhaar/mobile/UHID = high confidence; name+DOB+phone fuzzy = medium). Write `patient_duplicates`, show a merge wizard to front-desk (PII-masked per HIPAA rules); merge = consolidate records into the canonical patient, repoint `encounters/appointments/invoices`.
3. **Referral & corporate handling:** `referrals` captures source doctor + target + commission; `corporate_accounts` gives a billing account (`billing_account_id`) usable by Finance for credit-limit-driven invoicing and TPA claim routing.
4. **DPDP consent:** `patient_consents` register with granted/revoked lifecycle, evidence capture, and an export endpoint (per-patient consent audit) — satisfied via UI and by ABHA flow where available.

### 10.3 API Endpoints (`/api/crm` + extend existing)

| Method | Path | Purpose |
|---|---|---|
| GET | `/slots/availability?doctors=&location=&date=` | Multi-doctor availability matrix (token+time) |
| POST | `/slots/hold` / `/slots/book` | Hold then confirm slot (prevents double-book) |
| GET | `/token-board/:doctorId/:date` | Live token display (kiosk) |
| POST | `/patients/deduplicate` | Run dedup score against registry |
| GET | `/patients/duplicates` / POST `/patients/merge` | Review + merge queue |
| CRUD | `/identifiers` | Aadhaar/mobile/UHID with verification |
| CRUD | `/groups`, `/links` | Family/group accounts |
| CRUD | `/consents` (+ GET `/consents/export/:patientId`) | DPDP register + audit export |
| CRUD | `/referrals`, `/corporate` | Referral tracker + corporate/TPA accounts |

### 10.4 UI Screens (`client\src\modules\tenant\crm\`)

1. **SlotBoard.tsx** (`/tenant/crm/slots`) — multi-doctor/location availability grid; hybrid token+time columns; hold/confirm.
2. **TokenDisplay.tsx** — kiosk/board view for the OPD queue (reuses OPDQueue data).
3. **RegistrationDedup.tsx** — extended `OPDRegistrationPage` with live duplicate alert + merge wizard.
4. **FamilyAccounts.tsx** — group list + linked member tree + billing account chip.
5. **ConsentCentre.tsx** — per-patient consent matrix, grant/revoke, export.
6. **ReferralTracker.tsx** + **CorporateAccounts.tsx**.
7. Sidebar: "Patient CRM" section under Clinical Administration (professional+ for slots/consent; dedup for all plans).

### 10.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| C1 | Tables + ensure-helper + SHARD + reconciliation | 0.5 wk |
| C2 | Slot engine (multi-doctor/location, token+time) + token board | 1 wk |
| C3 | Dedup scoring + merge wizard + identifiers | 0.5–1 wk |
| C4 | Referrals + corporate accounts + consent register + family accounts | 0.5–1 wk |
| C5 | UI screens + RBAC menus | 0.5–1 wk |

---

## 11. Module 9 — Finance (Billing) — Packages, Surgery Billing, Insurance, GST, Payments

**Existing state:** `billing_queue` (per-line `source_module`/`source_id`, tax, discountable), `invoices`/`invoice_items` (tax_percent, discount_amount, insurance split, status), `payments` (amount, payment_mode), insurance module (`providers`, `plans`, `claims`, `patient_insurance`, eligibility guardrails that deduct `remaining_limit` at billing), `treatments` master (`price`, `cpt_code`), `bed_category_rates`. **Gaps:** no package/surgery component billing, no real-time insurance/TPA eligibility + claim status tracking, no GSTIN/e-invoice (IRN) flow, no advance/refund/write-off/partial-payment ledger, no visible doctor-share report (Payroll P2 computes it — Finance just surfaces it).

### 11.1 Data Model (per-tenant)

| Table | Purpose | Key columns |
|---|---|---|
| `billing_packages` | Package header | `package_code`, `name`, `category`, `base_price`, `discount_percent`, `hsn_code`, `is_active` |
| `billing_package_components` | Package component breakdown | `package_id`, `item_type` (SERVICE/DIAGNOSTIC/MEDICINE/ROOM), `item_id`, `qty`, `unit_price`, `tax_percent`, `discount_amount` |
| `surgery_cases` | OT/surgery billing case | `case_no`, `patient_id`, `encounter_id`, `procedure_id` (treatments), `surgeon_id`, `anesthetist_id`, `ot_start/ot_end`, `status`, `gross_charge` |
| `surgery_components` | OT consumables/services | `case_id`, `item_type`, `item_id`, `qty`, `unit_price`, `tax_percent` |
| `invoice_advances` | Advance ledger | `patient_id`, `encounter_id`, `amount`, `payment_mode`, `balance`, `allocated_to_invoice_id`, `status` |
| `invoice_refunds` | Refund records | `invoice_id`, `amount`, `reason`, `payment_mode`, `approved_by`, `refunded_at` |
| `invoice_writeoffs` | Write-off records | `invoice_id`, `amount`, `reason`, `approval_level`, `approved_by`, `status` |
| `gst_invoices` | GST/e-invoice (IRN) register | `invoice_id`, `gstin`, `place_of_supply`, `hsn_summary` JSONB, `irn`, `irn_status` (PENDING/GENERATED/IRP_ERROR), `qr_code`, `signed_json` TEXT |
| `insurance_claim_tracking` | Real-time claim status trail | `claim_id`, `provider_status` (SUBMITTED/ACKNOWLEDGED/PROCESSING/APPROVED/REJECTED/PAID), `status_date`, `remarks`, `updated_by` |

### 11.2 Engine Logic

1. **Package & surgery billing with auto component breakdown:** selecting a package expands `billing_package_components` into `billing_queue` lines (pre-negotiated prices/discounts), supports add-ons, and recomputes tax per component. Surgery: `surgery_cases` → OT charge + consumables + surgeon/anesthetist shares (feeds Payroll `doctor-share`) → one consolidated invoice (or split as configured).
2. **Real-time insurance/TPA eligibility + claim tracking:** extend existing `remaining_limit` guardrails with a live eligibility check endpoint (TPA provider API or cached rule-based with sandbox mode, mirroring the ABHA demo toggle); every claim status change appends to `insurance_claim_tracking`; status visible on the invoice and to the mobile admin app.
3. **GST + e-invoice compliance:** GSTIN config per tenant (`tenant_sensitive_settings`), HSN on masters (`medicines`, `services`, `diagnostics`, `treatments`), slab auto-select by HSN/category; e-invoice via IRP (IRN generation) with an API endpoint + sandbox mode; QR/signed JSON stored on `gst_invoices`.
4. **Advance / refund / write-off / partial payment:** advances credited to an advance ledger, applied to invoices (partial or full), balance tracked; refunds and write-offs require approval and are audit-logged; payments table extended to reference advance application. All flows emit `audit_logs` entries (HIPAA + financial audit).
5. **Doctor share:** surface `Payroll` P2 `incentive_detail` as a Finance report (per doctor per period) — no recomputation here, single source of truth.

### 11.3 API Endpoints (`/api/billing` extensions + `/api/finance`)

| Method | Path | Purpose |
|---|---|---|
| CRUD | `/packages`, `/packages/:id/components` | Package master + breakdown |
| POST | `/package-bill` | Expand package → billing_queue + invoice |
| CRUD | `/surgery/cases`; POST `/surgery/:id/bill` | Surgery case + OT billing |
| POST/GET | `/advances`, POST `/advances/:id/apply` | Advance ledger |
| POST | `/refunds`, POST `/writeoffs` (+ approval endpoints) | Refund/write-off workflow |
| GET/PUT | `/gst/config`; POST `/einvoice/:id/generate` | GST config + IRN generation (sandbox) |
| GET | `/insurance/eligibility?patientId=&planId=`; POST `/claims/:id/status` | Live eligibility + status trail |
| GET | `/doctor-share-report?period=` | Read-only view of Payroll incentive detail |

### 11.4 UI Screens (`client\src\modules\tenant\billing\` extensions)

1. **PackageCatalog.tsx** — package cards with auto-expanded component preview.
2. **SurgeryBilling.tsx** (`/tenant/billing/surgery`) — OT case + component breakdown + shares.
3. **PaymentsLedger.tsx** — advances/refunds/write-offs with approval workflow (tabs).
4. **GSTEInvoice.tsx** — GST config, e-invoice status, IRN/QR download.
5. **InsuranceClaimTracker.tsx** — claim pipeline (submitted→paid) with status trail.
6. **DoctorShareReport.tsx** — period drill-down (from Payroll P2).
7. Extend sidebar Finance & Revenue section with these (professional+ plan).

### 11.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| F1 | Tables + ensure-helper + SHARD + reconciliation | 0.5 wk |
| F2 | Package + surgery component billing engine | 1 wk |
| F3 | Advance/refund/write-off/partial payment workflow + audit | 0.5–1 wk |
| F4 | GST config + e-invoice (IRN) sandbox + HSN on masters | 0.5–1 wk |
| F5 | Insurance eligibility + claim status tracking + UI | 0.5–1 wk |

---

## 12. Module 10 — Inventory (Pharmacy) — Indents, Narcotics, Auto-Reorder, Analytics

**Existing state:** `medicines` (stock_quantity, batch_number, expiry_date, unit_price, is_active — **no reorder columns**), `pharmacy_inwards` (batch/expiry, `is_blocked`), `pharmacy_batches`, `pharmacy_dispenses`/`pharmacy_dispense_items`, `pharmacy_orders`, `drug_categories/generics/brands`, `suppliers`; stock Critical/Low visual alerts; FEFO batch decrement at dispense; PharmacyDashboard + CSV import/export. **Gaps:** ward/OT/ICU indent & issue workflow, narcotic & Schedule-H register, consumption-linked auto-reorder, near-expiry & dead-stock analytics (Alert engine in Analytics A4 partially covers expiry — this module makes it operational).

### 12.1 Data Model (per-tenant; `ALTER` existing + new tables)

- **`medicines` +columns:** `reorder_level`, `reorder_qty`, `min_stock_qty`, `is_narcotic BOOLEAN DEFAULT FALSE`, `schedule VARCHAR(10)` (H/X/G/…), `hsn_code`, `unit_price` (exists).
- **`drug_categories` +column:** `schedule VARCHAR(10)` default NULL (Schedule H grouping).
- New tables:

| Table | Purpose | Key columns |
|---|---|---|
| `indents` | Ward/OT/ICU indent header | `indent_no`, `requesting_dept` (ward/OT/ICU), `requested_by`, `status` (PENDING/ISSUED/PARTIAL/REJECTED), `requested_at`, `issued_at` |
| `indent_items` | Indent lines | `indent_id`, `medicine_id`, `requested_qty`, `issued_qty`, `batch_id`, `remarks` |
| `pharmacy_issues` / `issue_items` | Issue dispatch | `issue_no`, `indent_id`, `dept`, `issued_by`, `issued_at`, lines with `batch_id`, `qty`, `cost_price` |
| `narcotic_register` | Controlled drug ledger | `patient_id`, `medicine_id`, `batch_id`, `qty`, `dispense_id`/`issue_id`, `administering_user_id`, `witness_user_id`, `balance_after`, `purpose`, `created_at` |
| `reorder_logs` | Auto-reorder trigger audit | `medicine_id`, `current_stock`, `reorder_point`, `suggested_qty`, `source` (MANUAL/CONSUMPTION), `pr_id` (Procurement link), `created_at` |

### 12.2 Engine Logic

1. **FEFO + auto-alerts:** FEFO already enforced at dispense; extend with per-batch expiry alerts (batch → `EXPIRY_RISK` in Analytics A4) and hard-block near-expiry `pharmacy_batches` from auto-dispense after review.
2. **Ward/OT/ICU indent & issue:** ward requisitions → approval → issue from FEFO batches → decrement `pharmacy_batches`/`medicines.stock_quantity` → record `pharmacy_issues`; chargeable issues push a `billing_queue` line (source_module=PHARMACY_ISSUE). Partial issue support.
3. **Narcotic & Schedule-H tracking:** any dispense/issue of `is_narcotic=TRUE` or `schedule IN (H,X)` requires an administering user + witness, posts `balance_after` (batch qty after decrement) to `narcotic_register`, and is immutable (append-only) for regulatory audit.
4. **Auto-reorder linked to consumption:** consumption rate = rolling 30/90-day `pharmacy_dispense_items` (per medicine); reorder point = daily rate × lead-time days (+ safety stock); when stock ≤ reorder point, write `reorder_logs` and call Procurement `POST /requisitions/generate` (cross-module hook) with `suggested_qty`. Manual config via `reorder_level/reorder_qty` overrides.
5. **Expiry & dead-stock analytics:** near-expiry = batches with `expiry_date` within 30/60/90 days (already alerted); dead-stock = `stock_quantity > 0` AND no dispense/issue in last N days (default 90) — surfaced as reports + `operational_alerts` (Analytics A4), auto-suggest write-off or return to supplier.

### 12.3 API Endpoints (`/api/hospital/pharmacy` extensions)

| Method | Path | Purpose |
|---|---|---|
| CRUD | `/indents`; POST `/indents/:id/approve`; POST `/indents/:id/issue` | Indent lifecycle |
| GET | `/issues` | Issue ledger |
| CRUD | `/narcotics`; GET `/narcotics/register?date=` | Controlled drug register + audit query |
| GET/PUT | `/reorder/config`; POST `/reorder/run` | Reorder points + consumption-triggered run |
| GET | `/analytics/expiry`; GET `/analytics/deadstock` | Near-expiry & dead-stock reports |
| GET | `/analytics/consumption` | Per-medicine consumption trend (feeds AI stock prediction) |

### 12.4 UI Screens (`client\src\modules\tenant\pharmacy\` extensions)

1. **IndentBoard.tsx** (`/tenant/pharmacy/indents`) — pending indent queue + approve/issue.
2. **IssueDesk.tsx** — FEFO batch picker, partial issue, billing linkage.
3. **NarcoticRegister.tsx** — controlled-drug searchable register with witness + balance-after.
4. **ReorderConfig.tsx** — per-medicine reorder level/qty + consumption preview.
5. **ExpiryDeadstock.tsx** — expiry countdown + dead-stock tables with actions.
6. Extend PharmacyDashboard tabs; sidebar item "Indents & Issues" under Diagnostic/Pharmacy group (professional+ plan).

### 12.5 Milestones & Effort

| Milestone | Deliverable | Est. |
|---|---|---|
| I1 | `medicines`/`drug_categories` ALTERs + new tables + ensure-helper + reconciliation | 0.5 wk |
| I2 | Indent & issue workflow (incl. billing linkage) | 0.5–1 wk |
| I3 | Narcotic/Schedule-H register + immutable audit | 0.5 wk |
| I4 | Consumption-linked auto-reorder + Procurement PR hook | 0.5 wk |
| I5 | Expiry/dead-stock analytics + UI screens | 0.5 wk |

---

## 13. Suggested Rollout Order (Consolidated)

1. **Week 1–2 (Phase A):** Helpdesk H1–H3 → Analytics A1–A4.
2. **Week 3–4 (Phase A):** Helpdesk H4 + Analytics A5 (screens) + sweep helper.
3. **Week 5–7 (Phase B):** AI B1 → B2 → B3.
4. **Week 8–13 (Phase C):** Mobile M1→M6 (can start M1 in parallel with Phase B once backend endpoints freeze).
5. **Week 9–16 (Phase D, parallel with C):** HRMS R1–R4 → Payroll P1–P4 (depends on R3 attendance) → Procurement G1–G4.
6. **Week 14–20 (Phase E, after D):** CRM C1–C5 → Finance F1–F5 (needs Payroll P2 `doctor-share`) → Inventory I1–I5 (needs Procurement G1 `requisitions/generate`).
7. **Continuous:** update `progress.md` after each milestone; run Playwright regression suite per `docs\Regression_Automation_Guide.md`.
