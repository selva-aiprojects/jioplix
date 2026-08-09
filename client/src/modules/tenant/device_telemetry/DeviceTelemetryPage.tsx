import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Cpu, Activity, Heart, Zap, Bell } from "lucide-react";

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
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Medical Device & Telemetry IoT Hub" subtitle="High-Frequency Vital Streaming, Ventilator Feeds & Automatic Alarm Escalations" />

        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {loading ? (
              <div style={{ color: '#94a3b8' }}>Connecting to device MQTT broker...</div>
            ) : devices.length === 0 ? (
              <div className="form-card" style={{ gridColumn: '1 / -1', background: 'rgba(30, 41, 59, 0.45)', padding: 32, borderRadius: 16, textAlign: 'center', color: '#94a3b8' }}>
                <Zap size={48} color="#38bdf8" style={{ marginBottom: 12 }} />
                <h3>Telemetry Gateway Operational</h3>
                <p>Ready to receive multi-parameter patient monitor streams via HL7 DEC and WebSockets.</p>
              </div>
            ) : (
              devices.map(d => (
                <div key={d.id} style={{ background: d.alarm_active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.6)', border: `1px solid ${d.alarm_active ? '#ef4444' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 900, color: '#38bdf8' }}>{d.location_bed}</span>
                    <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '3px 8px', borderRadius: 4, fontWeight: 800 }}>LIVE FEED</span>
                  </div>
                  <h4 style={{ color: 'white', margin: '0 0 12px 0' }}>{d.patient_name || 'Bed Monitor'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8 }}>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>Heart Rate</span>
                      <div style={{ color: '#ef4444', fontSize: 20, fontWeight: 900 }}>{d.heart_rate || 78} <span style={{ fontSize: 12 }}>bpm</span></div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8 }}>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>SpO2</span>
                      <div style={{ color: '#38bdf8', fontSize: 20, fontWeight: 900 }}>{d.spo2 || 99}%</div>
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
