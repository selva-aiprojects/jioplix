import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Plus } from "lucide-react";

export default function CSSDPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [batchNo, setBatchNo] = useState("BATCH-9022");
  const [sterilizerId, setSterilizerId] = useState("AUTOCLAVE-01");
  const [method, setMethod] = useState("AUTOCLAVE");
  const [biTest, setBiTest] = useState("PASS");
  const [ciTest, setCiTest] = useState("PASS");
  const [trayCount, setTrayCount] = useState("5");
  const [expiryDays, setExpiryDays] = useState("30");

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

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/cssd/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          batch_number: batchNo,
          sterilizer_id: sterilizerId,
          sterilization_method: method,
          biological_indicator: biTest,
          chemical_indicator: ciTest,
          tray_count: parseInt(trayCount) || 1,
          expiry_days: parseInt(expiryDays) || 30
        })
      });
      setShowModal(false);
      setBatchNo("");
      fetchCSSD();
    } catch (e) {
      alert("Failed to log CSSD batch");
    }
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="CSSD - Central Sterile Supply Department" subtitle="Surgical Kit Sterilization Cycles, Autoclave Logs & BI/CI Indicator Pass Records" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#0f172a", margin: 0, fontWeight: 800, fontSize: "18px" }}>Sterilization Batch Records</h3>
              <button 
                onClick={() => setShowModal(true)}
                style={{ background: "#0ea5e9", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
              >
                <Plus size={16} /> New Sterilization Batch
              </button>
            </div>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading autoclave batch records...</div>
            ) : batches.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active sterilization batches logged today. Click "New Sterilization Batch" to log cycle.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Batch No</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Sterilizer ID</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Method</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>BI Test</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>CI Test</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0284c7" }}>{b.batch_number}</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{b.sterilizer_id}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{b.sterilization_method}</td>
                        <td style={{ padding: "14px 16px", color: "#16a34a", fontWeight: 800 }}>{b.biological_indicator}</td>
                        <td style={{ padding: "14px 16px", color: "#16a34a", fontWeight: 800 }}>{b.chemical_indicator}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "520px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Log Sterilization Batch</h3>
              <form onSubmit={handleCreateBatch} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Batch Number</label>
                    <input type="text" required value={batchNo} onChange={e=>setBatchNo(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Sterilizer Unit ID</label>
                    <input type="text" required value={sterilizerId} onChange={e=>setSterilizerId(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>Method</label>
                    <select value={method} onChange={e=>setMethod(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option>AUTOCLAVE</option><option>ETO</option><option>PLASMA</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>BI Spore Test</label>
                    <select value={biTest} onChange={e=>setBiTest(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option>PASS</option><option>FAIL</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>CI Strip Test</label>
                    <select value={ciTest} onChange={e=>setCiTest(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option>PASS</option><option>FAIL</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Log Batch</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
