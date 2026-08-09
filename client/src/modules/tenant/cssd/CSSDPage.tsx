import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { PackageCheck, Flame, RefreshCw, CheckCircle2 } from "lucide-react";

export default function CSSDPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCSSD = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/cssd/batches", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setBatches(data.batches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCSSD();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="CSSD - Central Sterile Supply Department" subtitle="Surgical Kit Sterilization Cycles, Autoclave Logs & BI/CI Indicator Pass Records" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Sterilization Batch Records</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading autoclave batch records...</div>
            ) : batches.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No active sterilization batches logged today.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Batch No</th>
                    <th style={{ padding: 12 }}>Sterilizer ID</th>
                    <th style={{ padding: 12 }}>Method</th>
                    <th style={{ padding: 12 }}>BI Test</th>
                    <th style={{ padding: 12 }}>CI Test</th>
                    <th style={{ padding: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 800, color: '#38bdf8' }}>{b.batch_number}</td>
                      <td style={{ padding: 12 }}>{b.sterilizer_id}</td>
                      <td style={{ padding: 12 }}>{b.sterilization_method}</td>
                      <td style={{ padding: 12, color: '#10b981', fontWeight: 800 }}>{b.biological_indicator}</td>
                      <td style={{ padding: 12, color: '#10b981', fontWeight: 800 }}>{b.chemical_indicator}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
