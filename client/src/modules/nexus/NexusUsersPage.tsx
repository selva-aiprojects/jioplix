import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NexusSidebar from "../../components/NexusSidebar";
import NexusHeader from "../../components/NexusHeader";
import { UserPlus, Shield, Key, Search, CheckCircle2, UserCheck } from "lucide-react";

export default function NexusUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== 'nexus') {
      navigate("/");
      return;
    }
    setUsers([
      { id: 1, name: "Master Admin", email: "admin@hims-sys.com", role: "Nexus Super Admin", status: "Active", lastLogin: "Just now" },
      { id: 2, name: "System Support Lead", email: "support@hims-sys.com", role: "Operations Lead", status: "Active", lastLogin: "2 hours ago" },
      { id: 3, name: "DevOps Orchestrator", email: "devops@cognivectra.com", role: "Infrastructure Manager", status: "Active", lastLogin: "Yesterday" },
    ]);
  }, [role, navigate]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--app-bg)' }}>
      <NexusSidebar />
      <main className="main-content">
        <NexusHeader 
          title="Super Admin Authorization" 
          subtitle="Manage root access credentials, role-based privileges, and audit control keys for Nexus platform administrators."
          actions={
            <button 
              onClick={() => alert("Creating a new root administrator requires security key verification.")}
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
              <UserPlus size={18} /> Provision Admin Credentials
            </button>
          }
        />

        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 10px 30px -10px rgba(0, 56, 112, 0.06)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search admin name or email address..."
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
              Root Super Admins: <span style={{ color: '#0f172a', fontWeight: 900 }}>{filteredUsers.length}</span> Active
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: '12px 0 0 12px' }}>Administrator Name</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email &amp; Identity</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Privilege Tier</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Activity</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Access Status</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>Security Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '18px 16px', fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#002B5B', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>
                          {u.name.slice(0,2).toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td style={{ padding: '18px 16px', fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '18px 16px' }}>
                      <span style={{ background: '#f3e8ff', color: '#7e22ce', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={12} /> {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '18px 16px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                      {u.lastLogin}
                    </td>
                    <td style={{ padding: '18px 16px' }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 900, padding: '4px 12px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#15803d' }} /> ACTIVE
                      </span>
                    </td>
                    <td style={{ padding: '18px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => alert(`Resetting security keys for ${u.name}...`)}
                        style={{ padding: '8px 14px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Key size={12} /> Rotate Keys
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
