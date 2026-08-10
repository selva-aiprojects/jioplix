import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { MetricCard, MetricsGrid } from "../../components/MetricCard";
import {
  Activity,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Search,
  Zap,
  Filter,
  Plus,
  Send,
  Printer,
  ShieldCheck,
  Maximize2,
  ZoomIn,
  Sun,
  Layers
} from "lucide-react";

interface RadiologyOrder {
  id: string;
  accessionNumber: string;
  patientName: string;
  mrn: string;
  age: number;
  gender: string;
  modality: "X-Ray" | "CT Scan" | "MRI" | "Ultrasound" | "Mammography";
  studyName: string;
  referringDoctor: string;
  orderDate: string;
  priority: "STAT" | "Routine" | "Urgent";
  status: "Pending" | "In-Progress" | "Reported";
  findings?: string;
  impression?: string;
}

const SAMPLE_ORDERS: RadiologyOrder[] = [
  { id: "r1", accessionNumber: "ACC-2026-901", patientName: "Rajesh Kumar", mrn: "MRN-2026-8819", age: 48, gender: "Male", modality: "X-Ray", studyName: "Chest PA View", referringDoctor: "Dr. Arvind Swamy (Pulmonology)", orderDate: "2026-08-09 10:15 AM", priority: "STAT", status: "Reported", findings: "Bilateral lung fields show clear aeration. No focal consolidation, pneumothorax, or pleural effusion. Cardiac silhouette is within normal limits.", impression: "Normal Chest PA View radiograph. No acute cardiopulmonary disease." },
  { id: "r2", accessionNumber: "ACC-2026-902", patientName: "Priya Sundaram", mrn: "MRN-2026-7734", age: 35, gender: "Female", modality: "CT Scan", studyName: "CT Abdomen & Pelvis (Contrast)", referringDoctor: "Dr. Meera Nambiar (Gastroenterology)", orderDate: "2026-08-09 11:30 AM", priority: "Urgent", status: "In-Progress" },
  { id: "r3", accessionNumber: "ACC-2026-903", patientName: "Karthik Subramanian", mrn: "MRN-2026-1042", age: 52, gender: "Male", modality: "MRI", studyName: "MRI Brain (Non-Contrast)", referringDoctor: "Dr. R. K. Sharma (Neurology)", orderDate: "2026-08-09 09:00 AM", priority: "Routine", status: "Pending" },
  { id: "r4", accessionNumber: "ACC-2026-904", patientName: "Saraswathi Ammal", mrn: "MRN-2026-5510", age: 64, gender: "Female", modality: "Ultrasound", studyName: "USG Whole Abdomen", referringDoctor: "Dr. S. Vijay (Internal Med)", orderDate: "2026-08-09 12:10 PM", priority: "Routine", status: "Pending" },
  { id: "r5", accessionNumber: "ACC-2026-905", patientName: "Anand Verma", mrn: "MRN-2026-3390", age: 41, gender: "Male", modality: "CT Scan", studyName: "CT HRCT Thorax", referringDoctor: "Dr. Arvind Swamy (Pulmonology)", orderDate: "2026-08-09 08:30 AM", priority: "STAT", status: "Reported", findings: "Multifocal ground-glass opacities in lower lobes bilaterally.", impression: "Findings suggestive of viral interstitial pneumonia. Clinical correlation advised." }
];

