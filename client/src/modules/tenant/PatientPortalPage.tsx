import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  User,
  FileText,
  CreditCard,
  Calendar,
  Download,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles
} from "lucide-react";

export default function PatientPortalPage() {
  const [activeTab, setActiveTab] = useState<"card" | "reports" | "billing">("card");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Patient Experience &amp; Self-Service Portal" subtitle="Digital ABHA Health Card, Diagnostic PDF Reports &amp; Billing Receipts" />

        {/* Toast Alert */}
        {toastMessage && (
          <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
            background: "#0f172a", color: "#ffffff", padding: "14px 22px", borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px",
            border: "1px solid rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: 700
          }}>
            <Sparkles size={18} color="#a855f7" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HERO BANNER */}
        <div style={{
          background: "linear-gradient(135deg, #2e1065 0%, #581c87 50%, #7e22ce 100%)",
          borderRadius: "28px", padding: "32px 36px", color: "white", marginBottom: "28px",
          position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(126, 34, 206, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
                <User size={14} color="#e9d5ff" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f3e8ff", letterSpacing: "0.5px" }}>ABDM M1 &amp; M2 CONNECTED PATIENT HUB</span>
              </div>
              <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
                Patient Self-Service Portal
              </h1>
              <p style={{ fontSize: "14px", color: "#e9d5ff", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
                Access digital health ID, view diagnostic lab reports, download tax invoices, and manage appointment bookings.
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
          <button
            onClick={() => setActiveTab("card")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "card" ? "#7e22ce" : "#ffffff", color: activeTab === "card" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "card" ? "0 4px 12px rgba(126, 34, 206, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <QrCode size={16} /> 1. Digital ABHA Health Card
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "reports" ? "#7e22ce" : "#ffffff", color: activeTab === "reports" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "reports" ? "0 4px 12px rgba(126, 34, 206, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <FileText size={16} /> 2. Diagnostic Reports Hub
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "billing" ? "#7e22ce" : "#ffffff", color: activeTab === "billing" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "billing" ? "0 4px 12px rgba(126, 34, 206, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <CreditCard size={16} /> 3. Invoices &amp; Receipts
          </button>
        </div>

        {/* TAB 1: ABHA CARD */}
        {activeTab === "card" && (
          <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", maxWidth: "520px" }}>
            <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)", borderRadius: "20px", padding: "24px", color: "white", boxShadow: "0 10px 25px rgba(76, 29, 149, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontSize: "12px", fontWeight: 900, color: "#c084fc", letterSpacing: "1px" }}>ABHA DIGITAL HEALTH CARD</span>
                <ShieldCheck size={20} color="#c084fc" />
              </div>

              <div style={{ fontSize: "22px", fontWeight: 900, marginBottom: "4px" }}>Rajesh Kumar</div>
              <div style={{ fontSize: "12px", color: "#c7d2fe", marginBottom: "16px" }}>ABHA Address: rajeshkumar@abdm</div>

              <div style={{ background: "rgba(255,255,255,0.1)", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                <span>ABHA Number:</span>
                <strong style={{ letterSpacing: "1px" }}>91-2026-8819-0123</strong>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REPORTS */}
        {activeTab === "reports" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px 0", color: "#0f172a" }}>Diagnostic Lab &amp; Imaging Reports</h3>
            <button onClick={() => showToast("Downloading Lab Report PDF...")} style={{ padding: "10px 20px", background: "#7e22ce", color: "white", border: "none", borderRadius: "12px", fontWeight: 800, cursor: "pointer" }}>
              Download Complete Lab Package (PDF)
            </button>
          </div>
        )}

        {/* TAB 3: BILLING */}
        {activeTab === "billing" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px 0", color: "#0f172a" }}>Invoices &amp; Payment History</h3>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              Consolidated billing receipts with GST breakdown and insurance co-pay details.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
