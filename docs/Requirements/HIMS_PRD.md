# HIMS by Jioplix – Product Requirements Document (PRD)

## 1. Product Vision
Cloud-native multi-tenant Hospital Information Management System (HIMS) supporting clinics (OPD) and hospitals (OPD + IPD), with an AI-First architecture focused on operational efficiency and clinical intelligence.

---

## 2. Product Scope & Tiers
The Jioplix HIMS follows a 4-tier subscription model, enabling hospitals to scale as they grow.

### Tier 1: Basic (OPD & Communications)
- Patient Management (MRN Generation)
- **ABHA Identity Integration**: Aadhaar-based OTP verification & mobile discovery (ABDM M1).
- Appointment Scheduling
- OPD Consultation (Core EMR)
- Prescription Generation
- Invoicing & Billing
- **Smart Scheduling**: Doctor availability management with persistent blocking and recurring pattern support.
- Message Board (Internal Announcements)
- Mail Management (Signal Tracking)
- Support Ticketing System

### Tier 2: Standard (Clinical Services)
- All Basic Features
- Laboratory Information System (LIS) with Command Center
- Pharmacy Information Management (PIMS)
- Stock & Inventory Management
- **Request-to-Revenue Bridge**: Automated linkage between clinical orders and financial invoicing.

### Tier 3: Professional (IPD & Analytics)
- All Standard Features
- IPD Admission / Discharge Workflow
- Bed Management & Real-time Bed Map
- Nursing Workflows & Vitals
- Insurance Management
- **Operations Analytics**: Real-time OPD load, bed occupancy, pharmacy stock-out risk, revenue-vs-target dashboards; doctor & specialty performance; predictive alert engine (bed shortage, high ALOS, expiry risk, stock-out risk, revenue gap).
- **HRMS**: Doctor & Nurse duty roster with conflict detection, credential & privilege management, attendance, on-call duty ledger.
- **Payroll**: Incentive/share auto-calculation from billing, allowances from attendance/on-call, statutory compliance (PF/ESI/professional tax), run lifecycle + payslip PDF.
- **Procurement**: Vendor rate contracts & comparison, auto PR from reorder levels, GRN with QC/quarantine, three-way match (PO–GRN–Invoice).
- **Patient CRM**: Advanced appointment scheduling (multi-doctor/multi-location, token + time slot), smart patient search & deduplication, referral & corporate/TPA handling, consent management (DPDP-ready), family accounts.
- **Pharmacy Inventory**: Batch/expiry/FEFO control, ward/OT/ICU indent & issue workflow, narcotic & Schedule H tracking, consumption-linked auto-reorder, expiry/dead-stock analytics.
- **Isolated AI Chatbot**: Tenant-locked assistant for real-time facility metrics and operational support.

### Tier 4: Enterprise (AI & Multi-Tenant)
- All Professional Features
- **Finance (Advanced Billing)**: Package & surgery billing with automatic component breakdown, advances/refunds/write-offs/partial payments, GST + e-invoice (IRN sandbox), insurance/TPA eligibility & claim tracking, doctor-share reporting.
- AI-Powered Discharge Summaries
- AI Clinical Insights & History Summaries
- **Multi-Model AI Orchestration**: Seamless integration of Google Gemini (Complex Medical Processing) and Llama 3.3/Groq (High-Velocity CDS).
- **AI Lab Assistant**: OCR-driven external report parsing and pathological interpretation.
- Nexus Multi-Tenant Management
- Global Communication Hub & Signal History

---

## 2A. Functional Requirements — Non-Clinical Operations (Phases D & E)

### HRMS
- **FR-H1**: Duty shift master (name, start/end, type) with CRUD.
- **FR-H2**: Roster assignment per staff with conflict detection (overlapping shifts, max hours).
- **FR-H3**: Shift swap request → peer & admin decision workflow.
- **FR-H4**: Attendance capture per staff/shift with delete audit.
- **FR-H5**: Staff credentials (license/registration no, expiry, issuing authority) with expiry tracking.
- **FR-H6**: Staff privileges registry with revoke capability.
- **FR-H7**: On-call duty ledger (type, start/end, note).
- **FR-H8**: HRMS analytics (coverage %, conflicts, credential expiring).

### Payroll
- **FR-P1**: Payroll rules (allowance name, type EARNING/DEDUCTION, amount/percent, applicable roles).
- **FR-P2**: Statutory config (PF, ESI, professional tax) with hospital-specific rates/slabs.
- **FR-P3**: Monthly run generation auto-attributing doctor-share from billing + allowances from attendance/on-call.
- **FR-P4**: Run lifecycle (DRAFT → FINALIZED) with regenerate before finalize.
- **FR-P5**: Payslip per employee (earnings/deductions/gross/net) + PDF export (`createPayslipPDF`).
- **FR-P6**: Payroll analytics (gross/net totals, per-role breakdown).

### Procurement
- **FR-G1**: Vendor rate contracts (item, vendor, rate, validity, MOQ) with comparison view.
- **FR-G2**: Purchase requisition lifecycle (created → generated-from-reorder → approved → converted to PO).
- **FR-G3**: Purchase order with items, vendor, delivery tracking.
- **FR-G4**: GRN receipt with QC result (PASS/QUARANTINE/REJECT) and stock integration via `pharmacy_inwards`.
- **FR-G5**: Three-way match (PO ↔ GRN ↔ Invoice) with status and discrepancy log.

