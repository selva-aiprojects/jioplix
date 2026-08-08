# HIMS :: Project Progress Tracker

## 🚀 Overview
**Platform**: Jioplix HIMS (Smart Healthcare System)
**Architecture**: Multi-Tenant Isolated Schema (PostgreSQL)
**Status**: Core Provisioning Stable | Shard Management Active | Diagnostic Command Center Live | Phase D & E (HRMS, Payroll, Procurement, CRM, Finance, Inventory) Complete | Operations Analytics Live

---

## 🛠️ Infrastructure & Environment Configuration

### 1. Local Development
- **Frontend (Vite)**: Runs on `http://localhost:3000` (Overridden from default 5173 for compatibility).
- **Backend API (Node.js)**: Runs on `http://localhost:4000`.
- **Monitoring (Nexus)**: Prometheus/Grafana stack on `http://localhost:5000` (Local observation only).
- **Database**: Local/Staging PostgreSQL with Prisma ORM.

### 2. Vercel Production
- **Unified Deployment**: Optimized serverless architecture.
- **Frontend**: Served from `client/dist` via Vercel Edge.
- **Backend**: Unified entry point at `/api/index.js`. All `/api/*` requests are routed to this single function to minimize cold starts and simplify service management.
- **Database**: Managed PostgreSQL (PlanetScale/Supabase/RDS) via Prisma.
- **Cron Jobs**: Automated daily sync for Nexus actuals scheduled at `00:00 UTC`.

---

## ✅ Completed Milestones
### 1. Nexus Control Plane (Master Identity)
- [x] **Atomic Provisioning**: Schema creation and shard initialization in a single transaction.
- [x] **Infrastructure Reliability**: Migration to native `gen_random_uuid()` and forced schema migrations.
- [x] **Nexus Dashboard**: Management of hospital shards, including subscription upgrades and decommissioning.
- [x] **Elite Branding**: 3D master logos and cinematic visual identity implemented.

### 2. Multi-Tenant Foundation
- [x] **Schema Isolation**: Dedicated PostgreSQL schemas per hospital.
- [x] **RBAC Foundation**: Cross-schema authentication for Nexus and Shard-specific logins.
- [x] **Welcome Automation**: Integration with Resend for admin credential delivery.

### 3. Laboratory & Diagnostic Command Center
- [x] **Diagnostic Wizard**: Professional 5-step clinical workflow (Accessioning -> Collection -> Analysis -> Authorization -> Published).
- [x] **Milestone Tracking**: Visual stepper for real-time tracking of investigation lifecycles.
- [x] **High-Precision Entry**: Parameter-grid results with automated normal range validation.
- [x] **Revenue Linkage**: Hard linkage between clinical results and automated billing.

### 4. Clinical Workflow Integration
- [x] **E2E Clinical Loop**: Connected Lab, Pharmacy, and Admission flows within the OPD Consultation War-Room.
- [x] **Clinical Decision Support**: Integrated visibility of past laboratory history and medication regimen for doctors.
- [x] **Formal Admissions**: Structured IPD recommendation system flowing from OPD to Admission Desk.

### 5. UI Modernization & Responsiveness
- [x] **Elite Mobile UI**: Full application optimization for handheld devices and clinical tablets.
- [x] **Table-to-Card Transformation**: Automated UI adaptation for dense data grids on small screens.
- [x] **Responsive Navigation**: Drawer-based sidebar with mobile close logic and overlay management.
- [x] **Dynamic Branding**: Real-time theme customization using CSS variables and Nexus sync.

---

### 5. Pharmacy & Inventory Intelligence
- [x] **Real-time Surveillance**: Visual stock alerts (Critical/Low) integrated into the inventory grid.
- [x] **Bulk Data Processing**: Streamlined CSV import/export framework for medicine catalogs.
- [x] **Atomic Dispensing**: Stock decrements synchronized with clinical billing events.
- [x] **Analytics Dashboard**: Real-time sales and stock health visualization for pharmacy administrators.

### 6. Insurance & TPA Integration
- [x] **Provider Orchestration**: Central registry for insurance partners and TPAs.
- [x] **Multi-Tiered Plans**: Support for complex coverage tiers with custom copay and base limits.
- [x] **Policy Mapping**: Patient-specific policy lifecycle management with live utilization tracking.
- [x] **Eligibility Guardrails**: Automated checks for policy validity and remaining limits during billing.

---

### 7. Clinical Journey Stabilization & Hardening
- [x] **Infrastructure Resilience**: Self-healing table/column provisioning implemented for all modules (IPD, Lab, Pharmacy).
- [x] **OPD Stabilization**: Resolved visibility issues in consultation queues and fixed encounter-to-billing synchronization.
- [x] **Laboratory Full-Cycle**: Implemented missing routes for result entry and publication, enabling 100% diagnostic lifecycle completion.
- [x] **IPD Continuity**: Validated discharge-to-billing flow with automated AI-driven summaries and bed release logic.
- [x] **Pharmacy Precision**: Fixed UI/UX logic for medication dispensing and ensured inventory-accurate billing.

