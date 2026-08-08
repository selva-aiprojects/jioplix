import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import { hd, getHeaders } from "./api";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function NewTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientOpen, setPatientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    categoryId: "",
    subject: "",
    description: "",
    priority: "MEDIUM",
    channel: "INTERNAL",
    sourceType: "INTERNAL",
    sourceId: "",
    patientId: "",
    departmentId: "",
    assignToUserId: "",
    equipmentId: "",
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const [cats, deps, equip] = await Promise.all([hd.categories(), axios.get(`${API_BASE}/api/hospital/masters/departments`, { headers: getHeaders() }), hd.equipment()]);
        setCategories(cats);
        setDepartments(Array.isArray(deps.data) ? deps.data : []);
        setEquipment(equip);
      } catch (e) {
        console.error("Helpdesk modal bootstrap failed:", e);
      }
    })();
  }, []);

  const searchPatients = async (q: string) => {
    setPatientQuery(q);
    if (q.trim().length < 2) return setPatients([]);
    try {
      const { data } = await axios.get(`${API_BASE}/api/patients?search=${encodeURIComponent(q)}&limit=8`, { headers: getHeaders() });
      setPatients(Array.isArray(data) ? data : []);
      setPatientOpen(true);
    } catch (e) {
      console.error("Patient lookup failed:", e);
    }
  };

  const onCategoryChange = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    set("categoryId", id);
    if (cat?.default_priority) set("priority", cat.default_priority);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let sourceId = form.sourceId || undefined;
      let patientId = form.patientId || undefined;
      if (form.sourceType === "PATIENT" && form.patientId) { patientId = form.patientId; sourceId = form.patientId; }
      if (form.sourceType === "EQUIPMENT" && form.equipmentId) sourceId = form.equipmentId;
      await hd.createTicket({
        categoryId: form.categoryId || undefined,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        channel: form.channel,
        sourceType: form.sourceType,
        sourceId,
        patientId,
        departmentId: form.departmentId || undefined,
        assignToUserId: form.assignToUserId || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error("Ticket creation failed:", err);
      alert("Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const label: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 800, color: "#64748b", marginBottom: "6px" };
  const input: React.CSSProperties = { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", fontWeight: 600, background: "#fff" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "24px", maxWidth: 680, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>Raise New Ticket</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={label}>Category</label>
              <select style={input} value={form.categoryId} onChange={(e) => onCategoryChange(e.target.value)}>
                <option value="">Select category...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type.replace(/_/g, " ")})</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Priority</label>
              <select style={input} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={label}>Subject</label>
            <input required style={input} placeholder="Brief summary of the issue..." value={form.subject} onChange={(e) => set("subject", e.target.value)} />
          </div>

          <div>
            <label style={label}>Description</label>
            <textarea rows={4} required style={{ ...input, resize: "none" }} placeholder="Detailed context, steps to reproduce, affected system..." value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={label}>Channel</label>
              <select style={input} value={form.channel} onChange={(e) => set("channel", e.target.value)}>
                <option value="INTERNAL">Internal</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="PORTAL">Portal</option>
                <option value="PATIENT">Patient Portal</option>
              </select>
            </div>
            <div>
              <label style={label}>Department</label>
              <select style={input} value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
                <option value="">Unassigned</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={label}>Source</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["INTERNAL", "PATIENT", "EQUIPMENT"].map((st) => (
                <button type="button" key={st} onClick={() => { set("sourceType", st); set("patientId", ""); set("equipmentId", ""); set("sourceId", ""); }}
                  style={{ padding: "8px 14px", borderRadius: "999px", border: form.sourceType === st ? "2px solid #0f172a" : "1px solid #e2e8f0", background: form.sourceType === st ? "#0f172a" : "#fff", color: form.sourceType === st ? "#fff" : "#475569", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
                  {st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {form.sourceType === "PATIENT" && (
              <div style={{ marginTop: "10px", position: "relative" }}>
                <input style={input} placeholder="Search patient by name / MRN / phone..." value={patientQuery} onChange={(e) => searchPatients(e.target.value)} />
                {patientOpen && patients.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", marginTop: "4px", maxHeight: 220, overflowY: "auto", zIndex: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                    {patients.map((p) => (
                      <div key={p.id} onClick={() => { set("patientId", p.id); setPatientQuery(`${p.name}${p.mrn ? ` (${p.mrn})` : ""}${p.phone ? ` · ${p.phone}` : ""}`); setPatients([]); setPatientOpen(false); }}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: "13px", fontWeight: 600 }}>
                        {p.name} <span style={{ color: "#94a3b8" }}>{p.mrn ? ` · ${p.mrn}` : ""}{p.phone ? ` · ${p.phone}` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.sourceType === "EQUIPMENT" && (
              <div style={{ marginTop: "10px" }}>
                <select style={input} value={form.equipmentId} onChange={(e) => set("equipmentId", e.target.value)}>
                  <option value="">Select equipment...</option>
                  {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}{eq.asset_tag ? ` (${eq.asset_tag})` : ""}</option>)}
                </select>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} style={{ padding: "14px", borderRadius: "14px", background: "#0f172a", color: "white", border: "none", fontWeight: 800, cursor: "pointer" }}>
            {submitting ? "CREATING..." : "CREATE TICKET"}
          </button>
        </form>
      </div>
    </div>
  );
}
