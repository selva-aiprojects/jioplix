import { useState } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Code2 } from "lucide-react";

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
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="FHIR R4 & HL7 Native Interface Layer" subtitle="HL7 v2.x Message Compiler, FHIR Resource Endpoints & RESTful Data Exchange" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#0f172a", margin: 0, fontWeight: 800, fontSize: "18px" }}>FHIR R4 Resource Engine Inspector</h3>
              <button onClick={testFhirEndpoint} style={{ background: "#0ea5e9", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <Code2 size={16} /> Fetch Test FHIR Patient Resource
              </button>
            </div>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Generating FHIR R4 JSON payload...</div>
            ) : fhirJson ? (
              <pre style={{ background: "#0f172a", padding: "20px", borderRadius: "14px", border: "1px solid #334155", color: "#38bdf8", fontSize: "13px", overflowX: "auto" }}>
                {JSON.stringify(fhirJson, null, 2)}
              </pre>
            ) : (
              <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
                Click "Fetch Test FHIR Patient Resource" to generate and inspect a live FHIR R4 RESTful resource bundle.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
