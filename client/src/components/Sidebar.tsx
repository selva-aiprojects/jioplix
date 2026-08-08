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
    "pharmacy management":       "/tenant/pharmacy/dashboard",
    "pharmacy hub":              "/tenant/pharmacy",
    "pharmacy dashboard":        "/tenant/pharmacy/dashboard",
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
    "finance & compliance":      "/tenant/finance",
    // Analytics
    "clinical analytics":        "/tenant/analytics/ops",
    "operations analytics":      "/tenant/analytics/ops",
    "performance insights":      "/tenant/analytics/performance",
    "alert center":              "/tenant/analytics/alerts",
    "patient crm":               "/tenant/crm",
    // HR & Operations
    "hr management (hrms)":      "/tenant/hrms",
    "hrms":                      "/tenant/hrms",
    "duty roster":               "/tenant/hrms",
    "payroll processing":        "/tenant/payroll",
    "payroll":                   "/tenant/payroll",
    "procurement":               "/tenant/procurement",
    "pharmacy inventory":        "/tenant/inventory",
    // Communication
    "message board":             "/tenant/communication",
    "mail & communications":     "/tenant/mail",
    "whatsapp reminders":        "/tenant/reminders",
    "follow-up center":          "/tenant/reminders",
    // System
    "hospital settings":         "/tenant/masters",
    "hospital settings (masters)": "/tenant/masters",
    "branding & ui":             "/tenant/settings",
    "branding settings":         "/tenant/settings",
    "branding & ui settings":    "/tenant/settings",
    "staff & access control":    "/tenant/staff",
    "staff & access":            "/tenant/staff",
    "user management":           "/tenant/staff",
    "staff management":          "/tenant/staff",
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
    "opd registration":          "OPD Registration",
    "opd center":                "OPD Registration",
    "opd registration desk":     "OPD Registration",
    "vital assessment":          "OPD Registration",
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
    "admission desk":            "IPD Admission",
    "ipd admission desk":        "IPD Admission",
    "ipd admission hub":         "IPD Admission",
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
    "insurance & claims":        "Insurance & Claims",
    "finance & compliance":      "Finance & Compliance",
    // Analytics
    "operations analytics":      "Clinical Analytics",
    "operational analytics":     "Clinical Analytics",
    "performance insights":      "Clinical Analytics",
    "alert center":              "Clinical Analytics",
    "patient crm":               "Patient CRM",
    "clinical intelligence hub": "Clinical Analytics",
    // HR & Ops
    "hrms":                      "HR Management (HRMS)",
    "duty roster":               "HR Management (HRMS)",
    "payroll":                   "Payroll Processing",
    "pharmacy inventory":        "Pharmacy Inventory",
    // Communication
    "message board":             "Message Board",
    "mail management":           "Mail & Communications",
    "mail & communications":     "Mail & Communications",
    "whatsapp reminders":        "WhatsApp Reminders",
    "follow-up center":          "WhatsApp Reminders",
    // System
    "hospital settings (masters)": "Hospital Settings",
    "branding & ui settings":    "Branding & UI",
    "branding settings":         "Branding & UI",
    "staff management":          "Staff & Access Control",
    "user management":           "Staff & Access Control",
    "staff & access":            "Staff & Access Control",
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

      if (atLeastStandard && !hasSome("operations analytics") && !hasSome("clinical analytics"))
        dm.push({ label: "Operations Analytics", path: "/tenant/analytics/ops", icon: "TrendingUp", sort_order: 30 });

      if (atLeastStandard && !hasSome("patient crm"))
        dm.push({ label: "Patient CRM", path: "/tenant/crm", icon: "Users", sort_order: 31 });

      if (isEnterprise && !hasSome("payroll"))
        dm.push({ label: "Payroll", path: "/tenant/payroll", icon: "Receipt", sort_order: 40 });

      if (isEnterprise && !hasSome("hrms") && !hasSome("duty roster"))
        dm.push({ label: "HRMS", path: "/tenant/hrms", icon: "ClipboardList", sort_order: 41 });

      if (isEnterprise && !hasSome("procurement"))
        dm.push({ label: "Procurement", path: "/tenant/procurement", icon: "Box", sort_order: 42 });

      if (isEnterprise && !hasSome("pharmacy inventory"))
        dm.push({ label: "Pharmacy Inventory", path: "/tenant/inventory", icon: "Box", sort_order: 43 });

      if (isEnterprise && !hasSome("finance & compliance"))
        dm.push({ label: "Finance & Compliance", path: "/tenant/finance", icon: "Receipt", sort_order: 44 });
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
      "OPD Consultation Queue",
      "Consultation Desk",
      "Doctor's Queue",
      "Patient Register",
      "Patient Scheduling",
      "Doctor's Schedule",
      "Clinical Archives",
    ];
    const ipdFlow = [
      "IPD Admission",
      "Bed Management",
      "IPD Census & Daycare",
      "Discharge & Summary",
    ];
    const diagnosticsFlow = [
      "Laboratory & Diagnostics",
      "AI Diagnostic Assistant",
      "Pharmacy Management",
      "Medication Dispensing",
      "Pharmacy Stock",
    ];
    const billingFlow = [
      "Central Billing",
      "Insurance & Claims",
      "Finance & Compliance",
    ];
    const nonClinicalFlow = [
      "HR Management (HRMS)",
      "Payroll Processing",
      "Procurement",
      "Pharmacy Inventory",
      "Patient CRM",
    ];
    const commFlow = [
      "Message Board",
      "Mail & Communications",
      "WhatsApp Reminders",
    ];
    const adminFlow = [
      "Hospital Settings",
      "Branding & UI",
      "Staff & Access Control",
      "Help Desk",
      "Support Tickets",
      "Secure Configurations",
    ];

    const getItems = (labels: string[]) =>
      pm
        .filter(m => labels.some(l => l.toLowerCase() === m.label.toLowerCase()))
        .sort((a, b) =>
          labels.findIndex(l => l.toLowerCase() === a.label.toLowerCase()) -
          labels.findIndex(l => l.toLowerCase() === b.label.toLowerCase())
        );

    const gs = [
      {
        id: 'opd',
        title: "OPD & Clinical",
        items: getItems(opdFlow).filter(i => {
          // Doctor's Schedule visible to doctor + admin
          if (i.label === "Doctor's Schedule" && !isDoctor) return false;
          return true;
        }),
        icon: HeartPulse,
        badge: null,
      },
      {
        id: 'ipd',
        title: "Inpatient (IPD) Management",
        items: getItems(ipdFlow).filter(() => {
          if (!atLeastProfessional) return false;
          if (!isClinical) return false;
          return true;
        }),
        icon: Bed,
        badge: !atLeastProfessional ? "Professional+" : null,
      },
      {
        id: 'diagnostics',
        title: "Diagnostics & Pharmacy",
        items: getItems(diagnosticsFlow).filter(i => {
          if (!atLeastStandard) return false;
          if (i.label === "AI Diagnostic Assistant" && !isEnterprise) return false;
          if (i.label === "Pharmacy Management" || i.label === "Medication Dispensing" || i.label === "Pharmacy Stock") {
            if (!isPharmacist && !isAdmin && !isDoctor) return false;
          }
          if (i.label === "Laboratory & Diagnostics" && !isLabTech && !isAdmin && !isDoctor) return false;
          return true;
        }),
        icon: FlaskConical,
        badge: !atLeastStandard ? "Standard+" : null,
      },
      {
        id: 'billing',
        title: "Billing & Revenue",
        items: getItems(billingFlow).filter(i => {
          if (i.label === "Finance & Compliance" && !isEnterprise) return false;
          if (!isBilling && !isAdmin) return false;
          return true;
        }),
        icon: Receipt,
        badge: null,
      },
      {
        id: 'analytics',
        title: "Analytics & Intelligence",
        items: getItems(["Clinical Analytics"]).filter(() => {
          if (!atLeastStandard || !isAdmin) return false;
          return true;
        }),
        icon: BarChart2,
        badge: !atLeastStandard ? "Standard+" : null,
      },
      {
        id: 'nonclinical',
        title: "Non-Clinical Operations",
        items: getItems(nonClinicalFlow).filter(() => {
          if (!atLeastStandard) return false;
          return true;
        }),
        icon: Box,
        badge: !isEnterprise ? "Enterprise / Standard" : null,
      },
      {
        id: 'communication',
        title: "Communication",
        items: getItems(commFlow).filter(() => {
          if (!atLeastStandard) return false;
          return true;
        }),
        icon: MessageSquare,
        badge: !atLeastStandard ? "Standard+" : null,
      },
      {
        id: 'admin',
        title: "System Administration",
        items: getItems(adminFlow).filter(i => {
          if (!isAdmin) return false;
          if ((i.label === "Help Desk" || i.label === "Support Tickets") && !atLeastStandard) return false;
          return true;
        }),
        icon: Settings,
        badge: null,
      },
    ];

    const gLabels = new Set<string>();
    gs.forEach(g => g.items.forEach(i => gLabels.add(i.label.toLowerCase())));

    // Main top-level platform dashboard link ONLY
    const mainDashboardMatches = pm.filter(m =>
      m.path === '/tenant/dashboard' ||
      m.path === '/nexus/dashboard' ||
      m.label.toLowerCase() === 'dashboard'
    );
    const mainDashboard = mainDashboardMatches.length > 0
      ? [mainDashboardMatches[0]]
      : [{ label: 'Dashboard', path: '/tenant/dashboard', icon: 'Dashboard' }];

    // Leftover unmapped items (excluding main platform dashboard) -> sweep into Non-Clinical Operations
    const ug = pm.filter(m =>
      !gLabels.has(m.label.toLowerCase()) &&
      m.path !== '/tenant/dashboard' &&
      m.path !== '/nexus/dashboard' &&
      m.label.toLowerCase() !== 'dashboard'
    );

    if (ug.length > 0) {
      const ncGroup = gs.find(g => g.id === 'nonclinical');
      if (ncGroup) {
        ncGroup.items = [...ncGroup.items, ...ug];
      }
    }

    return { groups: gs, ungroupped: mainDashboard };
  }, []);

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
    const activeGroup = groups.find(g => g.items.some(i => matchesLocation(i.path)));
    if (activeGroup && openGroup !== activeGroup.id) {
      setOpenGroup(activeGroup.id);
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
  }, [location.pathname, location.search, openGroup, groups]);

  const toggleGroup = (id: string) => setOpenGroup(prev => (prev === id ? null : id));

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

      <div className="sidebar" style={{ width: '280px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
        <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', marginTop: '8px' }}>
          <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <img
              src={sidebarLogoUrl}
              alt={tenantName}
              style={{ width: 'auto', maxWidth: '160px', height: 'auto', maxHeight: '52px', objectFit: 'contain', cursor: 'pointer', borderRadius: '8px' }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const parent = img.parentElement;
                if (parent) {
                  parent.innerHTML = `<div style="width:42px;height:42px;background:linear-gradient(135deg,#0ea5e9,#34d399);border-radius:12px;margin:8px auto;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:white;">${tenantName.charAt(0)}</div><h2 style="font-size:15px;font-weight:800;color:white;margin-top:8px;letter-spacing:-0.3px;">${tenantName}</h2>`;
                }
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{
                fontSize: '9px', fontWeight: 900, color: planColor,
                textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)',
                padding: '2px 10px', borderRadius: '4px', letterSpacing: '0.5px',
                border: `1px solid ${planColor}30`
              }}>{plan} plan</span>
              <button onClick={refreshMenus} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }} title="Refresh menu">
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
          {groups.map((group) => group.items.length > 0 && (
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
              }}>
                {group.items.map((menu, mIdx) => (
                  <SidebarLink
                    key={mIdx}
                    to={menu.path}
                    icon={Icons[menu.label] || Icons[menu.icon] || Box}
                    label={menu.label}
                    isSubItem
                  />
                ))}
              </div>
            </div>
          ))}
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
          gap: 10px;
          padding: 9px 14px;
          border-radius: 10px;
          color: var(--sidebar-text, #94a3b8);
          text-decoration: none;
          font-size: 13px;
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
          font-size: 12.5px;
          padding: 8px 12px;
        }
        .main-content { min-width: 0; }

        @media (max-width: 1023px) {
          .sidebar {
            position: fixed !important;
            left: -320px;
            top: 0;
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