### 8. Predictive Clinical Intelligence & Analytics
- [x] **Predictive Consultation Engine**: Real-time forecasting of consultation duration and case complexity using Gemini/Groq.
- [x] **Professional Intelligence Suite**: Completely overhauled dashboard with AI-driven workload forecasting and clinical complexity mix.
- [x] **OPD War-Room Insights**: Integrated real-time predictive bar for doctors to anticipate patient needs before starting the consultation.
- [x] **Premium Analytics Visuals**: Implementation of staggered animations, glassmorphism, and advanced charting for operational surveillance.
- [x] **Behavioral Analytics**: Integration of **PostHog** for tracking clinical workflow patterns and system utilization.
- [x] **Clinical Summarization**: Deployed AI engines for automated medication regimen instructions and smart discharge summaries.

### 9. Mobile Ecosystem (Flutter)
- [x] **Cross-Platform Foundation**: Initialized Flutter 3.x project with multi-tenant header management.
- [x] **Biometric Authentication**: Secure login integrated with FaceID/Fingerprint for medical staff.
- [ ] **Clinical Co-pilot (Mobile)**: (Active) Implementing real-time patient timeline and AI-assisted clinical note-taking on handhelds.

### 10. ABDM / ABHA V3 Integration (Patient Registration)
- [x] **Milestone M1 (ABHA Identity)**: Real-time Aadhaar OTP request/validation, mobile-based discovery, dynamic public certificate retrieval, and secure client-side RSA-OAEP-SHA1 encryption.
- [x] **Milestone M2 (Health Information Provider - HIP)**: Real-time FHIR clinical document compilation and sharing (vitals, diagnoses, and prescriptions) with care context mapping.
- [x] **Milestone M3 (Health Information User - HIU)**: Automated patient consent flow via PHR/Aarogya Setu and secure decryption/rendering of external clinical histories.
- [x] **Sandbox Simulation**: Dynamic demo mode toggle, system logging, and comprehensive Playwright E2E verification tests.

### 11. Operations Analytics (v14)
- [x] **A1**: `targets` + `operational_alerts` tables with self-healing ensure-helper + reconciliation.
- [x] **A2**: Real-time OPD-load, bed-occupancy, and pharmacy stock-out risk endpoints.
- [x] **A3**: Revenue-vs-target + doctor & specialty performance endpoints.
- [x] **A4**: Predictive alert engine (bed shortage, high ALOS, expiry risk, stock-out risk, revenue gap) with ack/resolve lifecycle.
- [x] **A5**: Ops command center, performance insights, and alert center UI (`/tenant/analytics/ops|performance|alerts`; builds clean).

### 12. HRMS — Duty Roster, Credentials & On-Call (v17)
- [x] **R1**: Tables (`duty_shifts`, `duty_roster`, `roster_swaps`, `attendance`, `staff_credentials`, `staff_privileges`, `on_call_duty`) + ensure-helper + reconciliation.
- [x] **R2**: Roster engine + shift conflict detection + swap request/decision workflow.
- [x] **R3**: Attendance capture, staff credential & privilege management.
- [x] **R4**: On-call ledger + HRMS UI screens + RBAC menus.

### 13. Payroll — Incentives, Allowances & Statutory (v17)
- [x] **P1**: Tables (`payroll_rules`, `payroll_runs`, `payroll_items`, `payroll_statutory`, `payroll_slip_items`) + ensure-helper + reconciliation.
- [x] **P2**: Billing-attribution driver (`doctor-share`) + incentive calculation engine.
- [x] **P3**: Allowances from attendance/on-call + run lifecycle (generate → finalize) + payslip PDF generation (`createPayslipPDF`).
- [x] **P4**: Statutory config (PF/ESI/professional tax) + Payroll UI screens + RBAC menus.

### 14. Procurement — Rate Contracts, Auto-PR, GRN+QC, Three-Way Match (v17)
- [x] **G1**: Tables (`vendor_rate_contracts`, `purchase_requisitions`, `purchase_orders`, `grn`, `grn_items`, `procurement_matching`) + reorder sweep hook.
- [x] **G2**: Vendor rate contracts + comparison + PR/PO lifecycle.
- [x] **G3**: GRN with quality check/quarantine + stock integration via `pharmacy_inwards`.
- [x] **G4**: Three-way match (PO–GRN–Invoice) + Procurement UI screens + RBAC menus.

