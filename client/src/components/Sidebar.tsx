import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { getTenantBrandingConfig, getNamespacedItem, normalizeLogoUrl } from "../config/theme";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  Pill,
  Receipt,
  Settings,
  Bed,
  ClipboardList,
  RefreshCw,
  Calendar,
  Stethoscope,
  ChevronDown,
  ShieldCheck,
  LifeBuoy,
  Box,
  TrendingUp,
  Palette,
  MessageSquare,
  Mail,
  BarChart2,
  UserCog,
  Archive,
  HeartPulse,
  Syringe,
  Building2,
  Wallet,
  Tag,
  FileText,
  PhoneCall,
  Package,
  Cpu,
  CircleDollarSign,
} from 'lucide-react';

// ─── Icon Registry ────────────────────────────────────────────────────────────
const Icons: Record<string, any> = {
  Dashboard:                LayoutDashboard,
  "OPD Registration":       HeartPulse,
  "OPD Consultation Queue": RefreshCw,
  "Consultation Desk":      Stethoscope,
  "Patient Register":       ClipboardList,
  "Patient Scheduling":     Calendar,
  "Doctor's Schedule":      Calendar,
  "IPD Admission":          Bed,
  "Bed Management":         Bed,
  "Discharge & Summary":    FileText,
  "Laboratory & Diagnostics": FlaskConical,
  "AI Diagnostic Assistant":  Cpu,
  "Pharmacy Management":    Pill,
  "Medication Dispensing":  Syringe,
  "Pharmacy Stock":         Package,
  "Central Billing":        Receipt,
  "Insurance & Claims":     ShieldCheck,
  "Finance & Compliance":   CircleDollarSign,
  "Outpatient Registration (OPD)": HeartPulse,
  "Inpatient Admission (IPD)": Bed,
  "Human Resource Management System": UserCog,
  "Payroll & Compensation Processing": Wallet,
  "Procurement & Supply Chain Management": Box,
  "Pharmacy Inventory & Stock Control": Package,
  "Patient Relationship Management (CRM)": Users,
  "Insurance & TPA Claims Management": ShieldCheck,
  "Hospital Branding & User Interface": Palette,
  "Staff & Access Control (RBAC)": UserCog,
  "Clinical Analytics":     BarChart2,
  "Patient CRM":            Users,
  "HR Management (HRMS)":   UserCog,
  "Payroll Processing":     Wallet,
  "Procurement":            Box,
  "Pharmacy Inventory":     Package,
  "Message Board":          MessageSquare,
  "Mail & Communications":  Mail,
  "WhatsApp Reminders":     PhoneCall,
  "Hospital Settings":      Settings,
  "Branding & UI":          Palette,
  "Staff & Access Control": UserCog,
  "Help Desk":              LifeBuoy,
  "Support Tickets":        Tag,
  "Clinical Archives":      Archive,
  "Secure Configurations":  ShieldCheck,
  // Legacy keys kept so menus coming from server still resolve
  "Vital Assessment":       HeartPulse,
  "Consulting Mgmt.":       RefreshCw,
  "IPD Admission Hub":      Bed,
  Laboratory:               FlaskConical,
  "AI Lab Assistant":       Cpu,
  "Prescription Queue":     Syringe,
  "Stock Inventory":        Package,
  "Pharmacy Dashboard":     Pill,
  "Pharmacy Hub":           Pill,
  "Staff & Access":         UserCog,
  "Hospital Settings (Masters)": Settings,
  HRMS:                     UserCog,
  Payroll:                  Wallet,
  "Operations Analytics":   BarChart2,
  "Branding Settings":      Palette,
  "Tenant Sensitive Configs": ShieldCheck,
  "Clinical & Financial Archives": Archive,
  "Help & Support":         LifeBuoy,
  "Support & Tickets":      Tag,
  "Doctor's Queue":         Stethoscope,
  CalendarDays:             Calendar,
  TrendingUp:               TrendingUp,
  Building2:                Building2,
  ClipboardList:            ClipboardList,
  Receipt:                  Receipt,
  Users:                    Users,
  Box:                      Box,
  Palette:                  Palette,
  ShieldCheck:              ShieldCheck,
};

