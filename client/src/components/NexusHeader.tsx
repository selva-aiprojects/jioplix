import { useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { Shield, Sparkles, LogOut, Globe, Cpu, Activity } from "lucide-react";

interface NexusHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function NexusHeader({ title = "Nexus Control Plane", subtitle = "Global Multi-Tenant Infrastructure & Hospital Shard Orchestration", actions }: NexusHeaderProps) {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Master Admin";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header style={{ 
      display: 'flex', 
      flexDirection: 'column',
      marginBottom: '28px',
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #0b0f19 0%, #003870 50%, #0056A8 100%)',
      color: '#ffffff',
      padding: '28px 32px',
      boxShadow: '0 16px 36px -10px rgba(0, 56, 112, 0.35)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Ambient Glow */}
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(0, 245, 212, 0.2) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

      {/* Top Info Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 245, 212, 0.15)', border: '1px solid rgba(0, 245, 212, 0.35)', padding: '4px 12px', borderRadius: '999px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00F5D4', boxShadow: '0 0 10px #00F5D4' }} />
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#00F5D4', letterSpacing: '0.5px' }}>NEXUS ROOT CONSOLE</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>v4.2 Enterprise Release</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
             <p style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>{userName}</p>
             <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 700 }}>SuperAdmin Root Privileges</p>
          </div>

          <button 
            onClick={handleLogout}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '12px', 
              background: 'rgba(239, 68, 68, 0.2)', 
              color: '#f87171', 
              border: '1px solid rgba(239, 68, 68, 0.4)', 
              fontSize: '12px', 
              fontWeight: 800, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>

      {/* Main Title & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            {title}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '6px', margin: '6px 0 0', fontWeight: 500, maxWidth: '700px' }}>
            {subtitle}
          </p>
        </div>

        {actions && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
