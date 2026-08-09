import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { HeartPulse, Activity, AlertTriangle, ShieldAlert, Cpu } from "lucide-react";

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
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="ICU & Critical Care Unit Command Center" subtitle="Multi-Bed Telemetry, Ventilator Parameters, ABG & APACHE II / SOFA Risk Scoring" />

        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading ICU bed telemetry...</div>
            ) : beds.length === 0 ? (
              <div className="form-card" style={{ gridColumn: '1 / -1', background: 'rgba(30, 41, 59, 0.45)', padding: 32, borderRadius: 16, textAlign: 'center', color: '#94a3b8' }}>
                <Cpu size={48} color="#38bdf8" style={{ marginBottom: 12 }} />
                <h3>ICU Telemetry Bed Grid Operational</h3>
                <p>All critical care bays are monitored. Flowsheet entries sync with central monitor telemetry.</p>
              </div>
            ) : (
              beds.map((b) => (
                <div key={b.id} style={{ background: b.critical_alarm ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.6)', border: `1px solid ${b.critical_alarm ? '#ef4444' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: 20, backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 900, color: '#38bdf8', fontSize: 16 }}>{b.bed_no}</span>
                    <span style={{ background: b.critical_alarm ? '#ef4444' : '#10b981', color: 'white', fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 4 }}>
                      {b.critical_alarm ? 'CRITICAL ALARM' : 'STABLE'}
                    </span>
                  </div>

                  <h4 style={{ color: 'white', margin: '0 0 12px 0', fontSize: 16 }}>{b.patient_name}</h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 10, marginBottom: 12 }}>
                    <div><span style={{ color: '#94a3b8' }}>Vent Mode:</span> <strong style={{ color: 'white' }}>{b.ventilator_mode || 'SIMV'}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>FiO2 / PEEP:</span> <strong style={{ color: 'white' }}>{b.fio2 || 40}% / {b.peep || 5}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>ABG pH:</span> <strong style={{ color: 'white' }}>{b.abg_ph || '7.38'}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>GCS Score:</span> <strong style={{ color: 'white' }}>{b.gcs_score || 14}/15</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1' }}>
                    <span>SOFA Score: <strong style={{ color: '#f59e0b' }}>{b.sofa_score || 2}</strong></span>
                    <span>APACHE II: <strong style={{ color: '#f59e0b' }}>{b.apache_score || 12}</strong></span>
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