const ALIAS_MAP: Record<string, string> = {
  // Outpatient (OPD)
  "opd registration": "OPD Registration",
  "outpatient registration (opd)": "OPD Registration",
  "doctor's queue": "Doctor's Queue",
  "opd queue": "Doctor's Queue",
  "opd consultation queue": "Doctor's Queue",
  "consultation desk": "Consultation Desk",
  "patient scheduling": "Patient Scheduling",
  "patient register": "Patient Register",

  // Inpatient (IPD)
  "admission desk": "Admission Desk",
  "inpatient admission (ipd)": "Admission Desk",
  "ipd bed map": "Bed & Ward Management",
  "bed management": "Bed & Ward Management",
  "ipd census & daycare": "IPD Census & Daycare",
  "discharge summaries": "Discharge",
  "discharge & summary": "Discharge",
  "clinical & financial archives": "Medical Records & Archives",
  "clinical archives": "Medical Records & Archives",

  // Clinical Services
  "laboratory": "Laboratory",
  "laboratory & diagnostics": "Laboratory",
  "ai diagnostic assistant": "Clinical Decision Support",
  "radiology & imaging": "Radiology & Imaging",
  "operation theatre": "Operation Theatre",
  "blood bank": "Blood Bank",

  // Pharmacy
  "prescription queue": "Prescription Queue",
  "medication dispensing": "Dispensing",
  "pharmacy inventory": "Pharmacy Inventory",
  "pharmacy inventory & stock control": "Pharmacy Inventory",
  "stock inventory": "Pharmacy Inventory",
  "pharmacy stock": "Pharmacy Inventory",
  "pharmacy dashboard": "Pharmacy Dashboard",
  "pharmacy management": "Pharmacy Dashboard",
  "pharmacy hub": "Pharmacy Dashboard",
  "procurement & suppliers": "Procurement & Suppliers",
  "pharmacy reports": "Pharmacy Reports",

  // Billing & Finance
  "invoicing & billing": "Patient Billing",
  "central billing": "Patient Billing",
  "insurance & tpa claims management": "Insurance & TPA",
  "finance & compliance": "Finance & Revenue",

  // Hospital Operations
  "human resource management system": "Workforce Management",
  "hrms": "Workforce Management",
  "payroll & compensation processing": "Workforce Management",
  "payroll": "Workforce Management",
  "procurement & supply chain management": "Supply Chain",
  "procurement": "Supply Chain",
  "facility management": "Facility Management",

  // Reports & Analytics
  "clinical analytics": "Clinical Reports",
  "operations analytics": "Operational Reports",
  "performance insights": "Performance Insights",
  "alert center": "Analytics Dashboard",

  // Patient Engagement
  "patient crm": "Patient CRM",
  "patient relationship management (crm)": "Patient CRM",
  "message board": "Communications",
  "mail & communications": "Communications",
  "mail management": "Communications",
  "reminder tracker": "Notifications & Reminders",
  "whatsapp reminders": "Notifications & Reminders",
  "patient portal": "Patient Portal",

  // Administration
  "hospital settings (masters)": "Hospital Configuration",
  "hospital settings": "Hospital Configuration",
  "branding & ui settings": "Branding & UI",
  "branding settings": "Branding & UI",
  "hospital branding & user interface": "Branding & UI",
  "staff & rbac": "Users & Roles",
  "staff & access control (rbac)": "Users & Roles",
  "secure configurations": "Security & Compliance",
  "tenant sensitive configs": "Security & Compliance",
  "ticketing management system": "Help Desk",
  "support tickets": "Help Desk",
  "help desk": "Help Desk",
};

// ─── Route normalisation (server label → canonical path) ─────────────────────
const normalizePath = (label: string, originalPath: string) => {
  const l = label.toLowerCase();
  const overrides: Record<string, string> = {
    // OPD
    "opd registration":          "/tenant/opd/registration",
    "vital assessment":          "/tenant/opd/registration",
    "opd center":                "/tenant/opd/registration",
    "opd consultation queue":    "/tenant/opd/queue",
    "opd queue":                 "/tenant/opd/queue",
    "consulting mgmt.":          "/tenant/opd/queue",
    "consultation desk":         "/tenant/opd/consultation",
    "patient register":          "/tenant/clinical/patient-register",
    "patient scheduling":        "/tenant/appointments",
    "appointment list":          "/tenant/appointments",
    "doctor's schedule":         "/tenant/appointments/doctor-calendar?tab=Operational+Calendar",
    "advanced scheduling console": "/tenant/appointments/doctor-calendar?tab=Operational+Calendar",
    // IPD
    "ipd admission":             "/tenant/ipd/admission-desk",
    "ipd admission hub":         "/tenant/ipd/admission-desk",
    "bed management":            "/tenant/ipd/beds",
    "ipd bed map":               "/tenant/ipd/beds",
    "discharge & summary":       "/tenant/ipd/discharge",
    "discharge summaries":       "/tenant/ipd/discharge",
    "discharge process":         "/tenant/ipd/discharge",
    // Diagnostics & Pharmacy
    "laboratory & diagnostics":  "/tenant/lab",
    "laboratory":                "/tenant/lab",
    "lab":                       "/tenant/lab",
    "diagnostic center":         "/tenant/lab",
    "ai diagnostic assistant":   "/tenant/lab/ai",
    "ai lab assistant":          "/tenant/lab/ai",
    "radiology & imaging":       "/tenant/radiology",
    "operation theatre":         "/tenant/ot",
    "blood bank":                 "/tenant/blood-bank",
    "pharmacy management":       "/tenant/pharmacy/dashboard",
    "pharmacy hub":              "/tenant/pharmacy",
    "pharmacy dashboard":        "/tenant/pharmacy/dashboard",
    "pharmacy reports":          "/tenant/pharmacy",
    "medication dispensing":     "/tenant/pharmacy/queue",
    "prescription queue":        "/tenant/pharmacy/queue",
    "pharmacy stock":            "/tenant/pharmacy/inventory",
    "stock inventory":           "/tenant/pharmacy/inventory",
    // Billing & Finance
    "central billing":           "/billing",
    "invoicing & billing":       "/billing",
    "opd billing & revenue center": "/billing",
    "laboratory billing":        "/billing",
    "pharmacy billing":          "/billing",
    "ipd & discharge billing":   "/billing",
    "insurance & claims":        "/tenant/insurance",
    "insurance & tpa claims management": "/tenant/insurance",
    "finance & compliance":      "/tenant/finance",
    // Analytics
    "clinical analytics":        "/tenant/analytics/ops",
    "operations analytics":      "/tenant/analytics/ops",
    "performance insights":      "/tenant/analytics/performance",
    "alert center":              "/tenant/analytics/alerts",
    "patient crm":               "/tenant/crm",
    "patient relationship management (crm)": "/tenant/crm",
    // HR & Operations
    "hr management (hrms)":      "/tenant/hrms",
    "hrms":                      "/tenant/hrms",
    "duty roster":               "/tenant/hrms",
    "human resource management system": "/tenant/hrms",
    "payroll processing":        "/tenant/payroll",
    "payroll":                   "/tenant/payroll",
    "payroll & compensation processing": "/tenant/payroll",
    "procurement":               "/tenant/procurement",
    "procurement & supply chain management": "/tenant/procurement",
    "pharmacy inventory":        "/tenant/inventory",
    "pharmacy inventory & stock control": "/tenant/inventory",
    "facility management":        "/tenant/facility",
    // Communication
    "message board":             "/tenant/communication",
    "mail & communications":     "/tenant/mail",
    "whatsapp reminders":        "/tenant/reminders",
    "follow-up center":          "/tenant/reminders",
    "reminder tracker":          "/tenant/reminders",
    "patient portal":             "/tenant/patient-portal",
    // System
    "hospital settings":         "/tenant/masters",
    "hospital settings (masters)": "/tenant/masters",
    "branding & ui":             "/tenant/settings",
    "branding settings":         "/tenant/settings",
    "branding & ui settings":    "/tenant/settings",
    "hospital branding & user interface": "/tenant/settings",
    "staff & access control":    "/tenant/staff",
    "staff & access":            "/tenant/staff",
    "user management":           "/tenant/staff",
    "staff management":          "/tenant/staff",
    "staff & rbac":              "/tenant/staff",
    "staff & access control (rbac)": "/tenant/staff",
    "help desk":                 "/tenant/helpdesk",
    "helpdesk":                  "/tenant/helpdesk",
    "help & support":            "/tenant/support/tickets",
    "support tickets":           "/tenant/support/tickets",
    "support & tickets":         "/tenant/support/tickets",
    "ticketing management system": "/tenant/support/tickets",
    "clinical archives":         "/tenant/archives",
    "clinical & financial archives": "/tenant/archives",
    "secure configurations":     "/tenant/settings/secure",
    "tenant sensitive configs":  "/tenant/settings/secure",
  };
  return overrides[l] || originalPath;
};