### Patient CRM
- **FR-C1**: Patient identifiers (Aadhaar/mobile/UHID per patient) for dedup basis.
- **FR-C2**: Dedup scoring engine + duplicate list + merge wizard + dismiss.
- **FR-C3**: Patient groups + linked/family accounts.
- **FR-C4**: Consent register (DPDP-ready) with purpose, validity, revoke + export per patient.
- **FR-C5**: Referral registry (referring provider/org, type, commission) with status tracking.
- **FR-C6**: Corporate/TPA accounts (credit limit, coverage) with patient assignment.
- **FR-C7**: Appointment slot engine (multi-doctor/multi-location) + token booking.

### Finance (Billing)
- **FR-F1**: Billing packages (name, amount, category) with component breakdown.
- **FR-F2**: Package billing that materializes components into invoice lines.
- **FR-F3**: Surgery case registry + component configuration + surgery billing.
- **FR-F4**: Advance payments with apply-to-invoice workflow + balance tracking.
- **FR-F5**: Refund workflow with approval gate.
- **FR-F6**: Write-off workflow with approval gate + audit.
- **FR-F7**: GST config (rate, HSN defaults) + e-invoice generation (IRN sandbox mode).
- **FR-F8**: Insurance eligibility check (plan, copay, remaining limit) + claim status tracking.
- **FR-F9**: Doctor-share report for payroll incentive attribution.

### Pharmacy Inventory
- **FR-I1**: Indent creation (dept, requested-by, multi-line items) with status lifecycle.
- **FR-I2**: Indent approval/rejection + issue-to-department with per-item batch/qty.
- **FR-I3**: Issue ledger with audit (issued-by, timestamp, dept).
- **FR-I4**: Narcotic register (patient, medicine, batch, qty, administering + witness user, purpose) — append-only immutable.
- **FR-I5**: Reorder config (level, qty per medicine) + manual reorder sweep hooking into Procurement PRs.
- **FR-I6**: Analytics — expiry buckets (30/60/90d), dead-stock, 30-day consumption.

---

## 3. Architecture

### Multi-Tenant Model
- **Nexus (Control Plane)**: Centralized orchestration for provisioning, ticketing triage, and global signal monitoring.
- **Tenant DB (Isolated Shards)**: Secure, isolated data storage for each hospital instance.

### AI Router Pattern
- **Orchestration Layer**: Decoupled AI service for compute-intensive tasks (OCR, Summarization).
- **Tenant-Lock Security**: Strict data isolation via backend context injection (HIPAA Compliance).

### Infrastructure Reliability
- **Self-Healing Shards**: Automated table and column provisioning per-tenant to eliminate environment-related runtime crashes.
- **Atomic Revenue Hub**: Consolidated billing queue that synchronizes Lab, Pharmacy, and IPD service charges in real-time.

---

## 4. User Roles
### Nexus Admin (Super Admin)
- Shard Provisioning & Lifecycle
- Support Ticket Resolution
- Global Communication Monitoring

### Tenant Staff
- Doctor (Clinical)
- Nurse (In-patient care)
- Receptionist (OPD Front desk)
- Pharmacist (Dispensing)
- Lab Technician (Diagnostics)
- Billing Staff (Finance / Revenue Center)

---

## 5. Core Operational Flow: Request-to-Revenue
The system enforces a strict operational lifecycle:
1.  **Clinical Initiation**: Doctor creates an order (Lab, Pharmacy, Procedure).
2.  **Execution**: Technician/Nurse processes the order.
3.  **Financial Catch**: Automated entry into the department-specific Billing Center.
4.  **Verification**: Final report/dispensing is only "Published" once payment/insurance is reconciled.

---

## 6. Security & Compliance
- **JWT Authentication**: Secure token-based access.
- **RBAC**: Role-Based Access Control mapped to dynamic sidebars.
- **Data Isolation**: PostgreSQL Schema-per-tenant ensures zero data leakage between shards (HIPAA Alignment).
- **Audit Logs**: Comprehensive tracking of all clinical and financial transactions.

---

## 7. UI/UX & Design Experience
The HIMS platform utilizes a **Premium Clinical Design System** optimized for high-velocity environments:
- **Dynamic Branding Engine**: Real-time theme injection allowing hospitals to customize primary colors, accent highlights, and corporate logos via a centralized Settings module.
- **Accordion Workflow Navigation**: A structured navigation hierarchy that groups modules into Clinical, Services, Billing, and Management clusters, reducing cognitive load for hospital staff.
- **Zero-Jump Architecture**: CSS-optimized layout persistence that eliminates UI shifting during navigation, ensuring a stable and predictable experience for medical practitioners.
- **Accessibility & Contrast**: High-contrast, theme-aware interfaces designed for varied lighting conditions in hospital wards and labs.

---

## 8. Success Metrics
- **Consultation Speed**: < 2 minutes per patient.
- **Prescription Efficiency**: < 3 clicks.
- **Revenue Capture**: 100% linkage between clinical orders and invoices.
- **Identity Integrity**: > 90% patient verification rate via ABHA/ABDM.
- **Onboarding**: < 5 minutes for new hospital shards.
