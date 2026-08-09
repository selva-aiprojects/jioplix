import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { useToast } from "../../../components/ToastProvider";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import { Bed, ShieldAlert, BadgeCheck, CheckCircle2, User, HeartPulse, Stethoscope, Search, UserPlus, SlidersHorizontal, Activity, ArrowRight, ShieldCheck, Info } from 'lucide-react';


const WARD_COLORS: Record<string, { bg: string; badge: string; text: string }> = {
  "Regular Care": { bg: "#eff6ff", badge: "#3b82f6", text: "#1e40af" },
  "ICU":          { bg: "#fff1f2", badge: "#f43f5e", text: "#9f1239" },
  "Emergency":    { bg: "#fff7ed", badge: "#f97316", text: "#c2410c" },
  "Daycare":      { bg: "#f0fdf4", badge: "#22c55e", text: "#15803d" },
  "Special Care": { bg: "#fdf4ff", badge: "#a855f7", text: "#7e22ce" },
};

export default function IPDBedMap() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [wards, setWards] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWard, setActiveWard] = useState<any>(null);
  const [wardBeds, setWardBeds] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [admitForm, setAdmitForm] = useState({
    patientId: "", wardId: "", bedId: "", admittingDoctorId: "",
    admissionReason: "", dailyCharge: "0"
  });

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "x-tenant-id": localStorage.getItem("tenant") || ""
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wardRes, patRes, staffRes] = await Promise.all([
        axios.get(`${API_BASE}/api/hospital/ipd/bedmap`, { headers }),
        axios.get(`${API_BASE}/api/patients?limit=100`, { headers }),
        axios.get(`${API_BASE}/api/hospital/staff`, { headers }),
      ]);
      setWards(wardRes.data);
      setPatients(patRes.data);
      setStaff(staffRes.data.filter((s: any) => s.role?.toLowerCase() === 'doctor' || s.role?.toLowerCase() === 'admin'));
      if (wardRes.data.length > 0) selectWard(wardRes.data[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const selectWard = async (ward: any) => {
    setActiveWard(ward);
    try {
      const res = await axios.get(`${API_BASE}/api/hospital/ipd/wards/${ward.id}/beds`, { headers });
      setWardBeds(res.data);
      // If no beds provisioned yet, provision them
      if (res.data.length === 0) {
        await axios.post(`${API_BASE}/api/hospital/ipd/wards/${ward.id}/provision-beds`, {}, { headers });
        const res2 = await axios.get(`${API_BASE}/api/hospital/ipd/wards/${ward.id}/beds`, { headers });
        setWardBeds(res2.data);
      }
    } catch (err) { console.error(err); }
  };

  const openAdmitModal = (bed: any) => {
    setSelectedBed(bed);
    setAdmitForm(f => ({ 
      ...f, 
      bedId: bed.id, 
      wardId: activeWard.id,
      dailyCharge: String(activeWard.base_charge || "0")
    }));
    setShowAdmitModal(true);
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/hospital/ipd/admissions`, admitForm, { headers });
      showToast("Patient admitted successfully.", "success");
      setShowAdmitModal(false);
      selectWard(activeWard);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Admission failed", "error");
    }
  };

  const totalOccupied = wards.reduce((acc, w) => acc + Number(w.occupied || 0), 0);
  const totalBeds = wards.reduce((acc, w) => acc + Number(w.capacity || 0), 0);
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--app-bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <Header title="IPD Bed Management" />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', marginBottom: '40px', marginTop: '8px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#e0f2fe', color: '#0056A8', display: 'grid', placeItems: 'center', boxShadow: '0 10px 15px -3px rgba(0, 86, 168, 0.1)' }}>
            <Bed size={24} />
          </div>
          <p style={{ margin: 0, color: '#475569', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Inpatient Census Overview</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px', fontWeight: 500, maxWidth: '600px' }}>Real-time bed availability tracking, patient admission logistics, and ward utilization surveillance.</p>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {[
            { label: 'Total Capacity', value: totalBeds, color: '#0056A8', icon: <Bed size={22} />, bg: '#eff6ff' },
            { label: 'Occupied Beds', value: totalOccupied, color: '#ef4444', icon: <Activity size={22} />, bg: '#fef2f2' },
            { label: 'Available Beds', value: totalBeds - totalOccupied, color: '#10b981', icon: <ShieldCheck size={22} />, bg: '#ecfdf5' },
            { label: 'Bed Occupancy', value: `${occupancyRate}%`, color: '#a855f7', icon: <HeartPulse size={22} />, bg: '#fdf4ff' },
          ].map((s, i) => (
            <div key={i} style={{ 
              background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s',
              cursor: 'default'
            }} className="hover-scale">
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
                <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 900, color: s.color }}>{loading ? '—' : s.value}</p>
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: s.bg, color: s.color, display: 'grid', placeItems: 'center' }}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px' }}>
          {/* Ward List */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SlidersHorizontal size={16} style={{ color: '#0056A8' }} /> Care Wards
                </h3>
              </div>
              <div style={{ padding: '12px', maxHeight: '68vh', overflowY: 'auto' }}>
                {["Emergency", "ICU", "Special Care", "Regular Care", "Daycare"].map(category => {
                  const categoryWards = wards.filter(w => w.type === category);
                  if (categoryWards.length === 0) return null;
                  
                  return (
                    <div key={category} style={{ marginBottom: '16px' }}>
                      <div style={{ padding: '4px 12px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{category}</div>
                      {categoryWards.map((ward, i) => {
                        const color = WARD_COLORS[ward.type] || WARD_COLORS["Regular Care"];
                        const pct = ward.capacity > 0 ? Math.round((Number(ward.occupied) / Number(ward.capacity)) * 100) : 0;
                        const isSelected = activeWard?.id === ward.id;
                        return (
                          <div key={i} onClick={() => selectWard(ward)} style={{
                            padding: '12px 16px', borderRadius: '16px', marginTop: '6px', cursor: 'pointer',
                            background: isSelected ? color.bg : 'transparent',
                            border: `2px solid ${isSelected ? color.badge : 'transparent'}`,
                            transition: 'all 0.25s'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>{ward.name}</span>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: color.text, background: isSelected ? 'rgba(255,255,255,0.6)' : '#f1f5f9', padding: '2px 8px', borderRadius: '8px' }}>
                                {ward.occupied}/{ward.capacity}
                              </span>
                            </div>
                            <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? '#ef4444' : color.badge, borderRadius: '4px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => navigate('/tenant/ipd/admissions')}
              style={{ 
                width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', 
                borderRadius: '16px', fontWeight: 800, cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
              }}
            >
              <Info size={16} /> View Admission Records
            </button>
          </aside>

          {/* Bed Grid */}
          <section>
            <div style={{ background: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ 
                padding: '24px 32px', borderBottom: '1px solid #f1f5f9', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '16px'
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeWard?.name || 'Select a Ward'}
                  </h2>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                    {activeWard?.floor || 'Main Block'} · {activeWard?.type || 'Standard Care'} · Rate: ₹{Number(activeWard?.base_charge || 0).toLocaleString()}/day
                  </p>
                </div>
                
                {/* Status Filter Tab Buttons */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                  {[
                    { label: "All Beds", value: "All" },
                    { label: "Vacant", value: "Vacant" },
                    { label: "Occupied", value: "Occupied" },
                    { label: "Maintenance", value: "Maintenance" }
                  ].map(tab => {
                    const isActive = statusFilter === tab.value;
                    const count = tab.value === "All" ? wardBeds.length : wardBeds.filter(b => b.status === tab.value).length;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', border: 'none',
                          background: isActive ? 'white' : 'transparent',
                          color: isActive ? '#0f172a' : '#64748b',
                          boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                          fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                        }}
                      >
                        {tab.label} <span style={{ 
                          fontSize: '10px', background: isActive ? '#f1f5f9' : 'rgba(0,0,0,0.05)', 
                          color: isActive ? '#0f172a' : '#64748b', padding: '1px 6px', borderRadius: '6px'
                        }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid Content */}
              <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                {wardBeds.filter(b => statusFilter === "All" || b.status === statusFilter).map((bed, i) => {
                  const isOccupied = bed.status === 'Occupied';
                  const isMaint = bed.status === 'Maintenance';
                  const bg = isOccupied ? '#fef2f2' : isMaint ? '#fffbeb' : '#ecfdf5';
                  const border = isOccupied ? '#fca5a5' : isMaint ? '#fcd34d' : '#a7f3d0';
                  const textColor = isOccupied ? '#ef4444' : isMaint ? '#d97706' : '#10b981';
                  const badgeBg = isOccupied ? '#fee2e2' : isMaint ? '#fef3c7' : '#d1fae5';
                  return (
                    <div
                      key={i}
                      onClick={() => !isOccupied && !isMaint && openAdmitModal(bed)}
                      style={{
                        padding: '24px 20px', borderRadius: '24px', background: bg, border: `2px solid ${border}`,
                        cursor: isOccupied ? 'default' : 'pointer',
                        display: 'flex', flexDirection: 'column', gap: '14px', transition: 'all 0.25s',
                        boxShadow: isOccupied ? '0 8px 16px rgba(239, 68, 68, 0.04)' : 'none',
                        position: 'relative'
                      }}
                      className="hover-scale"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', background: badgeBg, color: textColor, padding: '3px 8px', borderRadius: '8px', fontWeight: 900, letterSpacing: '0.5px' }}>
                          {bed.status.toUpperCase()}
                        </span>
                        <Bed size={18} style={{ color: textColor }} />
                      </div>
                      
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>{bed.bed_number}</div>
                      </div>

                      {isOccupied ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #fee2e2', paddingTop: '12px', marginTop: '4px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} style={{ color: '#64748b' }} /> {bed.patient_name?.split(' ')[0]}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>MRN: {bed.mrn}</div>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/tenant/ipd/admissions/${bed.admission_id}`); }}
                            style={{ 
                              marginTop: '8px', padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', 
                              borderRadius: '12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                              boxShadow: '0 4px 12px rgba(239,68,68,0.15)'
                            }}
                          >
                            View Case <ArrowRight size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: `1px solid ${border}`, paddingTop: '12px', marginTop: '4px' }}>
                          <span style={{ fontSize: '12px', color: textColor, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isMaint ? 'Out of Service' : '+ Admit Patient'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {wardBeds.filter(b => statusFilter === "All" || b.status === statusFilter).length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <CheckCircle2 size={40} style={{ margin: '0 auto 16px', opacity: 0.15 }} />
                    <p style={{ fontWeight: 700 }}>No beds match the selected status.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Admit Modal */}
        {showAdmitModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '32px', width: '520px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={22} style={{ color: '#0056A8' }} /> Admit Patient
                  </h2>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                    Ward: {activeWard?.name} · Bed: <strong>{selectedBed?.bed_number}</strong>
                  </p>
                </div>
                <button onClick={() => setShowAdmitModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: '#64748b', fontSize: '18px', display: 'grid', placeItems: 'center' }}>✕</button>
              </div>

              <form onSubmit={handleAdmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient Selection</label>
                  <select required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '14px', color: '#334155' }}
                    onChange={e => setAdmitForm(f => ({ ...f, patientId: e.target.value }))}
                  >
                    <option value="">Search & Select Patient...</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admitting Physician</label>
                  <select required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '14px', color: '#334155' }}
                    onChange={e => setAdmitForm(f => ({ ...f, admittingDoctorId: e.target.value }))}
                  >
                    <option value="">Select Doctor...</option>
                    {staff.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admission Reason / Diagnosis</label>
                  <textarea required rows={3} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', resize: 'none', fontSize: '14px', color: '#334155' }}
                    placeholder="e.g. Chest pain, shortness of breath..."
                    onChange={e => setAdmitForm(f => ({ ...f, admissionReason: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Bed Charge (₹)</label>
                  <input type="number" required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}
                    value={admitForm.dailyCharge}
                    onChange={e => setAdmitForm(f => ({ ...f, dailyCharge: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowAdmitModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ 
                    flex: 2, padding: '16px', borderRadius: '16px', background: '#0f172a', color: 'white', border: 'none', 
                    fontWeight: 900, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
                  }}>
                    Confirm Admission
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