// ─── Server label → standard healthcare display label ────────────────────────
const normalizeLabel = (label: string): string => {
  const l = label.toLowerCase();

  // Exact overrides first
  const labelMap: Record<string, string> = {
    // OPD
    "opd registration":          "Outpatient Registration (OPD)",
    "opd center":                "Outpatient Registration (OPD)",
    "opd registration desk":     "Outpatient Registration (OPD)",
    "vital assessment":          "Outpatient Registration (OPD)",
    "opd queue":                 "OPD Consultation Queue",
    "consulting mgmt.":          "OPD Consultation Queue",
    "consultation desk":         "Consultation Desk",
    "patient scheduling":        "Patient Scheduling",
    "appointment list":          "Patient Scheduling",
    "advanced scheduling console": "Doctor's Schedule",
    "enterprise scheduling console": "Doctor's Schedule",
    "doctor availability":       "Doctor's Schedule",
    "patient register":          "Patient Register",
    // IPD
    "admission desk":            "Inpatient Admission (IPD)",
    "ipd admission desk":        "Inpatient Admission (IPD)",
    "ipd admission hub":         "Inpatient Admission (IPD)",
    "ipd bed map":               "Bed Management",
    "discharge summaries":       "Discharge & Summary",
    "discharge process":         "Discharge & Summary",
    "ipd census & daycare":      "IPD Census & Daycare",
    // Diagnostics
    "laboratory":                "Laboratory & Diagnostics",
    "laboratory / diagnostics":  "Laboratory & Diagnostics",
    "lab":                       "Laboratory & Diagnostics",
    "diagnostic center":         "Laboratory & Diagnostics",
    "ai lab assistant":          "AI Diagnostic Assistant",
    "pharmacy dashboard":        "Pharmacy Management",
    "pharmacy hub":              "Pharmacy Management",
    "prescription queue":        "Medication Dispensing",
    "stock inventory":           "Pharmacy Stock",
    // Billing
    "central billing":           "Central Billing",
    "laboratory billing":        "Central Billing",
    "pharmacy billing":          "Central Billing",
    "opd billing":               "Central Billing",
    "consultation billing":      "Central Billing",
    "discharge billing":         "Central Billing",
    "invoicing & billing":       "Central Billing",
    "opd billing & revenue center": "Central Billing",
    "ipd & discharge billing":   "Central Billing",
    "insurance & claims":        "Insurance & TPA Claims Management",
    "finance & compliance":      "Finance & Compliance",
    // Analytics
    "operations analytics":      "Clinical Analytics",
    "operational analytics":     "Clinical Analytics",
    "performance insights":      "Clinical Analytics",
    "alert center":              "Clinical Analytics",
    "patient crm":               "Patient Relationship Management (CRM)",
    "clinical intelligence hub": "Clinical Analytics",
    // HR & Non-Clinical Ops
    "hrms":                      "Human Resource Management System",
    "hr management (hrms)":      "Human Resource Management System",
    "duty roster":               "Human Resource Management System",
    "payroll":                   "Payroll & Compensation Processing",
    "payroll processing":        "Payroll & Compensation Processing",
    "procurement":               "Procurement & Supply Chain Management",
    "pharmacy inventory":        "Pharmacy Inventory & Stock Control",
    // Communication
    "message board":             "Message Board",
    "mail management":           "Mail & Communications",
    "mail & communications":     "Mail & Communications",
    "whatsapp reminders":        "WhatsApp Reminders",
    "follow-up center":          "WhatsApp Reminders",
    // System
    "hospital settings (masters)": "Hospital Settings",
    "branding & ui settings":    "Hospital Branding & User Interface",
    "branding settings":         "Hospital Branding & User Interface",
    "branding & ui":             "Hospital Branding & User Interface",
    "staff management":          "Staff & Access Control (RBAC)",
    "user management":           "Staff & Access Control (RBAC)",
    "staff & access":            "Staff & Access Control (RBAC)",
    "staff & access control":    "Staff & Access Control (RBAC)",
    "ticketing management system": "Support Tickets",
    "help & support":            "Support Tickets",
    "support & tickets":         "Support Tickets",
    "helpdesk":                  "Help Desk",
    "help desk":                 "Help Desk",
    "clinical & financial archives": "Clinical Archives",
    "clinical archives":         "Clinical Archives",
    "tenant sensitive configs":  "Secure Configurations",
  };

  if (labelMap[l]) return labelMap[l];

  // Partial matches
  if (l.includes("doctor availability") || l.includes("advanced scheduling")) return "Doctor's Schedule";
  if (l.includes("patient scheduling"))   return "Patient Scheduling";
  if (l.includes("prescription queue"))   return "Medication Dispensing";
  if (l.includes("clinical & financial archives")) return "Clinical Archives";
  if (l.includes("mail & communications")) return "Mail & Communications";
  if (l.includes("hospital settings"))    return "Hospital Settings";

  return label; // pass-through for anything not mapped
};

