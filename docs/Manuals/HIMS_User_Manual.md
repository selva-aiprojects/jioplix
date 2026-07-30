# Jioplix HIMS: Tiered User Manual

## Table of Contents
1. [Overview](#overview)
2. [Basic Tier Manual](#basic-tier-manual)
3. [Standard Tier Manual](#standard-tier-manual)
4. [Professional Tier Manual](#professional-tier-manual)
5. [Enterprise Tier Manual](#enterprise-tier-manual)

---

## Overview
Welcome to The Jioplix Health Information Management System (HIMS). Our platform is designed to streamline hospital operations through a scalable, multi-tenant architecture. 

---

## Basic Tier Manual
**Target:** Small Clinics and Private Practices.
**Objective:** Digitize OPD and patient communications.

### Core Workflows:
1. **Patient Registration**: Search or create patient records. Generate unique MRNs.
2. **Appointments**: Manage daily schedules and check-in statuses.
3. **Consultation Desk**: Doctors can capture vitals, chief complaints, and history. Generate digital prescriptions instantly.
4. **Billing**: Raise invoices for consultations and procedures.
5. **Message Board**: Post internal announcements for staff visibility.
6. **Support Tickets**: Raise issues directly to the Nexus team for resolution.

---

## Standard Tier Manual
**Target:** Clinics with in-house Pharmacy and Diagnostics.
**Objective:** Unified management of clinical services.

### Core Workflows (Includes Basic Tier):
1. **Pharmacy (PIMS)**: Manage medicine inventory, stock alerts, and prescription fulfillment.
2. **Laboratory (LIS)**: Create lab orders from consultations. Log test results and generate reports.
3. **Inventory Management**: Track stock levels across pharmacy and general hospital supplies.

---

## Professional Tier Manual
**Target:** Multi-speciality Hospitals with In-patient departments.
**Objective:** Complete hospital orchestration.

### Core Workflows (Includes Standard Tier):
1. **IPD Admission**: Manage the complete patient journey from admission desk to bed allocation.
2. **Bed Map**: Real-time visualization of ward occupancy and bed availability.
3. **Nursing Station**: Manage patient vitals, intake/output, and medication charts.
4. **Discharge Workflow**: Streamlined discharge process with automated billing clearance.
5. **Insurance**: Manage TPA claims and pre-authorization requests.

---

## Enterprise Tier Manual
**Target:** Large Hospitals and Hospital Chains.
**Objective:** Advanced AI-driven healthcare.

### Core Workflows (Includes Professional Tier):
1. **AI Summary**: Automatically generate patient history summaries using Google Gemini.
2. **AI Discharge Summary**: Generate professional PDF discharge summaries with AI-drafted clinical sections.
3. **Global Signal Monitoring**: (For Admin) Monitor all communication signals across the hospital chain.
4. **Advanced RBAC**: Granular control over department-level permissions and security.

---

---

## Sidebar Navigation & Role Matrix

The Jioplix HIMS sidebar is dynamically provisioned by **Subscription Tier × User Role**. Access is determined at login through the RBAC engine (`rbac_menus` × `rbac_role_menus` × `required_plan`).

### Subscription Tiers

| Tier | Includes | Target |
|------|----------|--------|
| **Basic** | OPD & Communications | Small clinics, private practices |
| **Standard** | Basic + Lab, Pharmacy, Inventory | Clinics with in-house diagnostics |
| **Professional** | Standard + IPD, Insurance, Analytics | Multi-speciality hospitals |
| **Enterprise** | Professional + AI, Nexus, Advanced RBAC | Large hospitals, hospital chains |

### Sidebar Groups & Plan Gating

| Group | Menus | Minimum Plan | 
|-------|-------|-------------|
| **Clinical Administration** | Clinical Intelligence Hub, Doctor's Schedule, Patient Register, Patient Scheduling, Vital Assessment, Consulting Mgmt., Consultation Desk, Clinical & Financial Archives | Basic |
| | Prescription Queue | Standard |
| **Inpatient Operations** | IPD Admission Hub, Bed Management, Discharge Process | Professional |
| **Diagnostic Services** | Laboratory, Pharmacy Hub, Pharmacy Dashboard, Stock Inventory | Standard |
| | AI Lab Assistant | Enterprise |
| **Finance & Revenue** | Central Billing, Invoicing & Billing | Basic |
| **System Administration** | Staff & Access, Branding Settings, Hospital Settings, Message Board, Mail & Communications, Support & Tickets, Tenant Sensitive Configs | Basic (varies) |

### Role × Menu Access Matrix

| Menu | ADMIN | DOCTOR | NURSE | RECEPTIONIST | PHARMACIST | LAB\_ASSISTANT | SUPPORT |
|------|-------|--------|-------|-------------|------------|---------------|---------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Vital Assessment (OPD Registration) | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Consulting Mgmt. (OPD Queue / Doctor's Queue) | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Consultation Desk | ✓ | ✓ | — | — | — | — | — |
| Patient Scheduling (Appointment List) | ✓ | ✓ | — | ✓ | — | — | — |
| Doctor's Schedule | ✓ | ✓ | — | ✓ | — | — | — |
| Prescription Queue | ✓ | ✓ | ✓ | — | ✓ | — | — |
| Clinical & Financial Archives | ✓ | — | — | — | — | — | — |
| IPD Admission Hub | ✓ | — | ✓ | — | — | — | — |
| Bed Management (IPD Bed Map) | ✓ | ✓ | ✓ | — | — | — | — |
| IPD Census & Daycare | ✓ | ✓ | ✓ | — | — | — | — |
| Discharge Summaries | ✓ | — | ✓ | — | — | — | — |
| Laboratory | ✓ | ✓ | — | — | — | ✓ | — |
| Pharmacy Hub / Dashboard | ✓ | ✓ | — | — | ✓ | — | — |
| Stock Inventory | ✓ | ✓ | — | — | ✓ | — | — |
| Central Billing (Invoicing & Billing) | ✓ | — | — | ✓ | — | — | ✓ |
| Staff & Access | ✓ | — | — | — | — | — | — |
| Hospital Settings | ✓ | — | — | — | — | — | — |
| Branding & UI Settings | ✓ | — | — | — | — | — | — |
| Help & Support | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ticketing Management System | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ |

> **Note:** Admin role bypasses all checks — maps to every menu regardless of plan or role‑menu links.

---

## Recent Product Updates (July 2026)

### Clinical Scheduling Engine — Performance & Layout
- **Hero banner alignment**: Doctor Schedule page padding and layout matched to Patient Register for consistent hero banner positioning across all screens.
- **Parallel API loading**: Scheduling data fetch split from a single combined endpoint into 4 parallel lightweight calls (`/schedules`, `/leaves`, `/overrides`, `/appointments`), cutting initial load time significantly.
- **No reload on week navigation**: Removed `currentDate` from the effect dependency — flipping between weeks now uses local state only; no loading spinner or re-fetch.
- **Stable layout shell**: Sidebar, Header, and main container are rendered immediately on mount; only the content area shows a loader, eliminating page-jump flicker.

### RBAC & Sidebar Provisioning
- **Complete role coverage**: Added role-menu mappings for Receptionist, Pharmacist, Lab Assistant, and Support roles — previously these roles received an empty sidebar.
- **Per-role menu linking**: The `fixMenuSeeding.js` script now assigns role-appropriate menus per role instead of a single group insert.
- **Client-side plan gating**: Sidebar now enforces subscription tiers at the frontend as a secondary safety net — Lab/Pharmacy items hidden on Basic plans, AI Lab Assistant hidden except on Enterprise.
- **Missing menus added**: Dashboard, Invoicing & Billing, Branding & UI Settings, IPD Census & Daycare, and Discharge Summaries were added to `fixMenuSeeding.js` so they properly appear in seeding for new tenants.

### Appointment Booking Flow
- Unified booking flow improvements reduce navigation friction and support more robust rescheduling and calendar alignment.

### Tenant Schema Maintenance
- New tenant schema reconciliation and index maintenance scripts ensure all shard databases stay consistent and performant.

### Invoice and Billing Fixes
- `invoice_items` now include correct `created_at` tracking in tenant schema creation and healing routes.

### AI and Clinical Workflows
- Enhanced AI summary and discharge features continue to improve patient documentation across the Professional and Enterprise tiers.
