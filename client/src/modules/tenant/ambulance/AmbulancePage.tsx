import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Siren, Plus, Search, Filter, Clock, CheckCircle2, Navigation, Activity } from "lucide-react";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";

export default function AmbulancePage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [vehicleNo, setVehicleNo] = useState("AMB-102 (ALS)");
  const [ambType, setAmbType] = useState("ALS - Advanced Life Support");
  const [driverName, setDriverName] = useState("David Miller");
  const [paramedicName, setParamedicName] = useState("Sarah Jenkins");
  const [pickupLoc, setPickupLoc] = useState("Sector 62, Expressway Junction");
  const [etaMins, setEtaMins] = useState("12");

  const fetchAmbulance = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/ambulance/trips", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setTrips(data.trips || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulance();
  }, []);

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/ambulance/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          vehicle_no: vehicleNo,
          ambulance_type: ambType,
          driver_name: driverName,
          paramedic_name: paramedicName,
          pickup_location: pickupLoc,
          eta_minutes: parseInt(etaMins) || 15,
          trip_status: "EN_ROUTE"
        })
      });
      setShowModal(false);
      fetchAmbulance();
    } catch (e) {
      alert("Failed to dispatch ambulance");
    }
  };

  const filteredTrips = trips.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.vehicle_no?.toLowerCase().includes(q) || t.driver_name?.toLowerCase().includes(q) || t.pickup_location?.toLowerCase().includes(q);
  });

  const alsFleetCount = trips.filter(t => t.ambulance_type?.includes("ALS")).length;

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Ambulance & Emergency Patient Transport" subtitle="Fleet Management, Dispatch Console & Live GPS Transport Monitor" />

        <div style={{ padding: "24px" }}>
          {/* Top KPI Metrics Bar */}
          <MetricsGrid minWidth="220px">
            <MetricCard
              icon={Siren}
              label="Active Emergency Dispatches"
              value={`${trips.length} Trips`}
              iconBg="#fef2f2"
              iconColor="#ef4444"
              accent="#dc2626"
            />
            <MetricCard
              icon={Navigation}
              label="ALS Ambulance Fleet"
              value={`${alsFleetCount} Units`}
              iconBg="#f0f9ff"
              iconColor="#0284c7"
              accent="#0284c7"
            />
            <MetricCard
              icon={Clock}
              label="Avg Dispatch Response"
              value="8.5 Mins"
              iconBg="#fff7ed"
              iconColor="#c2410c"
              accent="#c2410c"
            />
            <MetricCard
              icon={CheckCircle2}
              label="GPS Telemetry"
              value="Online"
              iconBg="#f0fdf4"
              iconColor="#16a34a"
              accent="#16a34a"
            />
          </MetricsGrid>

          {/* Search & Actions Bar */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input 
                type="text" 
                placeholder="Search vehicle no, driver, location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 42px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px" }}
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)", fontSize: "14px" }}
            >
              <Plus size={18} /> Dispatch Emergency Unit
            </button>
          </div>

          {/* Transport Table */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Active Dispatch & Transport Trips</h3>
            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading fleet dispatch data...</div>
            ) : filteredTrips.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active emergency dispatches. All ambulance units on standby. Click "Dispatch Emergency Unit" to trigger trip.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Vehicle No</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Type</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Driver / Paramedic</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Pickup Location</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>ETA</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Trip Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrips.map(t => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 900, color: "#dc2626" }}>{t.vehicle_no}</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{t.ambulance_type}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{t.driver_name} / {t.paramedic_name || 'N/A'}</td>
                        <td style={{ padding: "14px 16px", color: "#334155" }}>{t.pickup_location}</td>
                        <td style={{ padding: "14px 16px", color: "#d97706", fontWeight: 800 }}>{t.eta_minutes} mins</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {t.trip_status}
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
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Dispatch Emergency Ambulance Unit</h3>
              <form onSubmit={handleCreateDispatch} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Vehicle No</label>
                    <input type="text" required value={vehicleNo} onChange={e=>setVehicleNo(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Ambulance Type</label>
                    <select value={ambType} onChange={e=>setAmbType(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option>ALS - Advanced Life Support</option>
                      <option>BLS - Basic Life Support</option>
                      <option>NEONATAL_ICU_AMBULANCE</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Driver Name</label>
                    <input type="text" required value={driverName} onChange={e=>setDriverName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Paramedic Name</label>
                    <input type="text" value={paramedicName} onChange={e=>setParamedicName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Pickup Location</label>
                    <input type="text" required value={pickupLoc} onChange={e=>setPickupLoc(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>ETA (Mins)</label>
                    <input type="number" value={etaMins} onChange={e=>setEtaMins(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Confirm Dispatch</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

