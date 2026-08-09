import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import {
  Settings,
  Plus,
  Search,
  Building2,
  Activity,
  Layers,
  FlaskConical,
  Pill,
  Sparkles,
  Bed,
  CheckCircle2,
  Tag,
  ShieldCheck
} from "lucide-react";

export default function MastersPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [departments, setDepartments] = useState<any[]>([]);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [specialities, setSpecialities] = useState<any[]>([]);
  const [modes, setModes] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("departments");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<any>({
    name: '', price: '', category: '', description: '',
    uom: '', instructions: '', details: '', icd_code: '',
    severity_level: 'Moderate', cpt_code: '', estimated_duration: '',
    hod: '', specialty: '', service_code: '', tax_percent: '',
    fee: '', surcharge: '', is_virtual: false,
    composition: '', dosage_adult: '', dosage_pediatric: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if ((role || '').toLowerCase() !== 'admin') { navigate("/tenant/dashboard"); return; }
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "x-tenant-id": localStorage.getItem("tenant") || ""
      };
      const requests = [
        axios.get(`${API_BASE}/api/hospital/masters/departments`, { headers }),
        axios.get(`${API_BASE}/api/hospital/masters/diseases`, { headers }),
        axios.get(`${API_BASE}/api/hospital/masters/treatments`, { headers }),
        axios.get(`${API_BASE}/api/hospital/masters/services`, { headers }),
        axios.get(`${API_BASE}/api/hospital/masters/medicines`, { headers }),
        axios.get(`${API_BASE}/api/hospital/masters/diagnostics`, { headers }),
        axios.get(`${API_BASE}/api/hospital/masters/specialities`, { headers }),
        axios.get(`${API_BASE}/api/hospital/masters/modes`, { headers }),
        axios.get(`${API_BASE}/api/hospital/masters/wards`, { headers })
      ];

      const [depRes, disRes, treRes, serRes, medRes, diagRes, specRes, modeRes, wardsRes] = await Promise.allSettled(requests);

      if (depRes.status === 'fulfilled') setDepartments(depRes.value.data);
      if (disRes.status === 'fulfilled') setDiseases(disRes.value.data);
      if (treRes.status === 'fulfilled') setTreatments(treRes.value.data);
      if (serRes.status === 'fulfilled') setServices(serRes.value.data);
      if (medRes.status === 'fulfilled') setMedicines(medRes.value.data);
      if (diagRes.status === 'fulfilled') setDiagnostics(diagRes.value.data);
      if (specRes.status === 'fulfilled') setSpecialities(specRes.value.data);
      if (modeRes.status === 'fulfilled') setModes(modeRes.value.data);
      if (wardsRes.status === 'fulfilled') setWards(wardsRes.value.data);
    } catch (err) {
      console.error("Failed to fetch masters", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "x-tenant-id": localStorage.getItem("tenant") || ""
      };
      await axios.post(`${API_BASE}/api/hospital/masters/${activeTab}`, newItem, { headers });
      showToast(`✅ ${activeConfig.label.slice(0, -1)} configured successfully!`);
      setShowAddModal(false);
      setNewItem({
        name: '', price: '', category: '', description: '',
        uom: '', instructions: '', details: '', icd_code: '',
        severity_level: 'Moderate', cpt_code: '', estimated_duration: '',
        hod: '', specialty: '', service_code: '', tax_percent: '',
        fee: '', surcharge: '', is_virtual: false,
        composition: '', dosage_adult: '', dosage_pediatric: ''
      });
      fetchData();
    } catch (err) {
      console.error("Master add error:", err);
      showToast("Failed to save master item.");
    }
  };

  const handleProvision = async (wardId: string) => {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "x-tenant-id": localStorage.getItem("tenant") || ""
      };
      await axios.post(`${API_BASE}/api/hospital/ipd/wards/${wardId}/provision-beds`, {}, { headers });
      showToast("✅ Ward beds provisioned successfully!");
    } catch (err) {
      showToast("Failed to provision beds.");
    }
  };

  const tabConfigs: Record<string, any> = {
    departments: {
      label: 'Departments',
      cols: [
        { header: 'Department Name', value: (item: any) => item.name },
        { header: 'Specialty', value: (item: any) => item.specialty || '-' },
        { header: 'HOD', value: (item: any) => item.hod || '-' },
        { header: 'Status', value: (item: any) => item.status || 'Active' }
      ]
    },
    specialities: {
      label: 'Specialities',
      cols: [
        { header: 'Speciality Name', value: (item: any) => item.name },
        { header: 'Base Consultation Fee', value: (item: any) => `₹${item.base_consultation_fee || item.fee || 0}` },
        { header: 'Notes', value: (item: any) => item.description || '-' }
      ]
    },
    modes: {
      label: 'Modes',
      cols: [
        { header: 'Mode Name', value: (item: any) => item.name },
        { header: 'Surcharge %', value: (item: any) => `${item.surcharge_percent || item.surcharge || 0}%` },
        { header: 'Virtual / Telemed', value: (item: any) => item.is_virtual ? 'Yes' : 'No' }
      ]
    },
    diseases: {
      label: 'Diseases',
      cols: [
        { header: 'Disease Name', value: (item: any) => item.name },
        { header: 'ICD Code', value: (item: any) => item.icd_code || '-' },
        { header: 'Category', value: (item: any) => item.category || 'General' },
        { header: 'Severity', value: (item: any) => item.severity_level || 'Moderate' }
      ]
    },
    treatments: {
      label: 'Treatments',
      cols: [
        { header: 'Treatment Name', value: (item: any) => item.name },
        { header: 'CPT Code', value: (item: any) => item.cpt_code || '-' },
        { header: 'Duration', value: (item: any) => `${item.estimated_duration || 0} mins` },
        { header: 'Tariff Price', value: (item: any) => `₹${item.price || 0}` }
      ]
    },
    diagnostics: {
      label: 'Diagnostics',
      cols: [
        { header: 'Diagnostic Test Name', value: (item: any) => item.name },
        { header: 'Category', value: (item: any) => item.type_name || 'Standard' },
        { header: 'Tariff Price', value: (item: any) => `₹${item.price || 0}` }
      ]
    },
    services: {
      label: 'Services',
      cols: [
        { header: 'Service Name', value: (item: any) => item.name },
        { header: 'Category', value: (item: any) => item.category || 'General' },
        { header: 'Service Code', value: (item: any) => item.service_code || '-' },
        { header: 'Tariff Price', value: (item: any) => `₹${item.price || 0}` }
      ]
    },
    medicines: {
      label: 'Medicines',
      cols: [
        { header: 'Medicine Name', value: (item: any) => item.name },
        { header: 'Category', value: (item: any) => item.category || 'General' },
        { header: 'Adult Dosage', value: (item: any) => item.dosage_adult || '-' }
      ]
    },
    wards: {
      label: 'Wards',
      cols: [
        { header: 'Ward Name', value: (item: any) => item.name },
        { header: 'Category', value: (item: any) => item.category || 'General' },
        { header: 'Daily Room Tariff', value: (item: any) => `₹${item.daily_rate || 0}` },
        { header: 'Capacity', value: (item: any) => `${item.total_beds || 0} Beds` }
      ]
    }
  };

  const getActiveData = () => {
    let list: any[] = [];
    switch (activeTab) {
      case 'departments': list = departments; break;
      case 'specialities': list = specialities; break;
      case 'modes': list = modes; break;
      case 'diseases': list = diseases; break;
      case 'treatments': list = treatments; break;
      case 'diagnostics': list = diagnostics; break;
      case 'services': list = services; break;
      case 'medicines': list = medicines; break;
      case 'wards': list = wards; break;
      default: list = [];
    }

    if (!searchQuery) return list;
    return list.filter(item => item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const activeConfig = tabConfigs[activeTab] || { label: 'Items', cols: [] };
  const currentData = getActiveData();

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Hospital Masters &amp; Tariff Configuration Console" subtitle="Department Master Setup, Clinical Diagnostic Tariffs, Service Price Lists &amp; Ward Capacity Settings" />

        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
            background: "#0f172a", color: "#ffffff", padding: "14px 22px", borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px",
            border: "1px solid rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: 700
          }}>
            <Sparkles size={18} color="#38bdf8" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HERO BANNER */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
          borderRadius: "28px", padding: "32px 36px", color: "white", marginBottom: "28px",
          position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
                <Settings size={14} color="#38bdf8" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f0f9ff", letterSpacing: "0.5px" }}>HOSPITAL SYSTEM MASTER CONFIGURATION</span>
              </div>
              <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
                Master Data &amp; Service Tariff Console
              </h1>
              <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
                Configure department structures, ICD-10 disease catalogs, OPD consultation tariffs, diagnostic price lists, and ward bed allocations.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "14px 24px", borderRadius: "16px", background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", color: "white",
                border: "none", fontWeight: 900, fontSize: "14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 20px rgba(2, 132, 199, 0.3)"
              }}
            >
              <Plus size={18} /> Add New {activeConfig.label.slice(0, -1)}
            </button>
          </div>
        </div>

        {/* TABBED NAVIGATION PILLS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto", paddingBottom: "6px" }}>
          {Object.keys(tabConfigs).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: `1.5px solid ${activeTab === tabKey ? "#0f172a" : "#e2e8f0"}`,
                background: activeTab === tabKey ? "#0f172a" : "#ffffff",
                color: activeTab === tabKey ? "#ffffff" : "#475569",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
              }}
            >
              {tabConfigs[tabKey].label}
            </button>
          ))}
        </div>

        {/* MASTER DATA TABLE */}
        <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeConfig.label}...`}
              style={{ width: "100%", maxWidth: "380px", padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>
                  {activeConfig.cols.map((col: any, idx: number) => (
                    <th key={idx} style={{ padding: "12px 16px" }}>{col.header}</th>
                  ))}
                  {activeTab === 'wards' && <th style={{ padding: "12px 16px" }}>Bed Provisioning</th>}
                </tr>
              </thead>
              <tbody>
                {currentData.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {activeConfig.cols.map((col: any, colIdx: number) => (
                      <td key={colIdx} style={{ padding: "14px 16px", fontWeight: colIdx === 0 ? 800 : 600, color: colIdx === 0 ? "#0f172a" : "#475569" }}>
                        {col.value(item)}
                      </td>
                    ))}
                    {activeTab === 'wards' && (
                      <td style={{ padding: "14px 16px" }}>
                        <button
                          onClick={() => handleProvision(item.id)}
                          style={{ padding: "6px 12px", background: "#0284c7", color: "white", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
                        >
                          Provision Beds
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD MASTER ITEM MODAL */}
        {showAddModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#ffffff", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 20px 0" }}>Add New {activeConfig.label.slice(0, -1)}</h3>

              <form onSubmit={handleAdd} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Name / Title *</label>
                  <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>

                {(activeTab === 'treatments' || activeTab === 'diagnostics' || activeTab === 'services') && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Tariff Price (₹) *</label>
                    <input type="number" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} required style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                  </div>
                )}

                {activeTab === 'diseases' && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>ICD-10 Code</label>
                    <input value={newItem.icd_code} onChange={e => setNewItem({ ...newItem, icd_code: e.target.value })} placeholder="e.g. E11.9" style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#0f172a", color: "white", fontWeight: 900, cursor: "pointer" }}>Save Master Item</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
