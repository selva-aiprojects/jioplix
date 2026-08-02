import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import {
  Shield, ArrowLeftRight, BookOpen, Lock, Monitor, Bed, Pill, CreditCard,
  Mic, Sparkles, Activity, CheckCircle, Smartphone, Download, Star,
  Clock, HeartPulse, FileText, MessageSquare, Phone, Mail, ArrowRight,
  Zap, AlertTriangle, Tag, Check, Send, Users, ChevronRight, BarChart3
} from 'lucide-react';

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; background-color: #ffffff; color: #0f172a; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4); }
    50% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); }
  }

  @keyframes floatCard {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  .sales-hero-title {
    background: linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #0d9488 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .btn-sales-primary {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    font-weight: 800;
    transition: all 0.25s ease;
  }
  .btn-sales-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(37, 99, 235, 0.35);
  }

  .btn-sales-whatsapp {
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    color: white;
    font-weight: 800;
    transition: all 0.25s ease;
    animation: pulseGlow 3s infinite;
  }
  .btn-sales-whatsapp:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(37, 211, 102, 0.35);
  }

  .sales-feature-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #e2e8f0;
  }
  .sales-feature-card:hover {
    transform: translateY(-6px);
    border-color: #cbd5e1;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
  }

  .nav-link {
    transition: color 0.2s;
    text-decoration: none;
    color: #475569;
    font-weight: 600;
  }
  .nav-link:hover { color: #2563eb; }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #f8fafc; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'dictation' | 'beds' | 'vitals'>('whatsapp');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#0f172a', overflowX: 'hidden' }}>

      {/* ── 1. NAVBAR ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent',
        transition: 'all 0.3s ease',
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
          <BrandLogo size="lg" />

          {!isMobile && (
            <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <a href="#features" className="nav-link">Platform Features</a>
              <a href="#showcase" className="nav-link">Live Interactive Demo</a>
              <a href="#compliance" className="nav-link">Clinical Compliance</a>
              <a href="#contact" className="nav-link">Sales & Onboarding</a>
            </nav>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '10px 20px', borderRadius: '10px', background: '#f1f5f9', color: '#334155', fontWeight: 700, fontSize: '14px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              Sign In
            </button>
            <a
              href="https://wa.me/918825492600"
              target="_blank"
              rel="noreferrer"
              className="btn-sales-whatsapp"
              style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <MessageSquare size={16} /> Book Live Demo
            </a>
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION ────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: isMobile ? '60px 20px 40px' : '90px 24px 70px',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.08) 0%, transparent 70%), #ffffff'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '56px' }}>
          
          {/* Left Hero Sales Pitch */}
          <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeInUp 0.6s ease both' }}>
            <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 14px', borderRadius: '999px' }}>
              <span style={{ background: '#2563eb', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>2026 RELEASE</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>WhatsApp Automation + Voice Dictation + Smart Billing</span>
            </div>

            <h1 className="sales-hero-title" style={{ fontSize: isMobile ? '36px' : '56px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1.5px', margin: 0 }}>
              The Complete Next-Gen Clinical Operating System for Modern Hospitals.
            </h1>

            <p style={{ fontSize: isMobile ? '16px' : '18px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
              Transform OPD consultations, automate patient WhatsApp follow-ups, streamline hourly/daily bed billing, and monitor length-of-stay analytics in real time.
            </p>

            {/* Core Feature Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px' }}>📱 WhatsApp Center</span>
              <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px' }}>🎙️ Voice Dictation</span>
              <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px' }}>🛏️ Hourly/Daily Billing</span>
              <span style={{ background: '#fae8ff', color: '#86198f', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px' }}>📊 &gt;3D LOS Monitor</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '14px', marginTop: '10px' }}>
              <a
                href="https://wa.me/918825492600"
                target="_blank"
                rel="noreferrer"
                className="btn-sales-whatsapp"
                style={{ padding: '16px 28px', borderRadius: '12px', fontSize: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <MessageSquare size={20} /> Schedule Custom Demo
              </a>

              <button
                onClick={() => navigate('/login')}
                className="btn-sales-primary"
                style={{ padding: '16px 28px', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Access Hospital Portal <ArrowRight size={18} />
              </button>
            </div>

            {/* Trust Footer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px' }}>
              <div style={{ display: 'flex' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Trusted by 500+ clinics, hospitals &amp; diagnostic centers across India</span>
            </div>
          </div>

          {/* Right Hero Interactive Mockup */}
          <div style={{ flex: 1, position: 'relative', width: '100%', animation: 'floatCard 6s ease-in-out infinite' }}>
            <div style={{ background: '#0f172a', borderRadius: '24px', padding: '24px', border: '1px solid #334155', boxShadow: '0 32px 64px rgba(15, 23, 42, 0.25)', color: 'white' }}>
              
              {/* Header Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginLeft: '8px' }}>Jioplix HIMS v4.2 · Sales Edition</span>
                </div>
                <span style={{ background: '#25D366', color: 'white', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px' }}>WhatsApp Active</span>
              </div>

              {/* Mockup Card 1: WhatsApp Automation */}
              <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                  <span>📱 Executive WhatsApp Automation</span>
                  <span style={{ color: '#4ade80' }}>98% Delivery Rate</span>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', lineHeight: 1.4 }}>
                  "Dear John Doe, your OPD follow-up with Dr. Sarah Jenkins is on 2026-08-04 at 10:30 AM."
                </div>
              </div>

              {/* Mockup Card 2: Voice Dictation & Inline Vitals */}
              <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#a78bfa' }}>
                  <span>🎙️ Voice Dictation &amp; Compact Vitals</span>
                  <span style={{ color: '#facc15' }}>BP 120/80 (Normal)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Expanded: <em>"c/o fever ➔ Complaining of fever × 3 days"</em>
                </div>
              </div>

              {/* Mockup Card 3: LOS >3 Days Monitor */}
              <div style={{ background: 'rgba(234, 88, 12, 0.15)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(234, 88, 12, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#fb923c' }}>
                  <span>📊 Extended Stay (&gt;3 Days LOS) Alert</span>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>6.1 Days (ICU Bed 04)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#fdba74', marginTop: '4px' }}>
                  Rajesh Khanna • Clinical Review Required
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. 7 CORE FEATURE HIGHLIGHTS (SALES PERSPECTIVE) ──────────────────── */}
      <section id="features" style={{ padding: '90px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#2563eb' }}>Next-Gen Suite</span>
            <h2 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: 900, color: '#0f172a', margin: '10px 0 14px', letterSpacing: '-1px' }}>
              7 Game-Changing Features Built for Growth
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px', lineHeight: 1.6 }}>
              Engineered specifically to maximize hospital revenue, eliminate operational friction, and deliver superior patient satisfaction.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '24px' }}>
            
            {/* Feature 1 */}
            <div className="sales-feature-card" style={{ background: 'white', borderRadius: '20px', padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <MessageSquare size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>1. Executive WhatsApp Automation Center</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Automate OPD follow-up reminders, lab report notifications, and medicine refill alerts via official WhatsApp Cloud API with instant status audit logs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="sales-feature-card" style={{ background: 'white', borderRadius: '20px', padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Mic size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>2. Voice Dictation &amp; Clinical Formatter</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Hands-free speech recognition in doctors' consultation desks. Auto-expands medical shorthand (<code>c/o</code>, <code>h/o</code>, <code>bp</code>) into structured notes in seconds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="sales-feature-card" style={{ background: 'white', borderRadius: '20px', padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Bed size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>3. Hourly &amp; Daily Bed Category Billing</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Flexible rate engine allowing ICU, Deluxe, and General ward rates to be billed hourly or daily based on exact admission and discharge timestamps.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="sales-feature-card" style={{ background: 'white', borderRadius: '20px', padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <BarChart3 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>4. Extended Stay (&gt;3 Days LOS) Monitor</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Active Length of Stay monitoring card on hospital dashboards that automatically flags inpatients exceeding 72 hours for clinical review and discharge clearance.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="sales-feature-card" style={{ background: 'white', borderRadius: '20px', padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <HeartPulse size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>5. Compact Inline Vitals &amp; Consultation Flow</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Space-saving inline vitals display (BP, HR, Temp, SpO2, Resp Rate, calculated BMI) paired with a step-by-step 4-stage Consultation Assessment Flow.
              </p>
            </div>

            {/* Feature 6 & 7 */}
            <div className="sales-feature-card" style={{ background: 'white', borderRadius: '20px', padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <CheckCircle size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>6. Chief Complaints Bar &amp; Field Validation</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Sticky OPD complaints header bar with rapid symptom tags, supported by instant per-field input validation and rich interactive toast feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. LIVE INTERACTIVE SHOWCASE (TABBED DEMO) ────────────────────────── */}
      <section id="showcase" style={{ padding: '90px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#059669' }}>Interactive Product Tour</span>
            <h2 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: 900, color: '#0f172a', margin: '10px 0 0', letterSpacing: '-1px' }}>
              Experience the Platform in Action
            </h2>
          </div>

          {/* Tabs Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'whatsapp', label: '📱 WhatsApp Automation', color: '#25D366' },
              { id: 'dictation', label: '🎙️ Voice Dictation EMR', color: '#2563eb' },
              { id: 'beds', label: '🛏️ Hourly/Daily Bed Billing', color: '#d97706' },
              { id: 'vitals', label: '🩺 Compact Vitals & Complaints', color: '#9333ea' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: activeTab === tab.id ? `2px solid ${tab.color}` : '1px solid #e2e8f0',
                  background: activeTab === tab.id ? '#f8fafc' : 'white',
                  color: activeTab === tab.id ? tab.color : '#64748b',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Content Mockup */}
          <div style={{ background: '#0f172a', borderRadius: '24px', padding: '32px', color: 'white', boxShadow: '0 24px 48px rgba(15, 23, 42, 0.15)' }}>
            {activeTab === 'whatsapp' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#4ade80', marginBottom: '12px' }}>Executive WhatsApp Automation Center</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '15px' }}>
                    Send automated consultation follow-up reminders, diagnostic report links, and medication refill alerts directly to patients' WhatsApp phones.
                  </p>
                  <ul style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#94a3b8' }}>
                    <li>✓ 98%+ Open Rate vs traditional SMS</li>
                    <li>✓ Real-time Delivery Webhooks (Sent, Delivered, Failed)</li>
                    <li>✓ One-click manual instant dispatch button</li>
                  </ul>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>Live WhatsApp Log Sample</div>
                  <div style={{ background: '#020617', padding: '12px', borderRadius: '10px', fontSize: '13px', color: '#4ade80', fontFamily: 'monospace', marginBottom: '10px' }}>
                    [DELIVERED] Reminder REM-1002 ➔ Anita Sharma (+91 91234 56789)<br />
                    "Your Blood Profile Lab Report is ready for download."
                  </div>
                  <div style={{ background: '#020617', padding: '12px', borderRadius: '10px', fontSize: '13px', color: '#60a5fa', fontFamily: 'monospace' }}>
                    [SCHEDULED] Reminder REM-1001 ➔ John Doe (+91 98765 43210)<br />
                    "OPD Follow-up with Dr. Sarah Jenkins on 2026-08-04."
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dictation' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#60a5fa', marginBottom: '12px' }}>Hands-Free Voice Dictation &amp; Terminology Formatter</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '15px' }}>
                    Doctors simply press the microphone button to dictate findings. Our clinical formatter auto-expands medical jargon into neat bullet points.
                  </p>
                  <ul style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#94a3b8' }}>
                    <li>✓ Web Speech API speech-to-text dictation</li>
                    <li>✓ Auto-formats <code>c/o</code>, <code>h/o</code>, <code>k/c/o</code>, <code>bp</code></li>
                    <li>✓ Eliminates 30+ minutes of manual charting per doctor daily</li>
                  </ul>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>Formatted Clinical Output</div>
                  <div style={{ background: '#020617', padding: '14px', borderRadius: '10px', fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6 }}>
                    <strong>Complaining of:</strong> Mild fever × 3 days, dry cough.<br />
                    <strong>History of:</strong> Essential Hypertension.<br />
                    <strong>Blood Pressure:</strong> 120/80 mmHg (Normal).
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'beds' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24', marginBottom: '12px' }}>Dynamic Bed Category Rates (Hourly &amp; Daily)</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '15px' }}>
                    Manage ICU, Deluxe, and General Ward billing with precision. Charge per hour for emergency stays or per day for routine admissions.
                  </p>
                  <ul style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#94a3b8' }}>
                    <li>✓ Configurable hourly vs daily rates per bed category</li>
                    <li>✓ Automated grace period calculator</li>
                    <li>✓ Seamless transfer &amp; discharge ledger sync</li>
                  </ul>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>Rate Matrix Preview</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#020617', borderRadius: '8px' }}>
                      <span>ICU Bed Rate:</span>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>₹500 / hr • ₹7,500 / day</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#020617', borderRadius: '8px' }}>
                      <span>Private Deluxe:</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>₹350 / hr • ₹5,000 / day</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vitals' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc', marginBottom: '12px' }}>Compact Inline Vitals &amp; Chief Complaints Bar</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '15px' }}>
                    Consultation desk features a sticky top chief complaints bar with rapid symptom tags and an inline vitals bar with real-time format validation.
                  </p>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>Inline Vitals Bar</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px', textAlign: 'center' }}>
                    <div style={{ background: '#020617', padding: '8px', borderRadius: '8px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>BP</div>
                      <div style={{ color: '#4ade80', fontWeight: 800 }}>120/80</div>
                    </div>
                    <div style={{ background: '#020617', padding: '8px', borderRadius: '8px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>Heart Rate</div>
                      <div style={{ color: '#60a5fa', fontWeight: 800 }}>72 bpm</div>
                    </div>
                    <div style={{ background: '#020617', padding: '8px', borderRadius: '8px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>BMI</div>
                      <div style={{ color: '#c084fc', fontWeight: 800 }}>22.9 kg/m²</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. COMPLIANCE & TRUST ──────────────────────────────────────────────── */}
      <section id="compliance" style={{ padding: '90px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#2563eb' }}>Enterprise Trust</span>
            <h2 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: 900, color: '#0f172a', margin: '10px 0 0', letterSpacing: '-1px' }}>
              Built for Security, Compliance &amp; Speed
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '20px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Shield size={32} color="#2563eb" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>NHA ABDM Certified</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>Registered with Ayushman Bharat Digital Mission for seamless ABHA creation.</p>
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <ArrowLeftRight size={32} color="#059669" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>HL7 FHIR R4 APIs</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>Interoperable APIs connecting hospital nodes with national health networks.</p>
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Lock size={32} color="#dc2626" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>AES-256 Encryption</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>Bank-grade encryption protecting all medical records and billing data.</p>
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Zap size={32} color="#d97706" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>99.9% Cloud Uptime</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>High-availability multi-tenant cloud architecture engineered for zero downtime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. SALES CALL TO ACTION (NO PRICING TABLE) ─────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          
          <h2 style={{ fontSize: isMobile ? '30px' : '44px', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
            Ready to Supercharge Your Hospital Operations?
          </h2>
          
          <p style={{ fontSize: '18px', color: '#93c5fd', lineHeight: 1.6, maxWidth: '640px', margin: 0 }}>
            Connect with our sales specialists to schedule a live 1-on-1 walkthrough tailored to your hospital or clinic workflow.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginTop: '12px' }}>
            <a
              href="https://wa.me/918825492600"
              target="_blank"
              rel="noreferrer"
              className="btn-sales-whatsapp"
              style={{ padding: '16px 32px', borderRadius: '12px', fontSize: '16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
            >
              <MessageSquare size={20} /> Chat on WhatsApp (+91 88254 92600)
            </a>

            <a
              href="mailto:sales@cybelinx.com"
              style={{ padding: '16px 32px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontWeight: 800, fontSize: '16px', border: '1px solid rgba(255, 255, 255, 0.3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
            >
              <Mail size={20} /> Email Sales Team
            </a>
          </div>
        </div>
      </section>

      {/* ── 7. CONTACT & FOOTER ────────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '80px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
            <a href="mailto:sales@cybelinx.com" style={{ padding: '24px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a' }}>
              <Mail size={24} color="#2563eb" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 800, fontSize: '16px' }}>Email Sales</div>
              <div style={{ color: '#2563eb', fontWeight: 700, marginTop: '4px' }}>sales@cybelinx.com</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>24-hour turnaround guaranteed</div>
            </a>

            <a href="tel:+918825492600" style={{ padding: '24px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a' }}>
              <Phone size={24} color="#059669" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 800, fontSize: '16px' }}>Phone Sales Hotline</div>
              <div style={{ color: '#059669', fontWeight: 700, marginTop: '4px' }}>+91 88254 92600</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Mon – Sat, 9:00 AM – 7:00 PM IST</div>
            </a>

            <a href="https://wa.me/918825492600" target="_blank" rel="noreferrer" style={{ padding: '24px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a' }}>
              <MessageSquare size={24} color="#25D366" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 800, fontSize: '16px' }}>Instant WhatsApp Demo</div>
              <div style={{ color: '#25D366', fontWeight: 700, marginTop: '4px' }}>+91 88254 92600</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Instant reply from sales engineer</div>
            </a>
          </div>

          <footer style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <BrandLogo size="md" />
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Copyright © 2026 <strong>Cybelinx Solutions LLP</strong>. All Rights Reserved.
            </p>
          </footer>
        </div>
      </section>
    </div>
  );
}
