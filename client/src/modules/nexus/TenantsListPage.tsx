import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NexusSidebar from "../../components/NexusSidebar";
import NexusHeader from "../../components/NexusHeader";
import { API_BASE_URL as API_BASE } from "../../config/api";
import { Plus, Search, ExternalLink, Trash2, Settings2, ShieldCheck, Database, Layers } from "lucide-react";

export default function TenantsListPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/nexus/tenants`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setTenants(data || []);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently DELETE ${name}?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/nexus/tenants/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      alert("Tenant deleted.");
      fetchTenants();
    } catch (err) {
      alert("Failed to delete tenant.");
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

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.db_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--app-bg)' }}>
      <NexusSidebar />
      <main className="main-content">
        <NexusHeader 
          title="Hospital Shards Infrastructure" 
          subtitle="Provision, configure, and manage isolated database shards for all onboarded hospital networks."
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
                boxShadow: '0 8px 20px -4px rgba(0, 245, 212, 0.4)'
              }}
            >
              <Plus size={18} /> Provision New Hospital
            </button>
          }
        />

        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 10px 30px -10px rgba(0, 56, 112, 0.06)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search hospital name, schema or code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>
              Showing <span style={{ color: '#0f172a', fontWeight: 900 }}>{filteredTenants.length}</span> of {tenants.length} Shards
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>Loading tenant infrastructure...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: '12px 0 0 12px' }}>Hospital Organization</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database Schema</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Subdomain</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan Tier</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
                            style={{ padding: '8px 14px', borderRadius: '10px', background: '#0056A8', color: 'white', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Settings2 size={12} /> Manage
                          </button>
                          <button
                            onClick={() => window.open(buildTenantUrl(t.domain || t.code || t.dbName || t.name.replace(/\s+/g,'-').toLowerCase()), '_blank')}
                            style={{ padding: '8px 14px', borderRadius: '10px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            Launch <ExternalLink size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id, t.name)}
                            style={{ padding: '8px 14px', borderRadius: '10px', background: '#fee2e2', color: '#b91c1c', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                          >
                            Delete
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
