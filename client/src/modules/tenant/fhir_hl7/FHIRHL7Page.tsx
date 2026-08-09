import { useState } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Code2, Share2, CheckCircle2 } from "lucide-react";

export default function FHIRHL7Page() {
  const [fhirJson, setFhirJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFhirEndpoint = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/fhir-hl7/Patient/PT-1002", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      setFhirJson(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="FHIR R4 & HL7 Native Interface Layer" subtitle="HL7 v2.x Message Compiler, FHIR Resource Endpoints & RESTful Data Exchange" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: 'white', margin: 0, fontWeight: 800 }}>FHIR R4 Resource Engine Inspector</h3>
              <button onClick={testFhirEndpoint} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Code2 size={16} /> Fetch Test FHIR Patient Resource
              </button>
            </div>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Generating FHIR R4 JSON payload...</div>
            ) : fhirJson ? (
              <pre style={{ background: '#0f172a', padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', fontSize: 13, overflowX: 'auto' }}>
                {JSON.stringify(fhirJson, null, 2)}
              </pre>
            ) : (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>
                Click "Fetch Test FHIR Patient Resource" to generate and inspect a live FHIR R4 RESTful resource bundle.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
