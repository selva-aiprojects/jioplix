import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { CheckCircle2, ShieldAlert } from "lucide-react";

interface PlaceholderProps {
  title: string;
  iconName: string;
  description: string;
}

export default function ModulePlaceholderPage({ title, description }: PlaceholderProps) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title={title} />
        
        <div style={{ padding: 24, maxWidth: 800 }}>
          <div className="form-card" style={{
            background: 'rgba(30, 41, 59, 0.45)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: 32,
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(13, 165, 142, 0.15) 100%)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}>
                <CheckCircle2 size={32} color="#38bdf8" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'white' }}>{title}</h2>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Standard SaaS Suite</span>
              </div>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', marginBottom: 24 }}>
              {description}
            </p>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>
                <span>Module Deployment Status</span>
                <span style={{ marginLeft: 'auto', color: '#10b981' }}>85% (Core Framework Loaded)</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)', borderRadius: 4 }} />
              </div>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              padding: '16px 20px',
              borderRadius: 12,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginBottom: 28
            }}>
              <ShieldAlert size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#d97706', fontWeight: 600 }}>
                Administration Note: Shard initialization is complete. Turn on feature toggles in Hospital Configuration to enable live transaction endpoints.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="button-primary" style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}>Request Access Activation</button>
              <button style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }} onClick={() => window.history.back()}>Go Back</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