// ─── Sidebar Component ────────────────────────────────────────────────────────
export default function Sidebar() {
  const location = useLocation();
  const tenantName = getNamespacedItem('tenantName') || localStorage.getItem("tenantName") || "Jioplix Hospital";
  const plan = (localStorage.getItem("tenantPlan") || "basic").toLowerCase();
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const sidebarLogoUrl = getTenantBrandingConfig()
    ? (normalizeLogoUrl(getNamespacedItem('theme_logo_url')) || '/logo.png')
    : '/logo.png';

  // Role helpers
  const isAdmin       = role.includes("admin") || role.includes("nexus");
  const isClinical    = isAdmin || ["doctor", "nurse", "receptionist"].includes(role);
  const isDoctor      = isAdmin || role === "doctor";
  const isPharmacist  = isAdmin || role === "pharmacist";
  const isLabTech     = isAdmin || role === "lab_technician";
  const isBilling     = isAdmin || role === "billing_staff" || role === "billing";

  // Plan tier helpers
  const atLeastStandard     = ["standard", "professional", "enterprise"].includes(plan);
  const atLeastProfessional = ["professional", "enterprise"].includes(plan);
  const isEnterprise        = plan === "enterprise";

  const { groups, ungroupped } = useMemo(() => {
    let dm = JSON.parse(localStorage.getItem("userMenus") || "[]");

    // ── Inject synthetic menu items that the backend RBAC may omit ──────────
    const hasSome = (keyword: string) =>
      dm.some((m: any) => m.label.toLowerCase().includes(keyword.toLowerCase()));

    // OPD
    if (isClinical && !hasSome("patient scheduling") && !hasSome("appointment list"))
      dm.push({ label: "Patient Scheduling", path: "/tenant/appointments", icon: "Calendar", sort_order: 5 });

    if (isDoctor && !hasSome("advanced scheduling console") && !hasSome("doctor's schedule"))
      dm.push({ label: "Advanced Scheduling Console", path: "/tenant/appointments/doctor-calendar?tab=Operational+Calendar", icon: "CalendarDays", sort_order: 9 });

    if (isClinical && !hasSome("patient register"))
      dm.push({ label: "Patient Register", path: "/tenant/clinical/patient-register", icon: "ClipboardList", sort_order: 11 });

    // IPD
    if (atLeastProfessional && isClinical && !hasSome("clinical & financial archives") && !hasSome("clinical archives"))
      dm.push({ label: "Clinical & Financial Archives", path: "/tenant/archives", icon: "Archive", sort_order: 10 });

    // Admin-only injections
    if (isAdmin) {
      if (!hasSome("branding settings") && !hasSome("branding & ui"))
        dm.push({ label: "Branding Settings", path: "/tenant/settings", icon: "Palette", sort_order: 50 });

      if (!hasSome("tenant sensitive configs") && !hasSome("secure configurations"))
        dm.push({ label: "Tenant Sensitive Configs", path: "/tenant/settings/secure", icon: "ShieldCheck", sort_order: 51 });

      if (atLeastProfessional && !hasSome("operations analytics") && !hasSome("clinical analytics"))
        dm.push({ label: "Operations Analytics", path: "/tenant/analytics/ops", icon: "TrendingUp", sort_order: 30 });

      if (atLeastProfessional && !hasSome("patient crm"))
        dm.push({ label: "Patient CRM", path: "/tenant/crm", icon: "Users", sort_order: 31 });

      if (atLeastProfessional && !hasSome("payroll"))
        dm.push({ label: "Payroll", path: "/tenant/payroll", icon: "Receipt", sort_order: 40 });

      if (atLeastProfessional && !hasSome("hrms") && !hasSome("duty roster"))
        dm.push({ label: "HRMS", path: "/tenant/hrms", icon: "ClipboardList", sort_order: 41 });

      if (atLeastProfessional && !hasSome("procurement"))
        dm.push({ label: "Procurement", path: "/tenant/procurement", icon: "Box", sort_order: 42 });

      if (atLeastProfessional && !hasSome("pharmacy inventory"))
        dm.push({ label: "Pharmacy Inventory", path: "/tenant/inventory", icon: "Box", sort_order: 43 });

      if (atLeastProfessional && !hasSome("finance & compliance"))
        dm.push({ label: "Finance & Compliance", path: "/tenant/finance", icon: "Receipt", sort_order: 44 });

      if (atLeastProfessional && !hasSome("facility management"))
        dm.push({ label: "Facility Management", path: "/tenant/facility", icon: "Building2", sort_order: 45 });

      if (atLeastProfessional && !hasSome("patient portal"))
        dm.push({ label: "Patient Portal", path: "/tenant/patient-portal", icon: "Users", sort_order: 46 });
    }

    if (atLeastStandard && isPharmacist) {
      if (!hasSome("procurement & suppliers"))
        dm.push({ label: "Procurement & Suppliers", path: "/tenant/inventory", icon: "Users", sort_order: 34 });
      if (!hasSome("pharmacy reports"))
        dm.push({ label: "Pharmacy Reports", path: "/tenant/pharmacy", icon: "BarChart2", sort_order: 35 });
    }

    if (atLeastStandard) {
      if (!hasSome("radiology & imaging"))
        dm.push({ label: "Radiology & Imaging", path: "/tenant/radiology", icon: "Activity", sort_order: 22 });
      if (!hasSome("operation theatre"))
        dm.push({ label: "Operation Theatre", path: "/tenant/ot", icon: "Activity", sort_order: 23 });
      if (!hasSome("blood bank"))
        dm.push({ label: "Blood Bank", path: "/tenant/blood-bank", icon: "Activity", sort_order: 24 });
      if (!hasSome("ai diagnostic assistant") && !hasSome("clinical decision support"))
        dm.push({ label: "AI Diagnostic Assistant", path: "/tenant/lab/ai", icon: "Cpu", sort_order: 25 });
    }

    // Automation testing fallback menus
    if (localStorage.getItem('isAutomation') === 'true') {
      const fallback = [
        { label: 'Central Billing',   path: '/billing',                      icon: 'Receipt' },
        { label: 'Vital Assessment',  path: '/tenant/opd/registration',      icon: 'Users' },
        { label: 'Consulting Mgmt.',  path: '/tenant/opd/queue',             icon: 'RefreshCw' },
        { label: 'Prescription Queue', path: '/tenant/pharmacy/queue',       icon: 'Pill' },
        { label: 'Laboratory',        path: '/tenant/lab',                   icon: 'FlaskConical' },
      ];
      fallback.forEach(fm => {
        if (!dm.some((m: any) => m.label.toLowerCase() === fm.label.toLowerCase())) dm.push(fm);
      });
    }

    // ── Normalise labels & deduplicate ───────────────────────────────────────
    const uniqueMap = new Map();
    dm.forEach((m: any) => {
      const mappedLabel = normalizeLabel(m.label);
      const nPath = normalizePath(m.label, m.path);
      if (!uniqueMap.has(mappedLabel)) uniqueMap.set(mappedLabel, { ...m, label: mappedLabel, path: nPath });
    });
    const pm = Array.from(uniqueMap.values());

    // ── Group definitions ────────────────────────────────────────────────────
    // Define canonical ordered labels per group
    const opdFlow = [
      "OPD Registration",
      "Outpatient Registration (OPD)",
      "Doctor's Queue",
      "OPD Queue",
      "OPD Consultation Queue",
      "Consultation Desk",
      "Patient Scheduling",
      "Doctor's Schedule",
      "Advanced Scheduling Console",
      "Patient Register",
      "Clinical Archives",
    ];
    const ipdFlow = [
      "Admission Desk",
      "Inpatient Admission (IPD)",
      "IPD Bed Map",
      "Bed Management",
      "IPD Census & Daycare",
      "Discharge Summaries",
      "Discharge & Summary",
      "Clinical & Financial Archives",
      "Clinical Archives",
    ];
    const diagnosticsFlow = [
      "Laboratory",
      "Laboratory & Diagnostics",
      "Radiology & Imaging",
      "Operation Theatre",
      "Blood Bank",
      "AI Diagnostic Assistant",
    ];
    const pharmacyFlow = [
      "Pharmacy Dashboard",
      "Pharmacy Management",
      "Pharmacy Hub",
      "Prescription Queue",
      "Medication Dispensing",
      "Pharmacy Inventory",
      "Pharmacy Inventory & Stock Control",
      "Stock Inventory",
      "Pharmacy Stock",
      "Procurement & Suppliers",
      "Pharmacy Reports",
    ];
    const billingFlow = [
      "Invoicing & Billing",
      "Central Billing",
      "Insurance & TPA Claims Management",
      "Finance & Compliance",
    ];
    const nonClinicalFlow = [
      // Workforce Management
      "Human Resource Management System",
      "HRMS",
      "Payroll & Compensation Processing",
      "Payroll",
      // Supply Chain
      "Procurement & Supply Chain Management",
      "Procurement",
      // Facility Management
      "Facility Management",
    ];
    const reportsAnalyticsFlow = [
      "Clinical Analytics",
      "Operations Analytics",
      "Performance Insights",
      "Alert Center",
    ];
    const commFlow = [
      "Patient CRM",
      "Patient Relationship Management (CRM)",
      "Message Board",
      "Mail & Communications",
      "Mail Management",
      "Reminder Tracker",
      "WhatsApp Reminders",
      "Patient Portal",
    ];
    const adminFlow = [
      "Hospital Settings (Masters)",
      "Hospital Settings",
      "Branding & UI Settings",
      "Branding Settings",
      "Hospital Branding & User Interface",
      "Staff & RBAC",
      "Staff & Access Control (RBAC)",
      "Secure Configurations",
      "Tenant Sensitive Configs",
      "Ticketing Management System",
      "Support Tickets",
      "Help Desk",
    ];

    const getItems = (labels: string[]) =>
      pm
        .filter(m => labels.some(l => l.toLowerCase() === m.label.toLowerCase()))
        .map(m => ({
          ...m,
          originalLabel: m.label,
          label: ALIAS_MAP[m.label.toLowerCase()] || m.label
        }))
        .filter((item, index, self) =>
          self.findIndex(t => t.label === item.label) === index
        )
        .sort((a, b) =>
          labels.findIndex(l => l.toLowerCase() === a.originalLabel.toLowerCase()) -
          labels.findIndex(l => l.toLowerCase() === b.originalLabel.toLowerCase())
        );

    const gs = [
      {
        id: 'patient_care',
        title: "Patient Care",
        icon: HeartPulse,
        isParent: true,
        subGroups: [
          {
            id: 'opd',
            title: "Outpatient (OPD)",
            items: getItems(opdFlow).filter(i => {
              if (i.originalLabel === "Doctor's Schedule" && !isDoctor) return false;
              return true;
            }),
            icon: HeartPulse,
            badge: null,
          },
          {
            id: 'ipd',
            title: "Inpatient (IPD)",
            items: getItems(ipdFlow).filter(() => {
              if (!atLeastProfessional) return false;
              if (!isClinical) return false;
              return true;
            }),
            icon: Bed,
            badge: !atLeastProfessional ? "Professional+" : null,
          }
        ]
      },
      {
        id: 'clinical_services',
        title: "Clinical Services",
        items: getItems(diagnosticsFlow).filter(i => {
          if (!atLeastStandard) return false;
          if (i.originalLabel === "AI Diagnostic Assistant" && !isEnterprise) return false;
          if (["laboratory", "laboratory & diagnostics"].includes(i.originalLabel?.toLowerCase()) && !isLabTech && !isAdmin && !isDoctor) return false;
          return true;
        }),
        icon: Stethoscope,
        badge: !atLeastStandard ? "Standard+" : null,
      },
      {
        id: 'pharmacy',
        title: "Pharmacy",
        items: getItems(pharmacyFlow).filter(() => {
          if (!atLeastStandard) return false;
          if (!isPharmacist && !isAdmin && !isDoctor) return false;
          return true;
        }),
        icon: Pill,
        badge: !atLeastStandard ? "Standard+" : null,
      },
      {
        id: 'billing_finance',
        title: "Billing & Finance",
        items: getItems(billingFlow).filter(i => {
          if (i.originalLabel === "Finance & Compliance" && !isEnterprise) return false;
          if (!isBilling && !isAdmin) return false;
          return true;
        }),
        icon: Receipt,
        badge: null,
      },
      {
        id: 'hospital_operations',
        title: "Hospital Operations",
        items: getItems(nonClinicalFlow).filter(() => {
          return atLeastProfessional;
        }),
        icon: Building2,
        badge: !atLeastProfessional ? "Professional+" : null,
      },
      {
        id: 'reports_analytics',
        title: "Reports & Analytics",
        items: getItems(reportsAnalyticsFlow).filter(() => {
          if (!atLeastProfessional || !isAdmin) return false;
          return true;
        }),
        icon: BarChart2,
        badge: !atLeastProfessional ? "Professional+" : null,
      },
      {
        id: 'patient_engagement',
        title: "Patient Engagement",
        items: getItems(commFlow).filter(i => {
          const name = i.originalLabel?.toLowerCase();
          if (["patient relationship management (crm)", "patient crm"].includes(name)) {
            return atLeastProfessional;
          }
          return true;
        }),
        icon: MessageSquare,
        badge: null,
      },
      {
        id: 'admin',
        title: "Administration",
        items: getItems(adminFlow).filter(i => {
          if (!isAdmin) return false;
          if ((i.originalLabel === "Help Desk" || i.originalLabel === "Support Tickets" || i.originalLabel === "Ticketing Management System") && !atLeastStandard) return false;
          return true;
        }),
        icon: Settings,
        badge: null,
      },
    ];

    const gLabels = new Set<string>();
    gs.forEach(g => {
      if (g.subGroups) {
        g.subGroups.forEach((sg: any) => sg.items.forEach((i: any) => {
          if (i.originalLabel) gLabels.add(i.originalLabel.toLowerCase());
          gLabels.add(i.label.toLowerCase());
        }));
      } else {
        g.items.forEach((i: any) => {
          if (i.originalLabel) gLabels.add(i.originalLabel.toLowerCase());
          gLabels.add(i.label.toLowerCase());
        });
      }
    });

    // Main top-level platform dashboard link ONLY
    const mainDashboardMatches = pm.filter(m =>
      m.path === '/tenant/dashboard' ||
      m.path === '/nexus/dashboard' ||
      m.label.toLowerCase() === 'dashboard'
    );
    const mainDashboard = mainDashboardMatches.length > 0
      ? [mainDashboardMatches[0]]
      : [{ label: 'Dashboard', path: '/tenant/dashboard', icon: 'Dashboard' }];

    // Leftover unmapped items (excluding main platform dashboard) -> sweep into Hospital Operations
    const ug = pm.filter(m =>
      !gLabels.has(m.label.toLowerCase()) &&
      m.path !== '/tenant/dashboard' &&
      m.path !== '/nexus/dashboard' &&
      m.label.toLowerCase() !== 'dashboard'
    );

    if (ug.length > 0) {
      const hoGroup = gs.find(g => g.id === 'hospital_operations');
      if (hoGroup) {
        hoGroup.items = [...hoGroup.items, ...ug];
      }
    }

    return { groups: gs, ungroupped: mainDashboard };
  }, []);

  const [openParent, setOpenParent] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const lastScrolledRoute = useRef<string>('');

  const matchesLocation = (to: string) => {
    const [path, query] = to.split('?');
    if (location.pathname !== path) return false;
    if (!query) return location.search === "" || location.search === "?";
    const currentParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(query.replace(/\+/g, ' '));
    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  };

  useLayoutEffect(() => {
    const nav = sidebarRef.current;
    if (!nav) return;
    const currentRoute = `${location.pathname}${location.search}`;
    if (lastScrolledRoute.current === currentRoute) return;
    let activeGroupId = "";
    let activeParentId = "";
    groups.forEach(g => {
      if (g.subGroups) {
        const matchingSub = g.subGroups.find((sg: any) => sg.items?.some((i: any) => matchesLocation(i.path)));
        if (matchingSub) {
          activeGroupId = matchingSub.id;
          activeParentId = g.id;
        }
      } else if (g.items?.some((i: any) => matchesLocation(i.path))) {
        activeGroupId = g.id;
      }
    });

    if (activeParentId && openParent !== activeParentId) {
      setOpenParent(activeParentId);
    }
    if (activeGroupId && openGroup !== activeGroupId) {
      setOpenGroup(activeGroupId);
      return;
    }
    const activeLink = nav.querySelector('.nav-item.active') as HTMLElement | null;
    if (!activeLink) return;
    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const relativeTop = linkRect.top - navRect.top;
    if (relativeTop < 0 || relativeTop + linkRect.height > navRect.height) {
      nav.scrollTop = Math.max(0, nav.scrollTop + relativeTop - navRect.height / 2 + linkRect.height / 2);
    }
    lastScrolledRoute.current = currentRoute;
  }, [location.pathname, location.search, openGroup, openParent, groups]);

  const toggleParent = (id: string) => {
    setOpenParent(prev => (prev === id ? null : id));
    setOpenGroup(null);
  };

  const toggleGroup = (id: string) => {
    setOpenGroup(prev => (prev === id ? null : id));
  };

  const refreshMenus = () => {
    localStorage.removeItem("userMenus");
    window.location.reload();
  };

  // Plan badge color
  const planColor = isEnterprise ? '#f59e0b' : atLeastProfessional ? '#a78bfa' : atLeastStandard ? '#38bdf8' : '#64748b';

  return (
    <>
      <div className="mobile-overlay" onClick={() => {
        document.querySelector('.sidebar')?.classList.remove('mobile-open');
        document.querySelector('.mobile-overlay')?.classList.remove('active');
      }}></div>

      <div className="sidebar" style={{ width: '300px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <button
          className="sidebar-close"
          onClick={() => {
            document.querySelector('.sidebar')?.classList.remove('mobile-open');
            document.querySelector('.mobile-overlay')?.classList.remove('active');
          }}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', zIndex: 1002 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Logo / Tenant Brand */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <img
              src={sidebarLogoUrl}
              alt={tenantName}
              style={{ width: 'auto', maxWidth: '180px', height: 'auto', maxHeight: '52px', objectFit: 'contain', cursor: 'pointer', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const parent = img.parentElement;
                if (parent) {
                  parent.innerHTML = `<div style="width:42px;height:42px;background:linear-gradient(135deg,#0ea5e9,#34d399);border-radius:12px;margin:8px auto;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:white;">${tenantName.charAt(0)}</div><h2 style="font-size:15px;font-weight:800;color:white;margin-top:8px;letter-spacing:-0.3px;">${tenantName}</h2>`;
                }
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{
                fontSize: '9px', fontWeight: 900, color: planColor,
                textTransform: 'uppercase', background: 'rgba(255,255,255,0.08)',
                padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.6px',
                border: `1px solid ${planColor}40`
              }}>{plan} plan</span>
              <button onClick={refreshMenus} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="Sync / Refresh Menus">
                <RefreshCw size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav ref={sidebarRef} className="nav-container" style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {/* Ungrouped items (e.g. main Dashboard) */}
          {ungroupped.map((menu, idx) => (
            <SidebarLink key={idx} to={menu.path} icon={Icons[menu.label] || Icons[menu.icon] || LayoutDashboard} label={menu.label} />
          ))}

          {/* Grouped sections */}
          {groups.map((group) => {
            if (group.isParent) {
              const hasVisibleItems = group.subGroups?.some((sg: any) => sg.items.length > 0);
              if (!hasVisibleItems) return null;
              const isParentOpen = openParent === group.id;
              return (
                <div key={group.id} style={{ marginBottom: '4px' }}>
                  {/* Collapsible Parent Group Button */}
                  <button
                    onClick={() => toggleParent(group.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', background: 'none', border: 'none',
                      color: isParentOpen ? 'white' : 'var(--sidebar-text, #94a3b8)',
                      cursor: 'pointer', fontSize: '11px', fontWeight: 800, borderRadius: '10px',
                      textTransform: 'uppercase', letterSpacing: '0.6px',
                    }}
                  >
                    <group.icon size={15} style={{ opacity: isParentOpen ? 1 : 0.5, flexShrink: 0 }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{group.title}</span>
                    <ChevronDown size={13} style={{ transform: isParentOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', opacity: 0.6, flexShrink: 0 }} />
                  </button>

                  {/* Render subgroups inside container */}
                  <div style={{
                    maxHeight: isParentOpen ? '1000px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    paddingLeft: '6px',
                    borderLeft: isParentOpen ? '1px solid rgba(0,120,255,0.15)' : '1px solid transparent',
                    marginLeft: '10px',
                  }}>
                    {group.subGroups?.map((subGroup: any) => {
                      if (subGroup.items.length === 0) return null;
                      return (
                        <div key={subGroup.id} style={{ marginBottom: '4px' }}>
                          <button
                            onClick={() => toggleGroup(subGroup.id)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 14px', background: 'none', border: 'none',
                              color: openGroup === subGroup.id ? 'white' : 'var(--sidebar-text, #94a3b8)',
                              cursor: 'pointer', fontSize: '11px', fontWeight: 800, borderRadius: '10px',
                              textTransform: 'uppercase', letterSpacing: '0.6px',
                            }}
                          >
                            <subGroup.icon size={15} style={{ opacity: openGroup === subGroup.id ? 1 : 0.5, flexShrink: 0 }} />
                            <span style={{ flex: 1, textAlign: 'left' }}>{subGroup.title}</span>
                            {subGroup.badge && (
                              <span style={{
                                fontSize: '8px', fontWeight: 800, color: '#64748b',
                                background: 'rgba(255,255,255,0.05)', padding: '2px 6px',
                                borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.3px'
                              }}>{subGroup.badge}</span>
                            )}
                            <ChevronDown size={13} style={{ transform: openGroup === subGroup.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', opacity: 0.6, flexShrink: 0 }} />
                          </button>

                          <div style={{
                            maxHeight: openGroup === subGroup.id ? '1000px' : '0',
                            overflow: 'hidden',
                            transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            paddingLeft: '6px',
                            borderLeft: openGroup === subGroup.id ? '1px solid rgba(0,120,255,0.15)' : '1px solid transparent',
                            marginLeft: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}>
                            {subGroup.items.map((menu: any, mIdx: number) => (
                              <SidebarLink
                                key={mIdx}
                                to={menu.path}
                                icon={Icons[menu.originalLabel] || Icons[menu.label] || Icons[menu.icon] || Box}
                                label={menu.label}
                                isSubItem
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Normal single-level group
            if (!group.items || group.items.length === 0) return null;
            return (
              <div key={group.id} style={{ marginBottom: '4px' }}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', background: 'none', border: 'none',
                    color: openGroup === group.id ? 'white' : 'var(--sidebar-text, #94a3b8)',
                    cursor: 'pointer', fontSize: '11px', fontWeight: 800, borderRadius: '10px',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                  }}
                >
                  <group.icon size={15} style={{ opacity: openGroup === group.id ? 1 : 0.5, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{group.title}</span>
                  {group.badge && (
                    <span style={{
                      fontSize: '8px', fontWeight: 800, color: '#64748b',
                      background: 'rgba(255,255,255,0.05)', padding: '2px 6px',
                      borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.3px'
                    }}>{group.badge}</span>
                  )}
                  <ChevronDown size={13} style={{ transform: openGroup === group.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', opacity: 0.6, flexShrink: 0 }} />
                </button>

                <div style={{
                  maxHeight: openGroup === group.id ? '1000px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  paddingLeft: '8px',
                  borderLeft: openGroup === group.id ? '1px solid rgba(0,120,255,0.15)' : '1px solid transparent',
                  marginLeft: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}>
                  {group.items.map((menu: any, mIdx: number) => (
                    <SidebarLink
                      key={mIdx}
                      to={menu.path}
                      icon={Icons[menu.originalLabel] || Icons[menu.label] || Icons[menu.icon] || Box}
                      label={menu.label}
                      isSubItem
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer branding */}
        <div style={{ padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
            <span>Powered by</span>
            <span style={{
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #38bdf8 0%, #0da58e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px'
            }}>Cybelinx</span>
          </div>
        </div>
        <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={16} color="#0ea5e9" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Nexus Secured</div>
              <div style={{ fontSize: '10px', color: '#94b8d4' }}>v2.4.0 Build 102</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nav-container {
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          color: var(--sidebar-text, #94a3b8);
          text-decoration: none;
          font-size: 12.5px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 2px;
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .nav-item span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: white;
          border-color: rgba(255, 255, 255, 0.04);
          transform: translateX(3px);
        }
        .nav-item.active {
          background: linear-gradient(135deg, rgba(0, 86, 168, 0.28) 0%, rgba(0, 86, 168, 0.10) 100%);
          color: #7ec4ff;
          border-color: rgba(0, 120, 255, 0.3);
          box-shadow: 0 4px 12px rgba(0, 86, 168, 0.12);
        }
        .nav-item.active::after {
          content: "";
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          background: #0078FF;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 8px #0078FF;
        }
        .nav-item.sub-item {
          font-size: 11.5px;
          padding: 7px 8px;
        }
        .main-content { min-width: 0; }

        @media (max-width: 1023px) {
          .sidebar {
            position: fixed !important;
            left: -340px;
            top: 0;
            width: 300px !important;
            height: 100vh !important;
            overflow-y: auto !important;
            z-index: 1002;
            transition: left 0.25s ease;
          }
          .sidebar.mobile-open { left: 0 !important; }
          .mobile-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            z-index: 1001;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
          }
          .mobile-overlay.active { opacity: 1; pointer-events: auto; }
          body { overflow-x: hidden; }
        }
      `}</style>
    </>
  );
}

function SidebarLink({ to, icon: Icon, label, isSubItem }: { to: string; icon: any; label: string; isSubItem?: boolean }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}${isSubItem ? ' sub-item' : ''}`}
    >
      <Icon size={isSubItem ? 14 : 17} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: '1.4' }}>{label}</span>
    </NavLink>
  );
}

