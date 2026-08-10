import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { MetricCard, MetricsGrid } from "../../components/MetricCard";
import {
  Activity,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  ShieldCheck,
  Zap,
  Users,
  Search,
  Scissors,
  HeartPulse,
  Syringe
} from "lucide-react";

interface SurgicalCase {
  id: string;
  otNumber: string;
  patientName: string;
  mrn: string;
  age: number;
  gender: string;
  procedureName: string;
  leadSurgeon: string;
  anaesthetist: string;
  scrubNurse: string;
  startTime: string;
  endTime: string;
  status: "Scheduled" | "In-Progress" | "Completed" | "Post-Op Recovery";
  pacClearance: boolean;
  asaGrade: string;
  bloodReservedUnits: number;
}

const SAMPLE_SURGERIES: SurgicalCase[] = [
  { id: "ot1", otNumber: "OT 1 (Cardiac)", patientName: "Rajesh Kumar", mrn: "MRN-2026-8819", age: 48, gender: "Male", procedureName: "Coronary Artery Bypass Graft (CABG)", leadSurgeon: "Dr. K. M. Cherian (Cardiovascular)", anaesthetist: "Dr. Sheila Rao", scrubNurse: "Sr. Kavitha", startTime: "08:30 AM", endTime: "01:30 PM", status: "Completed", pacClearance: true, asaGrade: "ASA III", bloodReservedUnits: 4 },
  { id: "ot2", otNumber: "OT 2 (Ortho)", patientName: "Anand Verma", mrn: "MRN-2026-3390", age: 41, gender: "Male", procedureName: "Total Knee Replacement (Left)", leadSurgeon: "Dr. S. Rajasekaran (Orthopedics)", anaesthetist: "Dr. R. Nambiar", scrubNurse: "Sr. Deepa", startTime: "10:00 AM", endTime: "01:00 PM", status: "In-Progress", pacClearance: true, asaGrade: "ASA II", bloodReservedUnits: 2 },
  { id: "ot3", otNumber: "OT 3 (General)", patientName: "Priya Sundaram", mrn: "MRN-2026-7734", age: 35, gender: "Female", procedureName: "Laparoscopic Cholecystectomy", leadSurgeon: "Dr. T. S. Ramesh (Surgical Gastro)", anaesthetist: "Dr. Sheila Rao", scrubNurse: "Sr. Anitha", startTime: "02:00 PM", endTime: "04:00 PM", status: "Scheduled", pacClearance: true, asaGrade: "ASA I", bloodReservedUnits: 1 },
  { id: "ot4", otNumber: "OT 4 (Neuro)", patientName: "Karthik Subramanian", mrn: "MRN-2026-1042", age: 52, gender: "Male", procedureName: "Lumbar Microdiscectomy (L4-L5)", leadSurgeon: "Dr. V. K. Jain (Neurosurgery)", anaesthetist: "Dr. R. Nambiar", scrubNurse: "Sr. Kavitha", startTime: "04:30 PM", endTime: "07:00 PM", status: "Scheduled", pacClearance: true, asaGrade: "ASA II", bloodReservedUnits: 2 }
];

