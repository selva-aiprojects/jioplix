import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Navigation, Truck, Siren, Activity } from "lucide-react";

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
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Ambulance & Emergency Patient Transport" subtitle="Fleet Management, Dispatch Console & Live GPS Transport Monitor" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Active Dispatch & Transport Trips</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading fleet dispatch data...</div>
            ) : trips.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No active emergency dispatches. All ambulance units on standby.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Vehicle No</th>
                    <th style={{ padding: 12 }}>Type</th>
                    <th style={{ padding: 12 }}>Driver / Paramedic</th>
                    <th style={{ padding: 12 }}>Pickup Location</th>
                    <th style={{ padding: 12 }}>ETA</th>
                    <th style={{ padding: 12 }}>Trip Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 800, color: '#ef4444' }}>{t.vehicle_no}</td>
                      <td style={{ padding: 12 }}>{t.ambulance_type}</td>
                      <td style={{ padding: 12 }}>{t.driver_name} / {t.paramedic_name || 'N/A'}</td>
                      <td style={{ padding: 12, color: '#cbd5e1' }}>{t.pickup_location}</td>
                      <td style={{ padding: 12, color: '#f59e0b', fontWeight: 800 }}>{t.eta_minutes} mins</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {t.trip_status}
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
