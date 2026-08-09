import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Utensils, Heart, CheckCircle2 } from "lucide-react";

export default function DieteticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiet = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/dietetics/orders", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiet();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Diet & Nutrition Services" subtitle="Inpatient Clinical Diet Prescriptions, Allergen Exclusions & Kitchen Worklists" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Inpatient Clinical Diet Orders</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading kitchen diet schedule...</div>
            ) : orders.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No inpatient diet orders currently pending.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Patient / Bed</th>
                    <th style={{ padding: 12 }}>Diet Plan</th>
                    <th style={{ padding: 12 }}>Allergies / Exclusions</th>
                    <th style={{ padding: 12 }}>Calorie Target</th>
                    <th style={{ padding: 12 }}>Kitchen Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 700 }}>{o.patient_name} <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.bed_no}</div></td>
                      <td style={{ padding: 12, color: '#38bdf8', fontWeight: 800 }}>{o.diet_type}</td>
                      <td style={{ padding: 12, color: '#f59e0b' }}>{o.allergies || 'None'}</td>
                      <td style={{ padding: 12 }}>{o.calories_target ? `${o.calories_target} kcal` : 'Standard'}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {o.kitchen_status}
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
