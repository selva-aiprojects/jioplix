import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Eye, FileCode, Monitor, ZoomIn } from "lucide-react";

export default function DICOMPACSPage() {
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudy, setSelectedStudy] = useState<any>(null);

  const fetchPACS = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/dicom-pacs/studies", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) {
        setStudies(data.studies || []);
        if (data.studies && data.studies.length > 0) setSelectedStudy(data.studies[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPACS();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="DICOM & PACS Diagnostic Imaging Viewer" subtitle="Embedded HTML5 Canvas DICOM Viewer, Modality Worklists & Radiologist Reports" />

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          {/* Studies Worklist */}
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>PACS Modality Worklist</h3>
            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading studies...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {studies.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => setSelectedStudy(s)}
                    style={{ background: selectedStudy?.id === s.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)', border: `1px solid ${selectedStudy?.id === s.id ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, padding: 14, borderRadius: 10, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: 800, marginBottom: 4 }}>
                      <span>{s.patient_name}</span>
                      <span style={{ color: '#38bdf8', fontSize: 12 }}>{s.modality}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>MRN: {s.mrn} • Series: {s.series_count} • Images: {s.instances_count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Canvas Viewer Mock */}
          <div className="form-card" style={{ background: '#090d16', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 450 }}>
            {selectedStudy ? (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
                  <span>Study UID: {selectedStudy.study_instance_uid}</span>
                  <span>Modality: {selectedStudy.modality}</span>
                </div>

                <div style={{ width: '100%', height: 320, background: '#000', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {/* Simulated DICOM Scan */}
                  <div style={{ width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(56,189,248,0.05) 60%, transparent 100%)', border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Monitor size={48} color="#38bdf8" />
                  </div>
                  <div style={{ position: 'absolute', bottom: 12, left: 12, color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                    W: 400 L: 40 • Zoom: 100%
                  </div>
                </div>

                <div style={{ marginTop: 16, textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h5 style={{ margin: '0 0 6px 0', color: 'white' }}>Radiologist Findings</h5>
                  <p style={{ color: '#cbd5e1', fontSize: 13, margin: 0 }}>
                    {selectedStudy.radiologist_report || 'Diagnostic scan complete. No acute intracranial hemorrhage or territorial infarction identified.'}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8' }}>Select a DICOM study from worklist to open Web Viewer</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