### 15. Patient CRM — Scheduling, Dedup, Referrals, Consent, Family (v18)
- [x] **C1**: Tables (`patient_identifiers`, `patient_duplicates`, `patient_groups`, `patient_links`, `patient_consents`, `referrals`, `corporate_accounts`, `appointment_slots`) + ensure-helper + reconciliation.
- [x] **C2**: Slot engine (multi-doctor/multi-location, token + time slot hybrid) + token board.
- [x] **C3**: Dedup scoring + merge wizard + patient identifiers.
- [x] **C4**: Referrals + corporate accounts + DPDP consent register + family/linked accounts.
- [x] **C5**: CRM UI screens + RBAC menus.

### 16. Finance — Packages, Surgery Billing, Insurance, GST/E-Invoice, Payments (v18)
- [x] **F1**: Tables (`billing_packages`, `billing_package_components`, `surgery_cases`, `surgery_components`, `invoice_advances`, `invoice_refunds`, `invoice_writeoffs`, `gst_invoices`, `insurance_claim_tracking`) + ensure-helper + reconciliation.
- [x] **F2**: Package + surgery component billing engine with automatic breakdown.
- [x] **F3**: Advance / refund / write-off / partial payment workflows with audit trail.
- [x] **F4**: GST config + e-invoice (IRN) sandbox + HSN support on masters.
- [x] **F5**: Insurance/TPA eligibility + claim status tracking + Finance UI screens + RBAC menus.

### 17. Pharmacy Inventory — Indents, Narcotics, Auto-Reorder, Expiry (v18)
- [x] **I1**: `medicines`/`drug_categories` ALTERs + tables (`indents`, `indent_items`, `pharmacy_issues`, `issue_items`, `narcotic_register`, `reorder_logs`) + ensure-helper + reconciliation.
- [x] **I2**: Ward/OT/ICU indent & issue workflow (incl. billing linkage).
- [x] **I3**: Narcotic / Schedule-H register with immutable append-only audit.
- [x] **I4**: Consumption-linked auto-reorder + Procurement PR generation hook.
- [x] **I5**: Expiry / dead-stock / consumption analytics + Inventory UI screens + RBAC menus.

### 18. Helpdesk Grievance Intake & Analytics (v14)
- [x] **H4a**: Helpdesk analytics endpoint (`/api/helpdesk/analytics`) for ticket volume, SLA, and category breakdown.
- [x] **H4b**: Patient-grievance category support (channel `PATIENT_GRIEVANCE`) with grievance categories seeded (care quality, billing/payment, facilities).

---
## 📋 Future Roadmap
- [ ] **Internationalization**: Multi-currency and multi-language support.
- [ ] **Tele-Health Bridge**: Seamless video consultation integration with synchronized clinical notes.

---
## 🗺️ Enhancement Roadmap (Phase A → B → C)
Detailed plan: `docs/Requirements/Enhancements_Implementation_Plan.md`

### Phase A — Helpdesk & Analytics (v14) ✅ Core Complete
- [x] **Helpdesk**: Patient grievance + internal ticket categories; SLA timers & escalation matrix; link tickets to patient / equipment / department.
  - [x] H1: Helpdesk tables (`helpdesk_tickets`, `helpdesk_categories`, `helpdesk_sla_policies`, `helpdesk_escalations`, `helpdesk_ticket_notes`, `helpdesk_equipment`) + ensure-helper + reconciliation (validated on real tenant `kkcth`)
  - [x] H2: Ticket CRUD + SLA engine + escalation sweep + Resend emails + RBAC (`backend/src/modules/helpdesk` → `/api/helpdesk`; end-to-end tested on `kkcth`)
  - [x] H3: Web screens (dashboard, list, detail, equipment register) + sidebar (`client/src/modules/tenant/helpdesk` → `/tenant/helpdesk`; builds clean)
  - [x] H4: Grievance intake (channel `PATIENT_GRIEVANCE` + grievance categories) + helpdesk analytics endpoint
- [x] **Analytics**: Real-time operational dashboards (OPD load, bed occupancy, pharmacy stock-out risk, revenue vs target); doctor-wise & specialty-wise performance; predictive alerts (bed shortage, high ALOS, expiry risk).
  - [x] A1: `targets` + `operational_alerts` tables
  - [x] A2: OPD-load + bed-occupancy + pharmacy-risk endpoints
  - [x] A3: Revenue-vs-target + doctor/specialty performance endpoints
  - [x] A4: Predictive alert engine (5 signals) + ack/resolve
  - [x] A5: Ops command center + performance + alert UI

### Phase B — AI Assistant (v15)
- [ ] B1: Conversational operational queries (intent routing + safe aggregate queries + audit log)
- [ ] B2: Discharge summary draft polish (vitals/meds/labs/follow-up + style toggle)
- [ ] B3: In-consultation differential diagnosis + drug interaction rules engine
- [ ] B4: (Optional) Stock prediction + claim rejection prediction

