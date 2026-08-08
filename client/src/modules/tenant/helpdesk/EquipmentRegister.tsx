import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import { hd, getHeaders } from "./api";

const EQUIP_STATUS = ["OPERATIONAL", "MAINTENANCE", "REPAIR", "OUT_OF_SERVICE", "RETIRED"];

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  OPERATIONAL: { bg: "#dcfce7", fg: "#15803d" },
  MAINTENANCE: { bg: "#fef3c7", fg: "#b45309" },
  REPAIR: { bg: "#ffedd5", fg: "#c2410c" },
  OUT_OF_SERVICE: { bg: "#fee2e2", fg: "#b91c1c" },
  RETIRED: { bg: "#f1f5f9", fg: "#64748b" },
};

export default function EquipmentRegister() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", asset_tag: "", category: "", status: "OPERATIONAL",
    department_id: "", purchase_date: "", warranty_till: "", notes: "",
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const [eq, deps] = await Promise.all([hd.equipment(), axios.get(`${API_BASE}/api/hospital/masters/departments`, { headers: getHeaders() })]);
      setEquipment(eq);
      setDepartments(Array.isArray(deps.data) ? deps.data : []);
    } catch (err) {
      console.error("Equipment fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const resetForm = () => setForm({ name: "", asset_tag: "", category: "", status: "OPERATIONAL", department_id: "", purchase_date: "", warranty_till: "", notes: "" });

  const openEdit = (eq: any) => {
    setEditing(eq);
    setForm({
      name: eq.name || "", asset_tag: eq.asset_tag || "", category: eq.category || "", status: eq.status || "OPERATIONAL",
      department_id: eq.department_id || "", purchase_date: (eq.purchase_date || "").slice(0, 10), warranty_till: (eq.warranty_till || "").slice(0, 10), notes: eq.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Equipment name is required.");
    try {
      if (editing) {
        await hd.updateEquipment(editing.id, form);
      } else {
        await hd.createEquipment(form);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      await fetchEquipment();
    } catch (err) {
      console.error("Equipment save failed:", err);
      alert("Failed to save equipment.");
    }
  };

  const removeEquip = async (id: string) => {
    if (!window.confirm("Delete this equipment record?")) return;
    try {
      await hd.deleteEquipment(id);
      await fetchEquipment();
    } catch (err) {
      console.error("Equipment delete failed:", err);
      alert("Failed to delete equipment.");
    }
  };

  const label: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 800, color: "#64748b", marginBottom: "6px" };
  const input: React.CSSProperties = { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", fontWeight: 600, background: "#fff" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
          {equipment.length} registered assets · <span style={{ fontWeight: 800, color: "#059669" }}>{equipment.filter((e) => e.status === "OPERATIONAL").length} operational</span> · <span style={{ fontWeight: 800, color: "#c2410c" }}>{equipment.filter((e) => ["MAINTENANCE", "REPAIR"].includes(e.status)).length} in service</span>
        </p>
        <button onClick={() => { setEditing(null); resetForm(); setShowForm(!showForm); }} style={{ padding: "10px 20px", borderRadius: "12px", background: "#0f172a", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
          {showForm ? "Cancel" : "+ Register Equipment"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{editing ? `Edit: ${editing.name}` : "Register New Equipment"}</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div><label style={label}>Name *</label><input required style={input} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><label style={label}>Asset Tag</label><input style={input} value={form.asset_tag} onChange={(e) => set("asset_tag", e.target.value)} /></div>
            <div><label style={label}>Category</label><input style={input} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Ventilator, X-Ray, Bed" /></div>
            <div>
              <label style={label}>Status</label>
              <select style={input} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {EQUIP_STATUS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Department</label>
              <select style={input} value={form.department_id} onChange={(e) => set("department_id", e.target.value)}>
                <option value="">Unassigned</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div><label style={label}>Purchase Date</label><input type="date" style={input} value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} /></div>
            <div><label style={label}>Warranty Till</label><input type="date" style={input} value={form.warranty_till} onChange={(e) => set("warranty_till", e.target.value)} /></div>
          </div>
          <div><label style={label}>Notes</label><textarea rows={2} style={{ ...input, resize: "none" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <button type="submit" style={{ padding: "13px", borderRadius: "12px", background: "#0f172a", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer" }}>{editing ? "SAVE CHANGES" : "REGISTER EQUIPMENT"}</button>
        </form>
      )}

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Loading equipment...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
          {equipment.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "20px", border: "1px dashed #e2e8f0", color: "#94a3b8", fontWeight: 600, gridColumn: "1 / -1" }}>
              No equipment registered yet.
            </div>
          )}
          {equipment.map((eq) => {
            const st = STATUS_STYLE[eq.status] || STATUS_STYLE.OPERATIONAL;
            const warrantyExpired = eq.warranty_till && new Date(eq.warranty_till) < new Date();
            return (
              <div key={eq.id} style={{ background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{eq.name}</h4>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>{eq.asset_tag ? `#${eq.asset_tag} · ` : ""}{eq.category || "General"}{eq.department_name ? ` · ${eq.department_name}` : ""}</p>
                  </div>
                  <span style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, background: st.bg, color: st.fg }}>{eq.status.replace(/_/g, " ")}</span>
                </div>
                <div style={{ display: "flex", gap: "14px", marginTop: "14px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" }}>
                  {eq.purchase_date && <span>Purchased <strong>{new Date(eq.purchase_date).toLocaleDateString()}</strong></span>}
                  {eq.warranty_till && <span style={{ color: warrantyExpired ? "#dc2626" : "#16a34a" }}>Warranty {warrantyExpired ? "expired" : "till"} <strong>{new Date(eq.warranty_till).toLocaleDateString()}</strong></span>}
                  {eq.last_maintenance_at && <span>Last maint <strong>{new Date(eq.last_maintenance_at).toLocaleDateString()}</strong></span>}
                </div>
                {eq.notes && <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#475569", background: "#f8fafc", padding: "10px", borderRadius: "10px" }}>{eq.notes}</p>}
                <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                  <button onClick={() => openEdit(eq)} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>Edit</button>
                  <button onClick={() => removeEquip(eq.id)} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
