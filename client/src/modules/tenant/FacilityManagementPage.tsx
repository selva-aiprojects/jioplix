import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Building2,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Cpu,
  FileText,
  Clock,
  Zap,
  Activity
} from "lucide-react";

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  department: string;
  serialNumber: string;
  vendor: string;
  lastPpmDate: string;
  nextPpmDate: string;
  status: "Operational" | "Maintenance_Due" | "Under_Breakdown";
}

const SAMPLE_ASSETS: Asset[] = [
  { id: "a1", assetTag: "AST-2026-001", name: "ICU Ventilator (Maquet Servo-i)", category: "Life Support", department: "ICU Ward 2", serialNumber: "SN-9812441", vendor: "Getinge India", lastPpmDate: "2026-06-15", nextPpmDate: "2026-12-15", status: "Operational" },
  { id: "a2", assetTag: "AST-2026-002", name: "Biphasic Defibrillator (Zoll R Series)", category: "Resuscitation", department: "Emergency ER", serialNumber: "SN-4412091", vendor: "Zoll Medical", lastPpmDate: "2026-07-01", nextPpmDate: "2026-08-15", status: "Maintenance_Due" },
  { id: "a3", assetTag: "AST-2026-003", name: "Anaesthesia Workstation (Drager Fabius)", category: "Surgical", department: "OT 1 (Cardiac)", serialNumber: "SN-1102938", vendor: "Drager Medical", lastPpmDate: "2026-05-10", nextPpmDate: "2026-11-10", status: "Operational" },
  { id: "a4", assetTag: "AST-2026-004", name: "Dialysis Machine (Fresenius 4008S)", category: "Renal Care", department: "Nephrology Ward", serialNumber: "SN-5541092", vendor: "Fresenius Medical", lastPpmDate: "2026-04-20", nextPpmDate: "2026-08-01", status: "Under_Breakdown" }
];

export default function FacilityManagementPage() {
  const [activeTab, setActiveTab] = useState<"assets" | "ppm" | "breakdown">("assets");
  const [assets, setAssets] = useState<Asset[]>(SAMPLE_ASSETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Facility &amp; Biomedical Asset Management" subtitle="High-Value Equipment Directory, PPM Maintenance Schedulers &amp; Breakdown Work Orders" />

        {/* Toast Alert */}
        {toastMessage && (
          <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
            background: "#0f172a", color: "#ffffff", padding: "14px 22px", borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px",
            border: "1px solid rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: 700
          }}>
            <Wrench size={18} color="#f59e0b" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HERO BANNER */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",
          borderRadius: "28px", padding: "32px 36px", color: "white", marginBottom: "28px",
          position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(71, 85, 105, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
                <Building2 size={14} color="#fde047" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#fef9c3", letterSpacing: "0.5px" }}>BIOMEDICAL ASSET &amp; INFRASTRUCTURE CONTROL</span>
              </div>
              <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
                Biomedical Facility &amp; Asset Management
              </h1>
              <p style={{ fontSize: "14px", color: "#cbd5e1", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
                Track medical device uptime, schedule planned preventive maintenance (PPM), manage AMC/CMC vendor contracts, and log breakdown repair work orders.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "28px" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 700, marginBottom: "4px" }}>Total Devices</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff" }}>{assets.length} Assets</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 700, marginBottom: "4px" }}>Operational Uptime</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#4ade80" }}>98.2% Uptime</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 700, marginBottom: "4px" }}>PPM Due Soon</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#fde047" }}>
                {assets.filter(a => a.status === "Maintenance_Due").length} Due
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 700, marginBottom: "4px" }}>Open Breakdown Tickets</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#f87171" }}>
                {assets.filter(a => a.status === "Under_Breakdown").length} Active
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
          <button
            onClick={() => setActiveTab("assets")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "assets" ? "#334155" : "#ffffff", color: activeTab === "assets" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "assets" ? "0 4px 12px rgba(51, 65, 85, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Building2 size={16} /> 1. Biomedical Equipment Directory ({filteredAssets.length})
          </button>

          <button
            onClick={() => setActiveTab("ppm")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "ppm" ? "#334155" : "#ffffff", color: activeTab === "ppm" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "ppm" ? "0 4px 12px rgba(51, 65, 85, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Calendar size={16} /> 2. Planned Maintenance (PPM) Scheduler
          </button>

          <button
            onClick={() => setActiveTab("breakdown")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "breakdown" ? "#334155" : "#ffffff", color: activeTab === "breakdown" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "breakdown" ? "0 4px 12px rgba(51, 65, 85, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Wrench size={16} /> 3. Breakdown Work Order Desk
          </button>
        </div>

        {/* TAB 1: ASSETS TABLE */}
        {activeTab === "assets" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Asset Tag, Device Name, Location..."
                style={{ width: "100%", maxWidth: "400px", padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px" }}>Asset Tag</th>
                  <th style={{ padding: "12px 16px" }}>Equipment Name</th>
                  <th style={{ padding: "12px 16px" }}>Category</th>
                  <th style={{ padding: "12px 16px" }}>Department Location</th>
                  <th style={{ padding: "12px 16px" }}>Vendor / Contract</th>
                  <th style={{ padding: "12px 16px" }}>Next PPM Due</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{a.assetTag}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{a.name}</td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{a.category}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#334155" }}>{a.department}</td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{a.vendor}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#475569" }}>{a.nextPpmDate}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800,
                        background: a.status === "Operational" ? "#f0fdf4" : a.status === "Maintenance_Due" ? "#fffbe6" : "#fef2f2",
                        color: a.status === "Operational" ? "#166534" : a.status === "Maintenance_Due" ? "#92400e" : "#dc2626"
                      }}>
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PPM */}
        {activeTab === "ppm" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px 0", color: "#0f172a" }}>Upcoming PPM Maintenance Routines</h3>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              Automated PPM calendar reminders sent to Vendor Service Engineers 14 days prior to due date.
            </div>
          </div>
        )}

        {/* TAB 3: BREAKDOWN */}
        {activeTab === "breakdown" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px 0", color: "#0f172a" }}>Active Breakdown Work Order Desk</h3>
            <button onClick={() => showToast("Work Order Logged!")} style={{ padding: "10px 20px", background: "#334155", color: "white", border: "none", borderRadius: "12px", fontWeight: 800, cursor: "pointer" }}>
              Log Breakdown Ticket
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