### Phase C — Mobile Ecosystem (v16)
- [ ] M1: Single role-driven Flutter app shell + token refresh + theme
- [ ] M2: Doctor app (today list, patient card, e-Rx, labs, voice summary)
- [ ] M3: Nurse app (tasks, vitals, bed map) + `client_txn_id` idempotency on backend
- [ ] M4: Admin app (KPIs, approvals, alerts)
- [ ] M5: Offline read cache + write queue + sync UI
- [ ] M6: Push notifications (FCM + `push_tokens` + alert→push hook)

### Phase D — HRMS, Payroll & Procurement (v17) ✅ Complete
- [x] **HRMS**: Doctor & Nurse duty roster with conflict detection; credential & privilege management; leave + attendance linked to roster; on-call & emergency duty tracking.
  - [x] R1: Tables (`duty_shifts`, `duty_roster`, `roster_swaps`, `attendance`, `staff_credentials`, `staff_privileges`, `on_call_duty`) + ensure-helper + reconciliation
  - [x] R2: Roster engine + conflict detection + publish/swap
  - [x] R3: Attendance + leave linkage + credentials/privileges
  - [x] R4: On-call ledger + UI screens + RBAC menus
- [x] **Payroll**: Doctor incentive/share auto-calculation from billing; night duty / emergency allowance rules; statutory compliance (PF, ESI, professional tax) with hospital-specific rules.
  - [x] P1: Tables (`payroll_rules`, `payroll_runs`, `payroll_items`, `payroll_statutory`, `payroll_slip_items`) + ensure-helper + reconciliation
  - [x] P2: Billing attribution driver + incentive engine (`doctor-share`)
  - [x] P3: Allowances from attendance/on-call + run lifecycle + payslip PDF
  - [x] P4: Statutory config + UI screens + RBAC menus
- [x] **Procurement**: Vendor rate contract + comparison; auto PR generation from reorder levels; GRN with quality check & quarantine; three-way match (PO–GRN–Invoice).
  - [x] G1: Tables (`vendor_rate_contracts`, `purchase_requisitions`, `purchase_orders`, `grn`, `grn_items`, `procurement_matching`) + reorder sweep
  - [x] G2: Rate contracts + comparison + PR/PO lifecycle
  - [x] G3: GRN + QC/quarantine + stock integration via `pharmacy_inwards`
  - [x] G4: Three-way match + UI screens + RBAC menus

### Phase E — CRM, Finance & Inventory (v18) ✅ Complete
- [x] **CRM (Patient)**: Advanced appointment scheduling (multi-doctor, multi-location, token + time slot hybrid); smart patient search + deduplication (Aadhaar / mobile / UHID); referral & corporate/TPA patient handling; consent management (DPDP-ready); family / linked patient accounts.
  - [x] C1: Tables (`patient_identifiers`, `patient_duplicates`, `patient_groups`, `patient_links`, `patient_consents`, `referrals`, `corporate_accounts`, `appointment_slots`) + ensure-helper + reconciliation
  - [x] C2: Slot engine (multi-doctor/location, token+time) + token board
  - [x] C3: Dedup scoring + merge wizard + identifiers
  - [x] C4: Referrals + corporate accounts + consent register + family accounts
  - [x] C5: UI screens + RBAC menus
- [x] **Finance (Billing)**: Package & surgery billing with automatic component breakdown; real-time insurance/TPA eligibility + claim status tracking; GST + e-invoice compliance (India); advance, refund, write-off & partial payment workflows; doctor share / incentive calculation.
  - [x] F1: Tables (`billing_packages`, `billing_package_components`, `surgery_cases`, `surgery_components`, `invoice_advances`, `invoice_refunds`, `invoice_writeoffs`, `gst_invoices`, `insurance_claim_tracking`) + ensure-helper + reconciliation
  - [x] F2: Package + surgery component billing engine
  - [x] F3: Advance/refund/write-off/partial payment workflow + audit
  - [x] F4: GST config + e-invoice (IRN) sandbox + HSN on masters
  - [x] F5: Insurance eligibility + claim status tracking + UI
- [x] **Inventory (Pharmacy)**: Batch + Expiry + FEFO control with auto-alerts; ward / OT / ICU indent & issue workflow; narcotic & Schedule H drug tracking; auto-reorder linked to consumption; near-expiry & dead-stock analytics.
  - [x] I1: `medicines`/`drug_categories` ALTERs + tables (`indents`, `indent_items`, `pharmacy_issues`, `issue_items`, `narcotic_register`, `reorder_logs`) + ensure-helper + reconciliation
  - [x] I2: Indent & issue workflow (incl. billing linkage)
  - [x] I3: Narcotic/Schedule-H register + immutable audit
  - [x] I4: Consumption-linked auto-reorder + Procurement PR hook
  - [x] I5: Expiry/dead-stock analytics + UI screens

---
*Last Updated: 2026-08-08 15:30*
