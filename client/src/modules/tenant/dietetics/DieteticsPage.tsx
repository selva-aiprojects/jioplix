import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Users, Plus, Search, Filter, Utensils, AlertTriangle, CheckCircle2, Flame } from "lucide-react";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";

export default function DieteticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [patientName, setPatientName] = useState("");
  const [bedNo, setBedNo] = useState("Ward A - Bed 04");
  const [dietType, setDietType] = useState("DIABETIC_SOFT");
  const [allergies, setAllergies] = useState("Peanuts, Lactose");
  const [calories, setCalories] = useState("2000");

  const fetchDiet = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/dietetics/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          patient_name: patientName,
          bed_no: bedNo,
          diet_type: dietType,
          allergies,
          calories_target: parseInt(calories) || 2000,
          kitchen_status: "PREPARING"
        })
      });
      setShowModal(false);
      setPatientName("");
      fetchDiet();
    } catch (e) {
      alert("Failed to submit diet order");
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.patient_name?.toLowerCase().includes(q) || o.diet_type?.toLowerCase().includes(q) || o.bed_no?.toLowerCase().includes(q);
  });

  const specialDietCount = orders.filter(o => o.diet_type !== "REGULAR_NORMAL").length;

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Diet & Nutrition Services" subtitle="Inpatient Clinical Diet Prescriptions, Allergen Exclusions & Kitchen Worklists" />

        <div style={{ padding: "24px" }}>
          {/* Top KPI Metrics Bar */}
          <MetricsGrid minWidth="220px">
            <MetricCard
              icon={Utensils}
              label="Active Diet Orders"
              value={`${orders.length} Active`}
              iconBg="#f0f9ff"
              iconColor="#0284c7"
              accent="#0284c7"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Special Clinical Diets"
              value={`${specialDietCount} Prescribed`}
              iconBg="#fff7ed"
              iconColor="#c2410c"
              accent="#c2410c"
            />
            <MetricCard
              icon={Flame}
              label="Kitchen Dispatch"
              value="Preparing"
              iconBg="#faf5ff"
              iconColor="#9333ea"
              accent="#9333ea"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Allergen Screening"
              value="100% Screened"
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
                placeholder="Search patient, diet plan, bed..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 42px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px" }}
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)", fontSize: "14px" }}
            >
              <Plus size={18} /> Create Clinical Diet Order
            </button>
          </div>

          {/* Diet Table */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Inpatient Diet Orders Schedule</h3>
            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading kitchen diet schedule...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No inpatient diet orders pending. Click "Create Clinical Diet Order" to prescribe.</div>
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
                    {filteredOrders.map(o => (
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

        {/* Modal */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "520px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Create Inpatient Diet Order</h3>
              <form onSubmit={handleCreateOrder} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient Full Name</label>
                    <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Bed / Ward Location</label>
                    <input type="text" value={bedNo} onChange={e=>setBedNo(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Clinical Diet Type</label>
                    <select value={dietType} onChange={e=>setDietType(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option value="REGULAR_NORMAL">Regular Normal</option>
                      <option value="DIABETIC_SOFT">Diabetic Soft</option>
                      <option value="RENAL_LOW_SODIUM">Renal Low Sodium</option>
                      <option value="LIQUID_CLEAR">Clear Liquid</option>
                      <option value="NPO">NPO (Nil Per Os)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Calorie Target (kcal)</label>
                    <input type="number" value={calories} onChange={e=>setCalories(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Allergies / Exclusions</label>
                  <input type="text" value={allergies} onChange={e=>setAllergies(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Send Order to Kitchen</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