export default function RadiologyPage() {
  const [activeTab, setActiveTab] = useState<"worklist" | "transcribe" | "pacs">("worklist");
  const [selectedModality, setSelectedModality] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<RadiologyOrder[]>(SAMPLE_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrder | null>(SAMPLE_ORDERS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Transcription Editor State
  const [reportFindings, setReportFindings] = useState(selectedOrder?.findings || "");
  const [reportImpression, setReportImpression] = useState(selectedOrder?.impression || "");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredOrders = orders.filter(o => {
    if (selectedModality !== "ALL" && o.modality !== selectedModality) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return o.patientName.toLowerCase().includes(q) || o.accessionNumber.toLowerCase().includes(q) || o.studyName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSelectOrderForReporting = (order: RadiologyOrder) => {
    setSelectedOrder(order);
    setReportFindings(order.findings || "");
    setReportImpression(order.impression || "");
    setActiveTab("transcribe");
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, findings: reportFindings, impression: reportImpression, status: "Reported" } : o));
    showToast(`✅ Radiology report signed & finalized for ${selectedOrder.patientName} (${selectedOrder.accessionNumber})!`);
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Radiology Information System (RIS) Workstation" subtitle="Modality Worklist, Radiologist Transcription Desk, DICOM Preview & PACS Integration" />

        {/* Toast Alert */}
        {toastMessage && (
          <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
            background: "#0f172a", color: "#ffffff", padding: "14px 22px", borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px",
            border: "1px solid rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: 700
          }}>
            <Activity size={18} color="#0284c7" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HERO BANNER */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #0369a1 50%, #0284c7 100%)",
          borderRadius: "28px", padding: "32px 36px", color: "white", marginBottom: "28px",
          position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(2, 132, 199, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
                <Activity size={14} color="#7dd3fc" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f0f9ff", letterSpacing: "0.5px" }}>PACS / DICOM 3.0 CONNECTED RIS HUB</span>
              </div>
              <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
                Radiology Workstation &amp; Imaging Suite
              </h1>
              <p style={{ fontSize: "14px", color: "#bae6fd", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
                Manage modality queues across X-Ray, CT, MRI, and Ultrasound, transcribe diagnostic impressions, and instantly alert ordering physicians for STAT findings.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <MetricsGrid minWidth="180px" style={{ marginTop: "28px" }}>
            <MetricCard variant="translucent" icon={Activity} label="Today's Orders" value={`${orders.length} Scans`} />
            <MetricCard variant="translucent" icon={Clock} label="Pending Reporting" value={`${orders.filter(o => o.status !== "Reported").length} Pending`} accent="#fde047" />
            <MetricCard variant="translucent" icon={Zap} label="STAT Urgent Queue" value={`${orders.filter(o => o.priority === "STAT").length} STAT`} accent="#f87171" />
            <MetricCard variant="translucent" icon={CheckCircle2} label="PACS Connection" value="Active" accent="#4ade80" />
          </MetricsGrid>
        </div>

        {/* MODALITY FILTER BAR */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
          {["ALL", "X-Ray", "CT Scan", "MRI", "Ultrasound", "Mammography"].map(m => (
            <button
              key={m}
              onClick={() => setSelectedModality(m)}
              style={{
                padding: "10px 20px",
                borderRadius: "14px",
                border: `2px solid ${selectedModality === m ? "#0284c7" : "#e2e8f0"}`,
                background: selectedModality === m ? "#0284c7" : "#ffffff",
                color: selectedModality === m ? "#ffffff" : "#475569",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
              }}
            >
              {m === "ALL" ? "All Modalities" : m}
            </button>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
          <button
            onClick={() => setActiveTab("worklist")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "worklist" ? "#0284c7" : "#ffffff", color: activeTab === "worklist" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "worklist" ? "0 4px 12px rgba(2, 132, 199, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Activity size={16} /> 1. Modality Worklist ({filteredOrders.length})
          </button>

          <button
            onClick={() => setActiveTab("transcribe")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "transcribe" ? "#0284c7" : "#ffffff", color: activeTab === "transcribe" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "transcribe" ? "0 4px 12px rgba(2, 132, 199, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <FileText size={16} /> 2. Radiologist Transcription Desk
          </button>

          <button
            onClick={() => setActiveTab("pacs")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "pacs" ? "#0284c7" : "#ffffff", color: activeTab === "pacs" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "pacs" ? "0 4px 12px rgba(2, 132, 199, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Eye size={16} /> 3. PACS / DICOM Viewport
          </button>
        </div>

        {/* TAB 1: WORKLIST */}
        {activeTab === "worklist" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Accession #, Patient Name, Study..."
                style={{ width: "100%", maxWidth: "400px", padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px" }}>Accession #</th>
                  <th style={{ padding: "12px 16px" }}>Patient Name &amp; MRN</th>
                  <th style={{ padding: "12px 16px" }}>Modality</th>
                  <th style={{ padding: "12px 16px" }}>Study / Procedure Name</th>
                  <th style={{ padding: "12px 16px" }}>Referring Doctor</th>
                  <th style={{ padding: "12px 16px" }}>Priority</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{o.accessionNumber}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{o.patientName}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{o.mrn} • {o.gender} • {o.age} Yrs</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                        {o.modality}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#334155" }}>{o.studyName}</td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{o.referringDoctor}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800,
                        background: o.priority === "STAT" ? "#fef2f2" : "#f1f5f9",
                        color: o.priority === "STAT" ? "#dc2626" : "#475569",
                        border: `1px solid ${o.priority === "STAT" ? "#fecaca" : "#cbd5e1"}`
                      }}>
                        {o.priority}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800,
                        background: o.status === "Reported" ? "#f0fdf4" : o.status === "In-Progress" ? "#fffbe6" : "#f1f5f9",
                        color: o.status === "Reported" ? "#166534" : o.status === "In-Progress" ? "#92400e" : "#475569"
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => handleSelectOrderForReporting(o)}
                        style={{
                          padding: "6px 14px", borderRadius: "8px", border: "none",
                          background: "#0284c7", color: "white", fontWeight: 800, fontSize: "12px", cursor: "pointer"
                        }}
                      >
                        {o.status === "Reported" ? "View Report" : "Transcribe Report"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: TRANSCRIPTION DESK */}
        {activeTab === "transcribe" && selectedOrder && (
          <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#0284c7", fontWeight: 800, textTransform: "uppercase" }}>Radiology Report Transcription</span>
                <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "4px 0 0 0" }}>
                  {selectedOrder.studyName} ({selectedOrder.modality}) — {selectedOrder.patientName}
                </h3>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Accession #: <strong style={{ color: "#0f172a" }}>{selectedOrder.accessionNumber}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveReport} style={{ display: "grid", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#334155", marginBottom: "8px" }}>
                  Radiological Findings (Observations)
                </label>
                <textarea
                  rows={6}
                  value={reportFindings}
                  onChange={e => setReportFindings(e.target.value)}
                  placeholder="Enter detailed radiological findings observed in the study..."
                  style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "1.5px solid #cbd5e1", fontSize: "14px", lineHeight: 1.6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#334155", marginBottom: "8px" }}>
                  Final Diagnostic Impression (Conclusion)
                </label>
                <textarea
                  rows={3}
                  value={reportImpression}
                  onChange={e => setReportImpression(e.target.value)}
                  placeholder="Enter summary diagnostic conclusion..."
                  style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: 700 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="submit"
                  style={{ padding: "14px 28px", background: "#0284c7", color: "white", border: "none", borderRadius: "14px", fontWeight: 900, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <CheckCircle2 size={18} /> Finalize &amp; Sign Report
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: PACS / DICOM PREVIEW */}
        {activeTab === "pacs" && (
          <div style={{ background: "#0f172a", padding: "32px", borderRadius: "24px", color: "white", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
              <Eye size={16} color="#38bdf8" /> DICOM 3.0 PACS VIEWPORT
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 12px 0" }}>Embedded Web-PACS Diagnostic Viewer</h3>
            <p style={{ color: "#94a3b8", fontSize: "14px", maxWidth: "500px", margin: "0 auto 24px" }}>
              High-resolution DICOM viewport with window leveling, 2D measurements, multi-planar reconstruction (MPR), and DICOM web streaming.
            </p>

            <div style={{ background: "#1e293b", border: "2px dashed #334155", borderRadius: "20px", height: "300px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
              <Layers size={48} color="#38bdf8" />
              <div style={{ fontWeight: 800, fontSize: "15px", color: "#e2e8f0" }}>PACS Server Connection Established</div>
              <button onClick={() => showToast("Launching DICOM Web PACS Workstation...")} style={{ padding: "10px 20px", background: "#0284c7", color: "white", border: "none", borderRadius: "12px", fontWeight: 800, cursor: "pointer" }}>
                Launch External PACS Viewer
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
