import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Archive, FileCode, Scale, CheckCircle2, Tag } from "lucide-react";

export default function MRDPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMRD = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/mrd/records", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setRecords(data.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMRD();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Medical Records, MRD & HIM Command Center" subtitle="Physical File Location Tracking, ICD-10 Coding, Chart Audits & MLC Registers" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Medical Records & Physical File Inventory</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading records archive...</div>
            ) : records.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No MRD records found in active rack location index.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>MRN</th>
                    <th style={{ padding: 12 }}>Patient Name</th>
                    <th style={{ padding: 12 }}>Rack / Shelf / Box</th>
                    <th style={{ padding: 12 }}>MLC Status</th>
                    <th style={{ padding: 12 }}>Coding Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 800, color: '#38bdf8' }}>{r.mrn}</td>
                      <td style={{ padding: 12, fontWeight: 700 }}>{r.patient_name}</td>
                      <td style={{ padding: 12 }}>Rack: {r.rack_no || 'R-04'} | Shelf: {r.shelf_no || 'S-02'}</td>
                      <td style={{ padding: 12 }}>
                        {r.is_mlc ? (
                          <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                            MLC (#{r.mlc_number || 'REG-99'})
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>Non-MLC</span>
                        )}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {r.chart_status}
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
