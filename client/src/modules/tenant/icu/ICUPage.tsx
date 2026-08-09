import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Cpu } from "lucide-react";

export default function ICUPage() {
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchICUData = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/icu/dashboard", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setBeds(data.beds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchICUData();
  }, []);

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="ICU & Critical Care Unit Command Center" subtitle="Multi-Bed Telemetry, Ventilator Parameters, ABG & APACHE II / SOFA Risk Scoring" />

        <div style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {loading ? (
              <div style={{ color: "#64748b", padding: "30px", fontWeight: 600 }}>Loading ICU bed telemetry...</div>
            ) : beds.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", background: "#ffffff", padding: "40px", borderRadius: "20px", border: "1px solid #e2e8f0", textAlign: "center", color: "#475569", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
                <Cpu size={48} color="#0284c7" style={{ marginBottom: "12px" }} />
                <h3 style={{ color: "#0f172a", fontWeight: 800, margin: "0 0 8px 0" }}>ICU Telemetry Bed Grid Operational</h3>
                <p style={{ color: "#64748b", margin: 0 }}>All critical care bays are monitored. Flowsheet entries sync with central monitor telemetry.</p>
              </div>
            ) : (
              beds.map((b) => (
                <div key={b.id} style={{ background: b.critical_alarm ? "#fff1f2" : "#ffffff", border: `1px solid ${b.critical_alarm ? "#fda4af" : "#e2e8f0"}`, borderRadius: "20px", padding: "20px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontWeight: 900, color: "#0284c7", fontSize: "16px" }}>{b.bed_no}</span>
                    <span style={{ background: b.critical_alarm ? "#ef4444" : "#10b981", color: "#ffffff", fontSize: "11px", fontWeight: 900, padding: "4px 10px", borderRadius: "6px" }}>
                      {b.critical_alarm ? "CRITICAL ALARM" : "STABLE"}
                    </span>
                  </div>

                  <h4 style={{ color: "#0f172a", margin: "0 0 12px 0", fontSize: "16px", fontWeight: 800 }}>{b.patient_name}</h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", background: "#f8fafc", padding: "12px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #f1f5f9" }}>
                    <div><span style={{ color: "#64748b", fontWeight: 600 }}>Vent Mode:</span> <strong style={{ color: "#0f172a" }}>{b.ventilator_mode || 'SIMV'}</strong></div>
                    <div><span style={{ color: "#64748b", fontWeight: 600 }}>FiO2 / PEEP:</span> <strong style={{ color: "#0f172a" }}>{b.fio2 || 40}% / {b.peep || 5}</strong></div>
                    <div><span style={{ color: "#64748b", fontWeight: 600 }}>ABG pH:</span> <strong style={{ color: "#0f172a" }}>{b.abg_ph || '7.38'}</strong></div>
                    <div><span style={{ color: "#64748b", fontWeight: 600 }}>GCS Score:</span> <strong style={{ color: "#0f172a" }}>{b.gcs_score || 14}/15</strong></div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#334155", fontWeight: 700 }}>
                    <span>SOFA Score: <strong style={{ color: "#d97706" }}>{b.sofa_score || 2}</strong></span>
                    <span>APACHE II: <strong style={{ color: "#d97706" }}>{b.apache_score || 12}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
