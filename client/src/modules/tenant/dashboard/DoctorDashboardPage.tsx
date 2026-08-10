import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import { Users, FileText, Pill, FlaskConical, TrendingUp, UserCheck, RefreshCcw, Activity, Clock, ChevronRight } from "lucide-react";
import { formatNumber } from "../../../utils/currency";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const [userName] = useState(localStorage.getItem("userName") || "Doctor");
  const displayName = userName.toLowerCase().startsWith('dr') ? userName : `Dr. ${userName}`;
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    patientsSeen: 0,
    newPatients: 0,
    repeatPatients: 0,
    business: {
      prescriptions: 0,
      labs: 0,
      consultations: 0,
      revenue: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const tenant = localStorage.getItem("tenant");
        const doctorId = localStorage.getItem("userId"); // Assuming userId is doctorId for doctors

        if (!doctorId) return;

        const res = await axios.get(`${API_BASE}/api/doctors/${doctorId}/stats`, {
          headers: { Authorization: `Bearer ${token}`, "x-tenant-id": tenant }
        });
        
        if (res.data) {
          setStats(res.data);
        }
        
        const patientsRes = await axios.get(`${API_BASE}/api/hospital/encounters?doctorId=${doctorId}&status=All`, {
          headers: { Authorization: `Bearer ${token}`, "x-tenant-id": tenant }
        });

        const list = Array.isArray(patientsRes.data) ? patientsRes.data : (Array.isArray(patientsRes.data?.data) ? patientsRes.data.data : []);
        setRecentPatients(list.slice(0, 10));
      } catch (err) {
        console.error("Doctor Stats Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-layout" style={{ position: 'relative', overflowX: 'hidden' }}>
      {/* Dynamic ambient mesh glow layers */}
      <div style={{
        position: 'fixed',
        top: '-10%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '10%',
        right: '-10%',
        width: '45vw',
        height: '45vw',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        top: '40%',
        left: '50%',
        width: '35vw',
        height: '35vw',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <Sidebar />
      <main className="main-content" style={{ padding: '40px', zIndex: 1 }}>
        <Header title={`${displayName}'s Workspace`} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', marginBottom: '48px', marginTop: '8px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#eff6ff', display: 'grid', placeItems: 'center', color: '#3b82f6', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1)' }}>
            <TrendingUp size={24} />
          </div>
          <p style={{ margin: 0, color: '#475569', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Clinical Performance</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px', fontWeight: 500, maxWidth: '600px' }}>Your individual clinical statistics, patient retention, and business generated for the facility.</p>
        </div>

        {/* TOP ROW: Patient Metrics */}
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Patient Overview</h3>
        <MetricsGrid>
          <MetricCard
            icon={Users}
            label="Total Appointed Patients"
            value={loading ? "..." : stats.patientsSeen}
            iconBg="#eff6ff"
            iconColor="#3b82f6"
            accent="#3b82f6"
          />
          <MetricCard
            icon={UserCheck}
            label="New Patients"
            value={loading ? "..." : stats.newPatients}
            iconBg="#f0fdf4"
            iconColor="#10b981"
            accent="#10b981"
          />
          <MetricCard
            icon={RefreshCcw}
            label="Returning Patients"
            value={loading ? "..." : stats.repeatPatients}
            iconBg="#fff7ed"
            iconColor="#f97316"
            accent="#f97316"
          />
        </MetricsGrid>

        {/* BOTTOM ROW: Business Breakdown */}
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Clinical Activities & Business</h3>
        <MetricsGrid>
          <MetricCard
            icon={FileText}
            label="Consultations Finished"
            value={loading ? "..." : stats.business?.consultations || 0}
            iconBg="#f5f3ff"
            iconColor="#8b5cf6"
            accent="#8b5cf6"
          />
          <MetricCard
            icon={Pill}
            label="Prescriptions Written"
            value={loading ? "..." : stats.business?.prescriptions || 0}
            iconBg="#ecfdf5"
            iconColor="#059669"
            accent="#059669"
          />
          <MetricCard
            icon={FlaskConical}
            label="Lab Tests Ordered"
            value={loading ? "..." : stats.business?.labs || 0}
            iconBg="#fef2f2"
            iconColor="#ef4444"
            accent="#ef4444"
          />
          <MetricCard
            icon={TrendingUp}
            label="Total Value Generated"
            value={loading ? "..." : formatNumber(stats.business?.revenue)}
            iconBg="#fefce8"
            iconColor="#ca8a04"
            accent="#ca8a04"
          />
        </MetricsGrid>

        {/* RECENT PATIENTS RECORD TABLE */}
        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>My Recent Patient Records</h3>
             <button onClick={() => navigate('/tenant/opd/queue')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
               VIEW FULL QUEUE <ChevronRight size={14} />
             </button>
          </div>
          
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--app-bg)', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Patient Name</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>MRN / Phone</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      <Activity size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>No patient records found</div>
                    </td>
                  </tr>
                )}
                {recentPatients.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: '#1e293b' }}>{p.patient_name}</td>
                    <td style={{ padding: '16px 24px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{p.mrn}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 800,
                        background: p.status === 'Active' ? '#fefce8' : '#f0fdf4',
                        color: p.status === 'Active' ? '#ca8a04' : '#16a34a'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={12}/> {new Date(p.created_at).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                       <button onClick={() => navigate('/tenant/opd/consultation', { state: { encounter: p } })} style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                         {p.status === 'Active' ? 'CONSULT' : 'VIEW'}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
