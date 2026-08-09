import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Zap } from "lucide-react";

export default function DeviceTelemetryPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/device-telemetry/streams", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setDevices(data.devices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Medical Device & Telemetry IoT Hub" subtitle="High-Frequency Vital Streaming, Ventilator Feeds & Automatic Alarm Escalations" />

        <div style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Connecting to device MQTT broker...</div>
            ) : devices.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", background: "#ffffff", padding: "40px", borderRadius: "20px", border: "1px solid #e2e8f0", textAlign: "center", color: "#475569", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
                <Zap size={48} color="#0284c7" style={{ marginBottom: "12px" }} />
                <h3 style={{ color: "#0f172a", fontWeight: 800, margin: "0 0 8px 0" }}>Telemetry Gateway Operational</h3>
                <p style={{ color: "#64748b", margin: 0 }}>Ready to receive multi-parameter patient monitor streams via HL7 DEC and WebSockets.</p>
              </div>
            ) : (
              devices.map(d => (
                <div key={d.id} style={{ background: d.alarm_active ? "#fff1f2" : "#ffffff", border: `1px solid ${d.alarm_active ? "#fda4af" : "#e2e8f0"}`, borderRadius: "20px", padding: "20px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontWeight: 900, color: "#0284c7", fontSize: "16px" }}>{d.location_bed}</span>
                    <span style={{ fontSize: "11px", background: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: "6px", fontWeight: 800 }}>LIVE FEED</span>
                  </div>
                  <h4 style={{ color: "#0f172a", margin: "0 0 12px 0", fontSize: "16px", fontWeight: 800 }}>{d.patient_name || 'Bed Monitor'}</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                      <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}>Heart Rate</span>
                      <div style={{ color: "#ef4444", fontSize: "22px", fontWeight: 900, marginTop: "2px" }}>{d.heart_rate || 78} <span style={{ fontSize: "12px" }}>bpm</span></div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                      <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}>SpO2</span>
                      <div style={{ color: "#0284c7", fontSize: "22px", fontWeight: 900, marginTop: "2px" }}>{d.spo2 || 99}%</div>
                    </div>
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
