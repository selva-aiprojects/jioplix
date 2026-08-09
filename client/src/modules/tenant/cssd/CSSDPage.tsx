import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Package, Plus, Search, Filter, CheckCircle2, AlertTriangle, ShieldCheck, Flame } from "lucide-react";

export default function CSSDPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [batchNo, setBatchNo] = useState("CSSD-2026-B901");
  const [sterilizerId, setSterilizerId] = useState("AUTOCLAVE-02");
  const [method, setMethod] = useState("STEAM_AUTOCLAVE");
  const [biPassed, setBiPassed] = useState(true);
  const [ciPassed, setCiPassed] = useState(true);
  const [trayCount, setTrayCount] = useState("12");
  const [expiryDays, setExpiryDays] = useState("30");

  const fetchCSSD = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
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
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/cssd/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          batch_no: batchNo,
          sterilizer_id: sterilizerId,
          sterilization_method: method,
          bi_indicator_passed: biPassed,
          ci_indicator_passed: ciPassed,
          tray_count: parseInt(trayCount) || 10,
          expiry_days: parseInt(expiryDays) || 30,
          batch_status: "STERILIZED_PASSED"
        })
      });
      setShowModal(false);
      fetchCSSD();
    } catch (e) {
      alert("Failed to create sterilization batch");
    }
  };

  const filteredBatches = batches.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.batch_no?.toLowerCase().includes(q) || b.sterilizer_id?.toLowerCase().includes(q) || b.sterilization_method?.toLowerCase().includes(q);
  });

  const biPassRate = batches.length > 0 ? Math.round((batches.filter(b => b.bi_indicator_passed).length / batches.length) * 100) : 100;

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Central Sterile Supply Department (CSSD)" subtitle="Autoclave Sterilization Batches, Biological (BI) & Chemical (CI) Indicators & Surgical Tray Expiry Surveillance" />

        <div style={{ padding: "24px" }}>
          {/* Top KPI Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#f0fdf4", color: "#16a34a", display: "grid", placeItems: "center" }}>
                <Flame size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Batches Sterilized Today</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#16a34a" }}>{batches.length} Batches</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#f0f9ff", color: "#0284c7", display: "grid", placeItems: "center" }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>BI / CI Test Pass Rate</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#0284c7" }}>{biPassRate}% Passed</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#faf5ff", color: "#9333ea", display: "grid", placeItems: "center" }}>
                <Package size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Ready Surgical Trays</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#9333ea" }}>48 Trays Ready</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#fff7ed", color: "#c2410c", display: "grid", placeItems: "center" }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Autoclave Equipment</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#c2410c" }}>4 Active Units</div>
              </div>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input 
                type="text" 
                placeholder="Search batch no, sterilizer ID, method..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 42px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px" }}
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)", fontSize: "14px" }}
            >
              <Plus size={18} /> New Sterilization Batch
            </button>
          </div>

          {/* CSSD Table */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Sterilization Batch Records</h3>
            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading CSSD batch data...</div>
            ) : filteredBatches.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No CSSD sterilization batches logged. Click "New Sterilization Batch" to register.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Batch No</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Sterilizer Unit</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Method</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>BI / CI Indicators</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Trays</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Batch Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map(b => (
                      <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 900, color: "#0ea5e9" }}>{b.batch_no}</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{b.sterilizer_id}</td>
                        <td style={{ padding: "14px 16px", color: "#334155" }}>{b.sterilization_method}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ color: "#16a34a", fontWeight: 800 }}>BI: {b.bi_indicator_passed ? 'PASS' : 'FAIL'}</span> • <span style={{ color: "#0284c7", fontWeight: 800 }}>CI: {b.ci_indicator_passed ? 'PASS' : 'FAIL'}</span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{b.tray_count} Trays</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {b.batch_status}
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
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Create Sterilization Batch</h3>
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
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Sterilization Method</label>
                  <select value={method} onChange={e=>setMethod(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                    <option value="STEAM_AUTOCLAVE">Steam Autoclave (High Pressure)</option>
                    <option value="ETHOXYLENE_OXIDE">ETO (Ethylene Oxide)</option>
                    <option value="PLASMA_STERRAD">Hydrogen Peroxide Plasma</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Tray Count</label>
                    <input type="number" value={trayCount} onChange={e=>setTrayCount(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Expiry Days</label>
                    <input type="number" value={expiryDays} onChange={e=>setExpiryDays(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a", fontWeight: 700, cursor: "pointer" }}>
                    <input type="checkbox" checked={biPassed} onChange={e=>setBiPassed(e.target.checked)} /> BI Indicator Passed
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a", fontWeight: 700, cursor: "pointer" }}>
                    <input type="checkbox" checked={ciPassed} onChange={e=>setCiPassed(e.target.checked)} /> CI Indicator Passed
                  </label>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Register Batch</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

