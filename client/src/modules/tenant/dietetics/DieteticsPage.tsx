import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

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
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Diet & Nutrition Services" subtitle="Inpatient Clinical Diet Prescriptions, Allergen Exclusions & Kitchen Worklists" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Inpatient Clinical Diet Orders</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading kitchen diet schedule...</div>
            ) : orders.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No inpatient diet orders currently pending.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient / Bed</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Diet Plan</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Allergies / Exclusions</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Calorie Target</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Kitchen Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>
                          {o.patient_name} <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>Bed: {o.bed_no}</div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#0284c7", fontWeight: 800 }}>{o.diet_type}</td>
                        <td style={{ padding: "14px 16px", color: "#d97706", fontWeight: 700 }}>{o.allergies || 'None'}</td>
                        <td style={{ padding: "14px 16px", color: "#334155" }}>{o.calories_target ? `${o.calories_target} kcal` : 'Standard'}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {o.kitchen_status}
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
