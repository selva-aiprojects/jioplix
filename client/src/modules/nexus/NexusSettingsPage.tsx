import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NexusSidebar from "../../components/NexusSidebar";
import NexusHeader from "../../components/NexusHeader";
import { CheckCircle2, ShieldCheck, Zap, Database, Mail, CreditCard, Sparkles } from "lucide-react";

export default function NexusSettingsPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== 'nexus') {
      navigate("/");
    }
  }, [role, navigate]);

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--app-bg)' }}>
      <NexusSidebar />
      <main className="main-content">
        <NexusHeader 
          title="Nexus Global Configuration & Integrations" 
          subtitle="Manage transactional email infrastructure, payment gateways, database connection pools and AI acceleration endpoints."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Card 1: Email Infrastructure */}
          <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px -6px rgba(0, 56, 112, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 86, 168, 0.1)', color: '#0056A8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={24} />
              </div>
              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> CONNECTED
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>Resend Email API Engine</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Handles automated hospital tenant provisioning credentials, staff invite links, and patient communication.
            </p>
            <div style={{ marginTop: '20px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'monospace', color: '#334155' }}>
              Sender: onboarding@cognivectra.com
            </div>
          </div>

          {/* Card 2: Global Database Shards */}
          <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px -6px rgba(0, 56, 112, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(112, 0, 255, 0.1)', color: '#7000FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={24} />
              </div>
              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> HEALTHY (SSL)
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>Supabase PostgreSQL Shards</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Isolated database schemas with dynamic connection pool adapters and SSL certificate enforcement.
            </p>
            <div style={{ marginTop: '20px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'monospace', color: '#334155' }}>
              Pool: aws-1-ap-southeast-1.pooler
            </div>
          </div>

          {/* Card 3: AI Clinical Acceleration */}
          <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px -6px rgba(0, 56, 112, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 245, 212, 0.15)', color: '#00C897', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={24} />
              </div>
              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> ONLINE
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>Groq AI Diagnostics Model</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Powers automated clinical summarization, ICD-10 medical coding assistant, and prescription risk detection.
            </p>
            <div style={{ marginTop: '20px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'monospace', color: '#334155' }}>
              Model: Llama3-70b-8192 (Ultra Low Latency)
            </div>
          </div>

          {/* Card 4: Billing & Payments Gateway */}
          <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px -6px rgba(0, 56, 112, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={24} />
              </div>
              <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>
                SETUP PENDING
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>Stripe Global Billing Gateway</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Multi-currency subscription engine for automated hospital software licenses and usage billing.
            </p>
            <div style={{ marginTop: '20px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'monospace', color: '#334155' }}>
              Gateway: Stripe Connect API v2024
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
