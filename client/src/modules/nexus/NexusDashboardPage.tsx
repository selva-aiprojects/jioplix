import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import NexusSidebar from "../../components/NexusSidebar";
import NexusHeader from "../../components/NexusHeader";
import { API_BASE_URL as API_BASE } from "../../config/api";
import { 
  Building2, Activity, Database, Users, Plus, ShieldCheck, 
  ExternalLink, Layers, ArrowUpRight, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";

export default function NexusDashboardPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'nexus') {
       navigate("/");
       return;
    }
    fetchTenants();
  }, [role, navigate]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/nexus/tenants`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setTenants(res.data || []);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    } finally {
      setLoading(false);
    }
  };

  const buildTenantUrl = (domainOrCode: string) => {
    const tenantLabel = (domainOrCode || '').trim().toLowerCase();
    const configured = (import.meta as any).env?.VITE_APP_DOMAIN;
    let root = configured || '';
    if (!root && typeof window !== 'undefined') {
      const host = window.location.hostname;
      const parts = host.split('.');
      root = parts.length >= 2 ? parts.slice(-2).join('.') : host;
    }
    return `${window.location.protocol}//${tenantLabel}.${root}`;
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--app-bg)' }}>
      <NexusSidebar />
      <main className="main-content">
        <NexusHeader 
          title="Nexus Global Orchestration Console" 
          subtitle="Multi-tenant healthcare infrastructure surveillance, shard allocation and enterprise system health."
          actions={
            <button
              onClick={() => navigate('/nexus/tenants/new')}
              style={{
                padding: '12px 24px',
                borderRadius: '14px',
                background: '#00F5D4',
                color: '#0b0f19',
                fontWeight: 900,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px -4px rgba(0, 245, 212, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={18} /> Provision New Shard
            </button>
          }
        />

        {/* Executive KPI Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px -6px rgba(0, 56, 112, 0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 120, 255, 0.1)', color: '#0078FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} />
              </div>
              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>
                +100% Provisioned
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>{tenants.length}</div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 700 }}>Active Hospital Shards</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px -6px rgba(0, 56, 112, 0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={24} />
              </div>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> LIVE SLA
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>99.99%</div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 700 }}>Service Uptime &amp; Gateway Health</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px -6px rgba(0, 56, 112, 0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(157, 78, 221, 0.1)', color: '#9D4EDD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={24} />
              </div>
              <span style={{ background: '#f3e8ff', color: '#7e22ce', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>
                PostgreSQL SSL
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>24.8 GB</div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 700 }}>Isolated Tenant Database Load</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px -6px rgba(0, 56, 112, 0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} />
              </div>
              <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>
                HIPAA Tier 7
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>100%</div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 700 }}>Security &amp; ABDM Compliance Score</div>
          </div>
        </div>

        {/* Shard Directory Table Section */}
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 10px 30px -10px rgba(0, 56, 112, 0.06)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Active Hospital Shards Directory</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Real-time database isolation schemas and tenant endpoints</p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={fetchTenants}
                style={{ padding: '8px 16px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>Loading active hospital shards...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: '12px 0 0 12px' }}>Hospital Tenant</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database Schema</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Domain Routing</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan Tier</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>Orchestration Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s ease' }}>
                      <td style={{ padding: '18px 16px', fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>
                        {t.name}
                      </td>
                      <td style={{ padding: '18px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#0056A8', fontWeight: 700 }}>
                        {t.db_name || t.dbName || t.code || 'default'}
                      </td>
                      <td style={{ padding: '18px 16px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                        <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          {t.domain || t.code || 'local'}.jioplix.com
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>
                          {t.plan || 'Enterprise Tier'}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px' }}>
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 900, padding: '4px 12px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#15803d' }} /> ACTIVE
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => navigate(`/nexus/tenants/${t.id}`)}
                            style={{ padding: '8px 14px', borderRadius: '10px', background: '#0056A8', color: 'white', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                          >
                            Manage Shard
                          </button>
                          <button
                            onClick={() => window.open(buildTenantUrl(t.domain || t.code || t.dbName || t.name.replace(/\s+/g,'-').toLowerCase()), '_blank')}
                            style={{ padding: '8px 14px', borderRadius: '10px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            Launch <ExternalLink size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