export default function OperationTheatrePage() {
  const [activeTab, setActiveTab] = useState<"schedule" | "pac" | "intraop">("schedule");
  const [surgeries, setSurgeries] = useState<SurgicalCase[]>(SAMPLE_SURGERIES);
  const [selectedCase, setSelectedCase] = useState<SurgicalCase>(SAMPLE_SURGERIES[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Intraop Form State
  const [intraOpData, setIntraOpData] = useState({
    incisionTime: "08:45 AM",
    closureTime: "01:15 PM",
    bloodLossMl: "350",
    spongeCountVerified: true,
    instrumentCountVerified: true,
    postOpDestination: "ICU Unit 2"
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveIntraOp = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`✅ Intra-operative record saved & instrument count verified for ${selectedCase.patientName}!`);
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Operation Theatre (OT) Management Suite" subtitle="Surgical Room Schedules, Pre-Anaesthesia Checkup (PAC) &amp; Intra-Operative Nursing Records" />

        {/* Toast Alert */}
        {toastMessage && (
          <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
            background: "#0f172a", color: "#ffffff", padding: "14px 22px", borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px",
            border: "1px solid rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: 700
          }}>
            <Scissors size={18} color="#10b981" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HERO METRICS BANNER */}
        <div style={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
          borderRadius: "28px", padding: "32px 36px", color: "white", marginBottom: "28px",
          position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(16, 185, 129, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
                <Scissors size={14} color="#a7f3d0" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#ecfdf5", letterSpacing: "0.5px" }}>SURGICAL SUITE &amp; PAC CONTROL</span>
              </div>
              <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
                Operation Theatre Suite Console
              </h1>
              <p style={{ fontSize: "14px", color: "#a7f3d0", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
                Schedule operating rooms, manage surgical teams, perform pre-anaesthesia clearances, and record intra-operative nursing checklists.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <MetricsGrid minWidth="180px" style={{ marginTop: "28px" }}>
            <MetricCard variant="translucent" icon={Scissors} label="Today's Surgeries" value={`${surgeries.length} Cases`} />
            <MetricCard variant="translucent" icon={Activity} label="Currently In-Progress" value={`${surgeries.filter(s => s.status === "In-Progress").length} OT Table Active`} accent="#fde047" />
            <MetricCard variant="translucent" icon={ShieldCheck} label="PAC Clearances" value="100% Cleared" />
            <MetricCard variant="translucent" icon={CheckCircle2} label="Sponge Count Safety" value="Verified" accent="#6ee7b7" />
          </MetricsGrid>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
          <button
            onClick={() => setActiveTab("schedule")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "schedule" ? "#047857" : "#ffffff", color: activeTab === "schedule" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "schedule" ? "0 4px 12px rgba(4, 120, 87, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Calendar size={16} /> 1. OT Surgical Schedule Grid ({surgeries.length})
          </button>

          <button
            onClick={() => setActiveTab("pac")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "pac" ? "#047857" : "#ffffff", color: activeTab === "pac" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "pac" ? "0 4px 12px rgba(4, 120, 87, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Syringe size={16} /> 2. Pre-Anaesthesia Checkup (PAC)
          </button>

          <button
            onClick={() => setActiveTab("intraop")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "intraop" ? "#047857" : "#ffffff", color: activeTab === "intraop" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "intraop" ? "0 4px 12px rgba(4, 120, 87, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <FileText size={16} /> 3. Intra-Op &amp; Post-Op Record
          </button>
        </div>

        {/* TAB 1: SCHEDULE GRID */}
        {activeTab === "schedule" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {surgeries.map(s => (
              <div
                key={s.id}
                style={{
                  background: "#ffffff",
                  padding: "24px",
                  borderRadius: "20px",
                  border: `2px solid ${s.status === "In-Progress" ? "#10b981" : "#e2e8f0"}`,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ background: "#ecfdf5", color: "#047857", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, fontSize: "12px" }}>
                    {s.otNumber}
                  </span>
                  <span style={{
                    padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800,
                    background: s.status === "In-Progress" ? "#def7ec" : s.status === "Completed" ? "#f1f5f9" : "#fef3c7",
                    color: s.status === "In-Progress" ? "#03543f" : s.status === "Completed" ? "#475569" : "#92400e"
                  }}>
                    {s.status}
                  </span>
                </div>

                <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", margin: "0 0 4px 0" }}>
                  {s.procedureName}
                </h3>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#047857", marginBottom: "12px" }}>
                  Patient: {s.patientName} ({s.mrn})
                </div>

                <div style={{ fontSize: "12px", color: "#64748b", display: "grid", gap: "6px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                  <div><strong>Lead Surgeon:</strong> {s.leadSurgeon}</div>
                  <div><strong>Anaesthetist:</strong> {s.anaesthetist}</div>
                  <div><strong>Scrub Nurse:</strong> {s.scrubNurse}</div>
                  <div><strong>Time Slot:</strong> {s.startTime} - {s.endTime}</div>
                </div>

                <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => { setSelectedCase(s); setActiveTab("intraop"); }}
                    style={{ flex: 1, padding: "8px", borderRadius: "10px", border: "none", background: "#047857", color: "white", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
                  >
                    Manage Notes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: PAC CLEARANCE */}
        {activeTab === "pac" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px 0", color: "#0f172a" }}>Pre-Anaesthesia Checkup (PAC) Clearance Log</h3>
            
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px" }}>Patient Name</th>
                  <th style={{ padding: "12px 16px" }}>Procedure</th>
                  <th style={{ padding: "12px 16px" }}>ASA Physical Status</th>
                  <th style={{ padding: "12px 16px" }}>NPO Verification</th>
                  <th style={{ padding: "12px 16px" }}>Blood Reserved</th>
                  <th style={{ padding: "12px 16px" }}>PAC Clearance</th>
                </tr>
              </thead>
              <tbody>
                {surgeries.map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{s.patientName}</td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>{s.procedureName}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#047857" }}>{s.asaGrade}</td>
                    <td style={{ padding: "14px 16px", color: "#166534" }}>8 Hours Verified ✅</td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>{s.bloodReservedUnits} Units PRBC</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800 }}>
                        ✅ CLEARED FOR OT
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: INTRA OP NOTES */}
        {activeTab === "intraop" && (
          <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 20px 0" }}>
              Intra-Operative &amp; Sponge Verification Record — {selectedCase.procedureName}
            </h3>

            <form onSubmit={handleSaveIntraOp} style={{ display: "grid", gap: "20px", maxWidth: "600px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Incision Time</label>
                  <input value={intraOpData.incisionTime} onChange={e => setIntraOpData({ ...intraOpData, incisionTime: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Closure Time</label>
                  <input value={intraOpData.closureTime} onChange={e => setIntraOpData({ ...intraOpData, closureTime: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Estimated Blood Loss (mL)</label>
                <input value={intraOpData.bloodLossMl} onChange={e => setIntraOpData({ ...intraOpData, bloodLossMl: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
              </div>

              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "16px", borderRadius: "14px" }}>
                <div style={{ fontWeight: 800, color: "#047857", marginBottom: "8px" }}>Safety Verification Checklist:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#065f46" }}>
                  <div>✔ Pre-op &amp; Post-op Sponge Count Match Verified</div>
                  <div>✔ Instrument &amp; Needle Count Verified</div>
                  <div>✔ Specimen Labeling &amp; Histopathology Tag Verified</div>
                </div>
              </div>

              <button type="submit" style={{ padding: "14px", background: "#047857", color: "white", border: "none", borderRadius: "14px", fontWeight: 900, fontSize: "14px", cursor: "pointer" }}>
                Save Intra-Operative Surgical Record
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
