import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

export default function AmbulancePage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAmbulance = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
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

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Ambulance & Emergency Patient Transport" subtitle="Fleet Management, Dispatch Console & Live GPS Transport Monitor" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Active Dispatch & Transport Trips</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading fleet dispatch data...</div>
            ) : trips.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active emergency dispatches. All ambulance units on standby.</div>
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
                    {trips.map(t => (
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
      </main>
    </div>
  );
}
