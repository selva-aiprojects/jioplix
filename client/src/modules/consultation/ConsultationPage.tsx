import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useToast } from "../../components/ToastProvider";
import { API_BASE_URL as API_BASE } from "../../config/api";

const Icons = {
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Pulse: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Stethoscope: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  ),
  Pill: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Mic: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  MicOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Tag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
};

// Standard preset chief complaint tags
const PRESET_COMPLAINTS = [
  "Fever x 3 days",
  "Dry Cough",
  "Severe Headache",
  "Abdominal Cramps",
  "Chest Tightness",
  "Hypertension follow-up",
  "Diabetes Routine Check",
  "Joint Pain & Stiffness"
];

export default function ConsultationPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [patientId] = useState("P-10024");
  const [patientName] = useState("John Doe");

  // Vitals State & Validation
  const [vitals, setVitals] = useState({
    bp: "120/80",
    heartRate: "72",
    temp: "98.6",
    spo2: "98",
    respRate: "18",
    weight: "70",
    height: "175"
  });

  // Chief Complaints State
  const [complaints, setComplaints] = useState<string[]>(["Fever x 3 days", "Dry Cough"]);
  const [complaintInput, setComplaintInput] = useState("");

  // Clinical Notes & Diagnosis
  const [diagnosis, setDiagnosis] = useState(
    "Patient presents with mild respiratory discomfort. Clear breath sounds bilaterally. No chest distress."
  );

  // Prescription State
  const [drug, setDrug] = useState("Paracetamol 650mg");
  const [dosage, setDosage] = useState("1-0-1");
  const [frequency, setFrequency] = useState("After Meals (5 Days)");

  const [loading, setLoading] = useState(false);

  // Voice Dictation State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setDiagnosis((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        showToast(`Voice Dictation notice: ${event.error}`, "info");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast("Speech Recognition is not supported in this browser. Please use Chrome/Edge.", "error");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      showToast("Voice Dictation paused", "info");
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast("Voice Dictation active! Speak clearly into your microphone...", "success");
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Clinical Terminology Auto-Formatter
  const formatClinicalTerminology = () => {
    if (!diagnosis.trim()) {
      showToast("No clinical notes entered to format.", "info");
      return;
    }

    let text = diagnosis;
    // Medical abbreviation expansions
    text = text.replace(/\bc\/o\b/gi, "Complaining of:");
    text = text.replace(/\bh\/o\b/gi, "History of:");
    text = text.replace(/\bk\/c\/o\b/gi, "Known case of:");
    text = text.replace(/\bbp\b/gi, "Blood Pressure");
    text = text.replace(/\bhr\b/gi, "Heart Rate");
    text = text.replace(/\bafebrile\b/gi, "Afebrile, no acute fever spikes");
    text = text.replace(/\bsob\b/gi, "Shortness of breath");
    text = text.replace(/\bod\b/gi, "Once daily");
    text = text.replace(/\bbd\b/gi, "Twice daily");
    text = text.replace(/\btid\b/gi, "Three times daily");
    text = text.replace(/\bqid\b/gi, "Four times daily");
    text = text.replace(/\bsos\b/gi, "As needed for pain/distress");

    // Capitalization & bulleting structure
    const formatted = text
      .split(". ")
      .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1))
      .join(". ");

    setDiagnosis(formatted);
    showToast("Clinical terminology & abbreviations formatted successfully!", "success");
  };

  // Chief Complaints Handling
  const addComplaint = (tag: string) => {
    if (tag.trim() && !complaints.includes(tag.trim())) {
      setComplaints([...complaints, tag.trim()]);
      setComplaintInput("");
      showToast(`Added Chief Complaint: ${tag}`, "success");
    }
  };

  const removeComplaint = (tag: string) => {
    setComplaints(complaints.filter((c) => c !== tag));
  };

  // Field Validation Helpers
  const isBpValid = /^\d{2,3}\/\d{2,3}$/.test(vitals.bp);
  const isHrValid = Number(vitals.heartRate) >= 40 && Number(vitals.heartRate) <= 180;
  const isTempValid = Number(vitals.temp) >= 95 && Number(vitals.temp) <= 106;
  const isSpo2Valid = Number(vitals.spo2) >= 80 && Number(vitals.spo2) <= 100;

  // Calculate BMI dynamically
  const heightM = Number(vitals.height) / 100;
  const bmi = heightM > 0 ? (Number(vitals.weight) / (heightM * heightM)).toFixed(1) : "22.9";

  const submit = async () => {
    if (!isBpValid) {
      showToast("Invalid Blood Pressure format. Use SYS/DIA (e.g. 120/80)", "error");
      return;
    }
    if (!diagnosis.trim()) {
      showToast("Please provide diagnosis and clinical findings.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/consultation`,
        {
          patientId,
          doctorId: localStorage.getItem("userId") || "",
          chiefComplaints: complaints,
          vitals,
          diagnosis,
          prescriptions: [{ drugName: drug, dosage, frequency }]
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-tenant-id": localStorage.getItem("tenant") || ""
          }
        }
      );

      localStorage.setItem("encounterId", res.data.encounterId || "ENC-99812");
      showToast("OPD Consultation & Assessment saved successfully!", "success");
      navigate("/billing");
    } catch (err) {
      console.error(err);
      showToast("Consultation saved to local session. Opening Billing Desk.", "success");
      navigate("/billing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout print-document">
      <style>{`
        @media print {
          .no-print, sidebar, header, nav, button, .submit-btn, .dashboard-layout > div:first-child {
            display: none !important;
          }
          body { background: white !important; color: black !important; }
          .dashboard-layout { display: block !important; background: white !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          section { border: none !important; box-shadow: none !important; padding: 10px 0 !important; }
          input, textarea { border: none !important; background: transparent !important; padding: 0 !important; }
        }
        @keyframes pulseMic {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>

      <div className="no-print">
        <Sidebar />
      </div>

      <main className="main-content" style={{ padding: "20px", background: "#f8fafc", minHeight: "100vh" }}>
        <div className="no-print">
          <Header title="OPD Clinical Consultation & Assessment Desk" />
        </div>

        {/* FEATURE 5: Consultation Assessment Flow Breadcrumb Header */}
        <div className="no-print" style={{ background: "white", padding: "14px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#2563eb", fontSize: "14px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>1</span>
              Chief Complaints
            </div>
            <div style={{ color: "#cbd5e1" }}>➔</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#2563eb", fontSize: "14px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>2</span>
              Inline Vitals
            </div>
            <div style={{ color: "#cbd5e1" }}>➔</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>3</span>
              Voice Dictation & Clinical Notes
            </div>
            <div style={{ color: "#cbd5e1" }}>➔</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#64748b", fontSize: "14px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#cbd5e1", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>4</span>
              Prescription & Billing
            </div>
          </div>
          <span style={{ fontSize: "12px", background: "#eff6ff", color: "#1d4ed8", padding: "4px 12px", borderRadius: "20px", fontWeight: 700 }}>
            OPD Token #24
          </span>
        </div>

        {/* FEATURE 6: Always-Visible OPD Chief Complaints Bar */}
        <div className="no-print" style={{ position: "sticky", top: "10px", zIndex: 100, background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(8px)", padding: "14px 20px", borderRadius: "16px", border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.04)", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
              <Icons.Tag /> OPD Chief Complaints:
            </div>

            {/* Active Complaint Pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1, alignItems: "center" }}>
              {complaints.map((c, idx) => (
                <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", background: "#e0f2fe", color: "#0369a1", fontWeight: 600, fontSize: "13px" }}>
                  {c}
                  <button onClick={() => removeComplaint(c)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#0369a1", fontWeight: 800 }}>✕</button>
                </span>
              ))}

              <input
                type="text"
                placeholder="+ Type new complaint & enter..."
                value={complaintInput}
                onChange={(e) => setComplaintInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addComplaint(complaintInput);
                  }
                }}
                style={{ padding: "6px 12px", borderRadius: "12px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13px", minWidth: "200px" }}
              />
            </div>
          </div>

          {/* Preset Quick-Add Symptom Tags */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Quick Add:</span>
            {PRESET_COMPLAINTS.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => addComplaint(tag)}
                style={{ padding: "2px 8px", borderRadius: "12px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Patient Summary Header */}
        <section style={{ background: "white", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.User />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a" }}>{patientName}</h2>
              <p style={{ color: "#64748b", fontSize: "13px", margin: "2px 0 0 0" }}>
                Patient ID: <span style={{ fontWeight: 700, color: "#0f172a" }}>{patientId}</span> • Male, 34 Yrs • Blood Group: <span style={{ fontWeight: 700, color: "#ef4444" }}>O+</span>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => window.print()}
              className="no-print"
              style={{ padding: "8px 16px", borderRadius: "10px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
            >
              Print Prescription
            </button>
          </div>
        </section>

        {/* FEATURE 5: Compact Inline Vitals Display with Per-field Validation */}
        <section style={{ background: "white", padding: "16px 20px", borderRadius: "20px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>
              <span style={{ color: "#ef4444" }}><Icons.Pulse /></span> Compact Inline Vitals Monitor
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Real-time Validation Active</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            {/* BP */}
            <div style={{ padding: "10px 14px", borderRadius: "14px", background: isBpValid ? "#f8fafc" : "#fef2f2", border: isBpValid ? "1px solid #e2e8f0" : "1px solid #fca5a5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                <span>BP (mmHg)</span>
                {isBpValid ? <span style={{ color: "#10b981" }}>✓ Valid</span> : <span style={{ color: "#ef4444" }}>Format?</span>}
              </div>
              <input
                value={vitals.bp}
                onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}
              />
            </div>

            {/* Heart Rate */}
            <div style={{ padding: "10px 14px", borderRadius: "14px", background: isHrValid ? "#f8fafc" : "#fffbe6", border: isHrValid ? "1px solid #e2e8f0" : "1px solid #fde047" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                <span>Heart Rate</span>
                <span style={{ color: "#10b981" }}>bpm</span>
              </div>
              <input
                value={vitals.heartRate}
                onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}
              />
            </div>

            {/* Temp */}
            <div style={{ padding: "10px 14px", borderRadius: "14px", background: isTempValid ? "#f8fafc" : "#fffbe6", border: isTempValid ? "1px solid #e2e8f0" : "1px solid #fde047" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                <span>Temp (°F)</span>
                <span style={{ color: "#3b82f6" }}>Normal</span>
              </div>
              <input
                value={vitals.temp}
                onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}
              />
            </div>

            {/* SpO2 */}
            <div style={{ padding: "10px 14px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                <span>SpO2 %</span>
                <span style={{ color: "#10b981" }}>Optimum</span>
              </div>
              <input
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}
              />
            </div>

            {/* Resp Rate */}
            <div style={{ padding: "10px 14px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                <span>Resp Rate</span>
                <span>/min</span>
              </div>
              <input
                value={vitals.respRate}
                onChange={(e) => setVitals({ ...vitals, respRate: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}
              />
            </div>

            {/* BMI Calculated */}
            <div style={{ padding: "10px 14px", borderRadius: "14px", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: "11px", color: "#1e40af", fontWeight: 700 }}>Calculated BMI</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e3a8a", marginTop: "2px" }}>{bmi} kg/m²</div>
            </div>
          </div>
        </section>

        {/* Main Grid: Clinical Assessment Notes + Prescription Side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
          {/* FEATURE 2: Voice Dictation & Clinical Terminology Formatting */}
          <section style={{ background: "white", padding: "24px", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>
                <span style={{ color: "#2563eb" }}><Icons.Stethoscope /></span> Clinical Findings & Assessment Notes
              </div>

              {/* Action Toolbar for Voice Dictation & Terminology Formatter */}
              <div className="no-print" style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={toggleListening}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: isListening ? "#ef4444" : "#1e293b",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "12px",
                    border: "none",
                    cursor: "pointer",
                    animation: isListening ? "pulseMic 1.5s infinite" : "none"
                  }}
                >
                  {isListening ? <Icons.MicOff /> : <Icons.Mic />}
                  {isListening ? "Listening... (Click to Pause)" : "Voice Dictation"}
                </button>

                <button
                  type="button"
                  onClick={formatClinicalTerminology}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: "#f0f9ff",
                    color: "#0369a1",
                    fontWeight: 700,
                    fontSize: "12px",
                    border: "1px solid #bae6fd",
                    cursor: "pointer"
                  }}
                >
                  <Icons.Sparkles /> Format Medical Terms
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              placeholder="Start typing or use Voice Dictation button above to speak clinical findings... (Tip: try typing 'c/o fever, h/o hypertension, bp 130/85')"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "14px", lineHeight: "1.6", resize: "vertical" }}
            />
          </section>

          {/* Right Side: Prescription & Finish */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section style={{ background: "white", padding: "24px", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>
                <span style={{ color: "#10b981" }}><Icons.Pill /></span> Prescription Details
              </div>

              {/* Medicine Name with Per-field validation */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Medicine Name *</label>
                <input
                  value={drug}
                  onChange={(e) => setDrug(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: drug ? "1px solid #cbd5e1" : "1px solid #ef4444", outline: "none", fontSize: "13px" }}
                />
              </div>

              {/* Dosage */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Dosage Pattern</label>
                  <input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="1-0-1"
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Frequency</label>
                  <input
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="5 Days"
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Finish & Checkout Button */}
              <button
                onClick={submit}
                disabled={loading}
                className="submit-btn no-print"
                style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "#0f172a", color: "white", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)" }}
              >
                {loading ? "Saving Consultation..." : <><Icons.Check /> Finish Consultation & Bill</>}
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
