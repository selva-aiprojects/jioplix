import React from "react";
import { Lock, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface PlanGateGuardProps {
  moduleName: string;
  requiredPlan?: string;
  children: React.ReactNode;
}

export default function PlanGateGuard({ moduleName, requiredPlan = "Professional or Enterprise", children }: PlanGateGuardProps) {
  const plan = (localStorage.getItem("tenantPlan") || "basic").toLowerCase();
  const atLeastProfessional = ["professional", "enterprise"].includes(plan);

  if (atLeastProfessional) {
    return <>{children}</>;
  }

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--app-bg)' }}>
      <Sidebar />
      <main className="main-content">
        <Header 
          title={`${moduleName}`} 
          subtitle="Enterprise Subscription Tier Restricted Area"
        />

        <div style={{
          background: 'linear-gradient(135deg, #0b0f19 0%, #003870 50%, #0056A8 100%)',
          borderRadius: '24px',
          padding: '48px 40px',
          color: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(0, 56, 112, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          maxWidth: '850px',
          margin: '20px auto',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ambient Glow */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(0, 245, 212, 0.25) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 245, 212, 0.15)', border: '1px solid rgba(0, 245, 212, 0.35)', padding: '6px 14px', borderRadius: '999px', marginBottom: '24px' }}>
            <Lock size={14} color="#00F5D4" />
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#00F5D4', letterSpacing: '0.5px' }}>{requiredPlan.toUpperCase()} TIER REQUIRED</span>
          </div>

          <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-0.5px', color: '#ffffff' }}>
            Unlock {moduleName}
          </h2>

          <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 32px 0', maxWidth: '650px' }}>
            Your organization is currently on the <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>{plan}</strong> plan. Access to <strong>{moduleName}</strong> (Non-Clinical Operations, Advanced Analytics Intelligence, and Signal Communication Desks) is exclusively available on <strong>Professional</strong> and <strong>Enterprise</strong> tiers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ShieldCheck size={20} color="#00F5D4" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>Full HRMS &amp; Payroll</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Staff shifts, attendance &amp; automated tax payslips.</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Sparkles size={20} color="#00F5D4" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>Supply &amp; Inventory</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Procurement, rate contracts, GRN &amp; stock control.</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Lock size={20} color="#00F5D4" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>Analytics &amp; Intelligence</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Operational load, OPD trends &amp; financial KPIs.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => alert("Please contact Nexus Support or your Account Executive to upgrade your subscription to Professional / Enterprise tier.")}
              style={{
                padding: '14px 28px',
                borderRadius: '14px',
                background: '#00F5D4',
                color: '#0b0f19',
                fontWeight: 900,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px -4px rgba(0, 245, 212, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              Request Upgrade to Professional Tier <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
