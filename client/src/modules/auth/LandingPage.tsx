import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import {
  Shield, ArrowLeftRight, Lock, Bed, Pill, CreditCard,
  Mic, CheckCircle, Star, HeartPulse, MessageSquare, Phone, Mail, ArrowRight,
  Zap, Users, BarChart3,
  Stethoscope, Calendar, FlaskConical, Headset, Bot, Sparkles, Check
} from 'lucide-react';

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4); }
    50% { box-shadow: 0 0 0 14px rgba(37, 211, 102, 0); }
  }

  @keyframes floatHeroCard {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  /* COLORFUL MAGIC GRADIENT TEXT CLASS */
  .magic-sales-title {
    background: linear-gradient(135deg, #002B5B 0%, #0056A8 35%, #7000FF 70%, #00C897 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .magic-card-light {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 10px 30px -10px rgba(0, 56, 112, 0.06);
    position: relative;
    overflow: hidden;
  }

  .magic-card-light:hover {
    transform: translateY(-8px);
    box-shadow: 0 24px 48px -12px rgba(0, 56, 112, 0.14);
    border-color: #b8d4f0;
  }

  .btn-magic-gradient {
    background: linear-gradient(135deg, #0056A8 0%, #003870 100%);
    color: white;
    font-weight: 800;
    transition: all 0.25s ease;
    box-shadow: 0 8px 24px -4px rgba(0, 86, 168, 0.35);
  }

  .btn-magic-gradient:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 36px -4px rgba(0, 86, 168, 0.45);
  }

  .btn-sales-whatsapp {
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    color: white;
    font-weight: 800;
    transition: all 0.25s ease;
    animation: pulseGlow 3s infinite;
  }
  .btn-sales-whatsapp:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 36px rgba(37, 211, 102, 0.4);
  }

  .nav-link {
    transition: color 0.2s ease;
    text-decoration: none;
    color: #334155;
    font-weight: 700;
    font-size: 14px;
  }
  .nav-link:hover { color: #0056A8; }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #f8fafc; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
`;

const MODULES = [
  { icon: Stethoscope, title: 'OPD & Consultation', desc: 'Registration, doctor queues, consultation desk with inline vitals, chief-complaint bar & voice dictation.', color: '#0056A8', bg: '#e0f2fe', tag: '⚡ +94% Speedup' },
  { icon: Calendar, title: 'Appointments & Scheduling', desc: 'Doctor availability, weekly rules, advanced scheduling console and patient self-booking.', color: '#7c3aed', bg: '#ede9fe', tag: '📅 1-Click Booking' },
  { icon: Bed, title: 'IPD & Bed Census', desc: 'Admission desk, live bed map, census & daycare, discharge summaries and hourly/daily bed billing.', color: '#d97706', bg: '#fef3c7', tag: '🛏️ Zero Leakage' },
  { icon: FlaskConical, title: 'Laboratory Management', desc: 'Lab billing queue, work-order management, results workflow and AI-assisted lab assistant.', color: '#059669', bg: '#d1fae5', tag: '🔬 Automated TAT' },
  { icon: Pill, title: 'Pharmacy & Stock Control', desc: 'Dashboard, stock inventory, inward register, order management and prescription queue.', color: '#dc2626', bg: '#fee2e2', tag: '📦 Batch Expiry Guard' },
  { icon: CreditCard, title: 'Billing & Invoicing', desc: 'Central billing desk, insurance processing, GST e-Invoicing and real-time financial audit.', color: '#0284c7', bg: '#e0f2fe', tag: '💳 Instant GST Audit' },
  { icon: BarChart3, title: 'Operations & Clinical Analytics', desc: 'Extended-stay (>3 days) LOS monitor, dashboards and trend analytics for smarter decisions.', color: '#0d9488', bg: '#ccfbf1', tag: '📊 Live Surveillance' },
  { icon: Headset, title: 'Enterprise Help Desk', desc: 'Staff & patient-grievance tickets with SLA policies, auto-escalation and equipment register.', color: '#9333ea', bg: '#f3e8ff', tag: '🎫 99.9% SLA Track' },
  { icon: MessageSquare, title: 'WhatsApp Communication', desc: 'Message board, mail management, reminder tracker and executive WhatsApp automation center.', color: '#16a34a', bg: '#dcfce7', tag: '📱 98% Open Rate' },
  { icon: Bot, title: 'Clinical AI Co-Pilot', desc: 'Multi-tenant RAG chatbot, voice dictation (STT), vision OCR, text-to-action and audio TTS.', color: '#4338ca', bg: '#e0e7ff', tag: '🤖 Zero Jargon Error' },
  { icon: Users, title: 'Staff Roster & HRMS', desc: 'Manage credentials, shifts, attendance, on-call rosters, statutory payroll and permissions.', color: '#ea580c', bg: '#ffedd5', tag: '👨‍⚕️ Automated Shifts' },
  { icon: Shield, title: 'HIPAA RBAC & Security', desc: 'HIPAA-compliant roles, PII masking tiers, granular permissions and audit trails.', color: '#059669', bg: '#d1fae5', tag: '🔒 ABDM M2/M3' },
];

const SALES_STATS = [
  { val: '99.99%', label: 'Cloud Uptime SLA', desc: 'High-availability multi-tenant isolation' },
  { val: '+94%', label: 'Consultation Speedup', desc: 'Hands-free voice dictation & auto-notes' },
  { val: '< 60 sec', label: 'Check-In to Desk', desc: 'Rapid barcode & patient lookup' },
  { val: '3.5x', label: 'Revenue Capture', desc: 'Hourly/Daily bed & package billing audit' },
];

const FEATURES = [
  { icon: MessageSquare, color: '#16a34a', bg: '#dcfce7', title: 'Executive WhatsApp Automation Center', desc: 'Automate OPD follow-up reminders, lab report notifications and medicine refill alerts via the official WhatsApp Cloud API with delivery webhooks and audit logs.', tag: 'High Conversion' },
  { icon: Mic, color: '#0056A8', bg: '#e0f2fe', title: 'Voice Dictation & Clinical Formatter', desc: 'Hands-free speech-to-text at the consultation desk. Auto-expands medical shorthand (c/o, h/o, bp) into structured notes in seconds.', tag: 'Time Saver' },
  { icon: Bed, color: '#d97706', bg: '#fef3c7', title: 'Hourly & Daily Bed Category Billing', desc: 'Flexible rate engine billing ICU, Deluxe and General ward beds per hour or per day based on exact admission and discharge timestamps.', tag: 'Revenue Guard' },
  { icon: BarChart3, color: '#dc2626', bg: '#fee2e2', title: 'Extended Stay (>3 Days LOS) Monitor', desc: 'Flags inpatients exceeding 72 hours on the dashboard for clinical review, discharge clearance and length-of-stay trend analysis.', tag: 'Clinical Safety' },
  { icon: HeartPulse, color: '#9333ea', bg: '#f3e8ff', title: 'Compact Inline Vitals & Consultation Flow', desc: 'Space-saving BP, HR, Temp, SpO2, Resp rate and BMI display paired with a step-by-step 4-stage consultation assessment flow.', tag: 'Ergonomic UI' },
  { icon: CheckCircle, color: '#0d9488', bg: '#ccfbf1', title: 'Chief Complaints Bar & Validation', desc: 'Sticky OPD complaints header with rapid symptom tags, per-field validation and rich interactive toast feedback.', tag: 'Zero Missed Data' },
  { icon: Headset, color: '#7c3aed', bg: '#ede9fe', title: 'Help Desk with SLA & Escalation', desc: 'Categorized tickets, configurable response/resolution SLAs, automatic multi-level escalation and a full hospital equipment register.', tag: 'SLA Guaranteed' },
  { icon: Bot, color: '#4338ca', bg: '#e0e7ff', title: 'AI Co-Pilot Across Every Module', desc: 'Context-aware assistant with RAG lookups, real-time metrics, OCR document reading, voice commands and text-to-action execution.', tag: 'Smart Intelligence' },
  { icon: Shield, color: '#059669', bg: '#d1fae5', title: 'HIPAA RBAC & PII Masking', desc: 'Seven-tier roles, full/masked/de-identified PII views, audit-ready access controls and emergency override.', tag: 'Bank-Grade Security' },
];

const TABS = [
  { id: 'whatsapp', label: '📱 WhatsApp Automation', color: '#16a34a' },
  { id: 'dictation', label: '🎙️ Voice Dictation EMR', color: '#0056A8' },
  { id: 'beds', label: '🛏️ Bed Billing & LOS', color: '#d97706' },
  { id: 'helpdesk', label: '🎫 Help Desk & SLA', color: '#9333ea' },
  { id: 'vitals', label: '🩺 Vitals & Complaints', color: '#0d9488' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('whatsapp');
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
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#0f172a', overflowX: 'hidden', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>

      {/* ── 1. NAVBAR ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent',
        transition: 'all 0.3s ease',
        padding: isMobile ? '0 12px' : '0 24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
          <BrandLogo size={isMobile ? 'md' : 'lg'} />

          {!isMobile && (
            <nav style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
              <a href="#modules" className="nav-link">Modules</a>
              <a href="#features" className="nav-link">Platform Features</a>
              <a href="#stats" className="nav-link">ROI Impact</a>
              <a href="#showcase" className="nav-link">Live Tour</a>
              <a href="#compliance" className="nav-link">Compliance</a>
              <a href="#contact" className="nav-link">Contact Sales</a>
            </nav>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ 
                padding: isMobile ? '6px 12px' : '10px 22px', 
                borderRadius: '12px', 
                background: '#ffffff', 
                color: '#0056A8', 
                fontWeight: 700, 
                fontSize: isMobile ? '12px' : '14px', 
                border: '1.5px solid #0056A8', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#e6f0ff'; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#ffffff'; }}
            >
              Sign In
            </button>
            <a
              href="https://wa.me/918825492600"
              target="_blank"
              rel="noreferrer"
              className="btn-sales-whatsapp"
              style={{ 
                padding: isMobile ? '6px 12px' : '10px 20px', 
                borderRadius: '12px', 
                fontSize: isMobile ? '12px' : '14px', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <MessageSquare size={isMobile ? 14 : 16} /> {isMobile ? 'Demo' : 'Book Live Demo'}
            </a>
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION (BRIGHT COLORFUL LIGHT THEME WITH MAGIC GRADIENT TITLE) ─── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: isMobile ? '60px 20px 50px' : '90px 24px 80px',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0, 86, 168, 0.12) 0%, rgba(248, 250, 252, 0.6) 60%, #ffffff 100%)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '56px' }}>

          {/* Left Hero Sales Pitch */}
          <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeInUp 0.6s ease both' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignSelf: 'flex-start', 
              alignItems: 'center', 
              gap: '10px', 
              background: '#e6f0ff', 
              border: '1px solid #b8d4f0', 
              padding: '6px 16px', 
              borderRadius: '999px' 
            }}>
              <span style={{ background: '#0056A8', color: '#ffffff', fontSize: '11px', fontWeight: 900, padding: '2px 8px', borderRadius: '999px' }}>NEW 2026 EDITION</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#003870' }}>✨ 12+ Clinical Modules · AI Co-Pilot · Help Desk SLA</span>
            </div>

            <h1 className="magic-sales-title" style={{ fontSize: isMobile ? '36px' : '56px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', margin: 0 }}>
              The Complete Next-Gen Clinical Operating System.
            </h1>

            <p style={{ fontSize: isMobile ? '16px' : '19px', color: '#475569', lineHeight: 1.65, margin: 0 }}>
              One unified platform spanning OPD, IPD, Laboratory, Pharmacy, Billing &amp; Appointments — supercharged with WhatsApp automation, hands-free voice dictation, an AI Co-Pilot and enterprise Help Desk SLA escalation.
            </p>

            {/* Core Feature Magic Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '20px' }}>📱 WhatsApp Center</span>
              <span style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '20px' }}>🎙️ Voice Dictation</span>
              <span style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '20px' }}>🛏️ Hourly Bed Audit</span>
              <span style={{ background: '#f3e8ff', border: '1px solid #e9d5ff', color: '#7e22ce', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '20px' }}>🎫 Help Desk &amp; SLA</span>
              <span style={{ background: '#e0e7ff', border: '1px solid #c7d2fe', color: '#4338ca', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '20px' }}>🤖 AI Co-Pilot</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '14px', marginTop: '10px' }}>
              <a
                href="https://wa.me/918825492600"
                target="_blank"
                rel="noreferrer"
                className="btn-sales-whatsapp"
                style={{ padding: '16px 30px', borderRadius: '14px', fontSize: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <MessageSquare size={20} /> Schedule Custom Demo
              </a>

              <button
                onClick={() => navigate('/login')}
                className="btn-magic-gradient"
                style={{ padding: '16px 30px', borderRadius: '14px', fontSize: '16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                Access Hospital Portal <ArrowRight size={18} />
              </button>
            </div>

            {/* Social Proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px' }}>
              <div style={{ display: 'flex' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Trusted by 500+ clinics, multi-specialty hospitals &amp; diagnostic chains</span>
            </div>
          </div>

          {/* Right Hero Interactive Mockup Showcase */}
          <div style={{ flex: 1, position: 'relative', width: '100%', animation: 'floatHeroCard 6s ease-in-out infinite' }}>
            <div style={{ background: '#0f172a', borderRadius: '28px', padding: '24px', border: '1px solid #334155', boxShadow: '0 32px 64px rgba(15, 23, 42, 0.22)', color: 'white' }}>

              {/* Header Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginLeft: '8px' }}>Jioplix Clinical OS v4.2</span>
                </div>
                <span style={{ background: 'rgba(37, 211, 102, 0.2)', border: '1px solid #25D366', color: '#4ade80', fontSize: '10px', fontWeight: 900, padding: '3px 10px', borderRadius: '20px' }}>⚡ 99.99% Live</span>
              </div>

              {/* Card 1: WhatsApp Center */}
              <div style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                  <span>📱 Executive WhatsApp Automation</span>
                  <span style={{ color: '#4ade80' }}>98% Delivery Webhook</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px', lineHeight: 1.4 }}>
                  "Dear Patient, your lab report is ready. Click to view OPD follow-up summary."
                </div>
              </div>

              {/* Card 2: Help Desk Ticket */}
              <div style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(167, 139, 250, 0.3)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 800, color: '#a78bfa' }}>
                  <span>🎫 SLA Ticket TK-0001</span>
                  <span style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>ON TRACK</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Ventilator Display Fault → Auto-Escalation L1 to L2 • 4h SLA
                </div>
              </div>

              {/* Card 3: LOS Alert */}
              <div style={{ background: 'rgba(234, 88, 12, 0.15)', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(234, 88, 12, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 800, color: '#fb923c' }}>
                  <span>📊 Extended Stay (&gt;3 Days LOS) Monitor</span>
                  <span style={{ color: '#ef4444', fontWeight: 900 }}>6.1 Days (ICU 04)</span>
                </div>
                <div style={{ fontSize: '12px', color: '#fdba74', marginTop: '4px' }}>
                  Rajesh Khanna • Clinical Review &amp; Discharge Clearance Flagged
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. VIBRANT SALES STATS & ROI BANNER ────────────────────────────────────────── */}
      <section id="stats" style={{ padding: '60px 24px', background: 'linear-gradient(135deg, #003870 0%, #0056A8 50%, #00C897 100%)', color: '#ffffff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '24px' }}>
          {SALES_STATS.map((s, idx) => (
            <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '24px', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '32px' : '44px', fontWeight: 900, marginBottom: '6px', color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>{s.val}</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. COLORFUL LIGHT-THEME MODULES MAP ────────────────────────────────────── */}
      <section id="modules" style={{ padding: '90px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>

          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#0056A8' }}>Comprehensive Ecosystem</span>
            <h2 style={{ fontSize: isMobile ? '30px' : '44px', fontWeight: 900, color: '#0f172a', margin: '10px 0 14px', letterSpacing: '-1px' }}>
              12 Deeply-Integrated Clinical Modules
            </h2>
            <p style={{ color: '#64748b', fontSize: '17px', lineHeight: 1.6 }}>
              Spanning the entire patient journey — from front-desk registration to discharge, laboratory diagnostics, pharmacy inventory and statutory financial audits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '20px' }}>
            {MODULES.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div className="magic-card-light" key={idx} style={{ padding: '28px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: mod.bg, color: mod.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={26} />
                    </div>
                    <span style={{ background: mod.bg, color: mod.color, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>
                      {mod.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>{mod.title}</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.65, margin: 0 }}>{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. FLAGSHIP SALES FEATURES ────────────────────────────────────────── */}
      <section id="features" style={{ padding: '90px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>

          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#00C897' }}>Sales Advantage</span>
            <h2 style={{ fontSize: isMobile ? '30px' : '44px', fontWeight: 900, color: '#0f172a', margin: '10px 0 14px', letterSpacing: '-1px' }}>
              9 Game-Changing Capabilities Engineered for Growth
            </h2>
            <p style={{ color: '#64748b', fontSize: '17px', lineHeight: 1.6 }}>
              Maximize hospital revenue capture, eliminate operational friction, and deliver a 10x superior patient experience.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '24px' }}>
            {FEATURES.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div className="magic-card-light" key={idx} style={{ padding: '32px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={26} />
                    </div>
                    <span style={{ background: f.bg, color: f.color, fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px' }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>{idx + 1}. {f.title}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. LIVE INTERACTIVE SHOWCASE (TABBED DEMO) ────────────────────────── */}
      <section id="showcase" style={{ padding: '90px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>

          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#0056A8' }}>Interactive Tour</span>
            <h2 style={{ fontSize: isMobile ? '30px' : '44px', fontWeight: 900, color: '#0f172a', margin: '10px 0 0', letterSpacing: '-1px' }}>
              Explore Platform Workflows Live
            </h2>
          </div>

          {/* Tabs Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '14px 24px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: activeTab === tab.id ? `2px solid ${tab.color}` : '1px solid #e2e8f0',
                  background: activeTab === tab.id ? '#ffffff' : '#ffffff',
                  color: activeTab === tab.id ? tab.color : '#64748b',
                  boxShadow: activeTab === tab.id ? `0 8px 24px -6px ${tab.color}40` : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Content Mockup */}
          <div style={{ background: '#0f172a', borderRadius: '28px', padding: '40px', color: 'white', boxShadow: '0 32px 64px rgba(15, 23, 42, 0.16)' }}>
            {activeTab === 'whatsapp' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '40px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#4ade80', marginBottom: '14px' }}>Executive WhatsApp Automation Center</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.65, fontSize: '16px' }}>
                    Send automated consultation follow-up reminders, diagnostic report links, and medication refill alerts directly to patients' WhatsApp accounts via official Meta Cloud API.
                  </p>
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={18} color="#4ade80" /> <span>98%+ Open Rate vs traditional SMS text messages</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={18} color="#4ade80" /> <span>Real-time Delivery Webhooks (Sent, Delivered, Read, Failed)</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={18} color="#4ade80" /> <span>One-click manual instant dispatch button for doctors &amp; reception</span></div>
                  </div>
                </div>
                <div style={{ background: '#020617', borderRadius: '18px', padding: '24px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                  <div style={{ fontWeight: 800, color: '#4ade80', marginBottom: '14px', fontSize: '14px' }}>LIVE WHATSAPP DISPATCH STREAM</div>
                  <div style={{ background: '#0f172a', padding: '14px', borderRadius: '12px', fontSize: '13px', color: '#4ade80', fontFamily: 'monospace', marginBottom: '12px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                    [DELIVERED] Reminder REM-1002 ➔ Anita Sharma (+91 91234 56789)<br />
                    "Your Complete Blood Count Pathology Report is ready for download."
                  </div>
                  <div style={{ background: '#0f172a', padding: '14px', borderRadius: '12px', fontSize: '13px', color: '#38bdf8', fontFamily: 'monospace', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    [SCHEDULED] Reminder REM-1001 ➔ John Doe (+91 98765 43210)<br />
                    "OPD Follow-up with Dr. Sarah Jenkins scheduled on 2026-08-04 at 10:30 AM."
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dictation' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '40px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#60a5fa', marginBottom: '14px' }}>Hands-Free Voice Dictation &amp; Formatter</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.65, fontSize: '16px' }}>
                    Doctors press the microphone button to dictate consultation notes. Our clinical engine auto-expands medical jargon into structured notes in seconds.
                  </p>
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={18} color="#60a5fa" /> <span>Web Speech API real-time speech-to-text dictation</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={18} color="#60a5fa" /> <span>Auto-formats shorthand (c/o, h/o, k/c/o, bp, hr) into formal medical notes</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={18} color="#60a5fa" /> <span>Eliminates 30+ minutes of tedious charting per doctor every day</span></div>
                  </div>
                </div>
                <div style={{ background: '#020617', borderRadius: '18px', padding: '24px', border: '1px solid rgba(96, 165, 250, 0.3)' }}>
                  <div style={{ fontWeight: 800, color: '#60a5fa', marginBottom: '14px', fontSize: '14px' }}>FORMATTED CLINICAL EMR NOTE</div>
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', fontSize: '14px', color: '#f8fafc', lineHeight: 1.7, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <strong style={{ color: '#38bdf8' }}>Chief Complaints:</strong> Mild fever × 3 days, dry cough.<br />
                    <strong style={{ color: '#38bdf8' }}>Medical History:</strong> Essential Hypertension (k/c/o HTN).<br />
                    <strong style={{ color: '#38bdf8' }}>Vitals:</strong> BP 120/80 mmHg · HR 72 bpm · SpO2 98%.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'beds' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '40px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#fbbf24', marginBottom: '14px' }}>Dynamic Bed Billing &amp; Extended-Stay Monitor</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.65, fontSize: '16px' }}>
                    Manage ICU, Deluxe, and General Ward bed rates with precision. Charge per hour for emergency stays or per day for routine admissions — with automated length-of-stay alerts.
                  </p>
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={18} color="#fbbf24" /> <span>Configurable hourly vs daily rates per bed category</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={18} color="#fbbf24" /> <span>Automated grace period calculator and billing audit</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={18} color="#fbbf24" /> <span>&gt;3-Day Length of Stay (LOS) auto-flag for clinical review</span></div>
                  </div>
                </div>
                <div style={{ background: '#020617', borderRadius: '18px', padding: '24px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                  <div style={{ fontWeight: 800, color: '#fbbf24', marginBottom: '14px', fontSize: '14px' }}>BED CATEGORY RATE MATRIX</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span>ICU Bed Rate:</span>
                      <span style={{ color: '#fbbf24', fontWeight: 800 }}>₹500 / hr • ₹7,500 / day</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span>Private Deluxe:</span>
                      <span style={{ color: '#4ade80', fontWeight: 800 }}>₹350 / hr • ₹5,000 / day</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <span>LOS Flag Threshold:</span>
                      <span style={{ color: '#f87171', fontWeight: 800 }}>&gt;72 hours • ICU Bed 04</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'helpdesk' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '40px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#c084fc', marginBottom: '14px' }}>Enterprise SLA Help Desk &amp; Equipment Register</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.65, fontSize: '16px' }}>
                    Route every staff request and patient grievance through a structured ticketing system with category routing, resolution SLAs and multi-level auto-escalation.
                  </p>
                </div>
                <div style={{ background: '#020617', borderRadius: '18px', padding: '24px', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
                  <div style={{ fontWeight: 800, color: '#c084fc', marginBottom: '14px', fontSize: '14px' }}>TICKET BOARD STATUS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', borderRadius: '10px' }}>
                      <span>TK-0001 · Ventilator Display Fault</span>
                      <span style={{ color: '#4ade80', fontWeight: 800 }}>ON TRACK</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', borderRadius: '10px' }}>
                      <span>TK-0002 · Pharmacy Stock Sync Delay</span>
                      <span style={{ color: '#fbbf24', fontWeight: 800 }}>AT RISK</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', borderRadius: '10px' }}>
                      <span>TK-0003 · Patient Grievance (Billing)</span>
                      <span style={{ color: '#f87171', fontWeight: 800 }}>ESCALATED L2</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vitals' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '40px', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#34d399', marginBottom: '14px' }}>Compact Inline Vitals &amp; Symptoms Bar</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.65, fontSize: '16px' }}>
                    Consultation desk features a sticky top chief complaints bar with rapid symptom tags and an inline vitals bar with real-time range validation.
                  </p>
                </div>
                <div style={{ background: '#020617', borderRadius: '18px', padding: '24px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                  <div style={{ fontWeight: 800, color: '#34d399', marginBottom: '14px', fontSize: '14px' }}>INLINE VITALS BOARD</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '13px', textAlign: 'center' }}>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>BP</div>
                      <div style={{ color: '#4ade80', fontWeight: 900, fontSize: '16px' }}>120/80</div>
                    </div>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>Heart Rate</div>
                      <div style={{ color: '#38bdf8', fontWeight: 900, fontSize: '16px' }}>72 bpm</div>
                    </div>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>BMI</div>
                      <div style={{ color: '#34d399', fontWeight: 900, fontSize: '16px' }}>22.9 kg/m²</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 7. ENTERPRISE COMPLIANCE ────────────────────────────────────────────── */}
      <section id="compliance" style={{ padding: '90px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#0056A8' }}>Enterprise Security</span>
            <h2 style={{ fontSize: isMobile ? '30px' : '44px', fontWeight: 900, color: '#0f172a', margin: '10px 0 0', letterSpacing: '-1px' }}>
              Built for Security, Compliance &amp; High Speed
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '20px' }}>
            <div className="magic-card-light" style={{ padding: '28px 24px' }}>
              <Shield size={34} color="#0056A8" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>NHA ABDM Certified</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>Registered with Ayushman Bharat Digital Mission for seamless ABHA creation and M2/M3 compliance.</p>
            </div>

            <div className="magic-card-light" style={{ padding: '28px 24px' }}>
              <ArrowLeftRight size={34} color="#059669" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>HL7 FHIR R4 APIs</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>Interoperable APIs connecting hospital nodes with national health networks seamlessly.</p>
            </div>

            <div className="magic-card-light" style={{ padding: '28px 24px' }}>
              <Lock size={34} color="#dc2626" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>AES-256 &amp; HIPAA RBAC</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>Bank-grade encryption with seven-tier role access and full/de-identified PII masking controls.</p>
            </div>

            <div className="magic-card-light" style={{ padding: '28px 24px' }}>
              <Zap size={34} color="#d97706" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>99.99% Cloud Uptime</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>High-availability multi-tenant cloud architecture engineered for zero downtime operations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. HIGH-CONVERTING SALES CALL TO ACTION BANNER ─────────────────────────── */}
      <section style={{ padding: '90px 24px', background: 'linear-gradient(135deg, #003870 0%, #0056A8 100%)', color: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.3)', padding: '6px 16px', borderRadius: '999px' }}>
            <Sparkles size={16} color="#ffffff" />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>TRANSFORM YOUR HOSPITAL TODAY</span>
          </div>

          <h2 style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', lineHeight: 1.15 }}>
            Ready to Supercharge Your Hospital Operations &amp; Growth?
          </h2>

          <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.65, maxWidth: '680px', margin: 0 }}>
            Connect with our clinical sales specialists for a live 1-on-1 walkthrough tailored specifically to your hospital or clinic workflow.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginTop: '12px' }}>
            <a
              href="https://wa.me/918825492600"
              target="_blank"
              rel="noreferrer"
              className="btn-sales-whatsapp"
              style={{ padding: '18px 36px', borderRadius: '16px', fontSize: '17px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
            >
              <MessageSquare size={22} /> Chat on WhatsApp (+91 88254 92600)
            </a>

            <a
              href="mailto:sales@cybelinx.com"
              style={{ 
                padding: '18px 36px', 
                borderRadius: '16px', 
                background: 'rgba(255, 255, 255, 0.15)', 
                color: 'white', 
                fontWeight: 800, 
                fontSize: '17px', 
                border: '1px solid rgba(255, 255, 255, 0.35)', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '10px',
                transition: 'all 0.25s ease'
              }}
            >
              <Mail size={22} /> Email Sales Team
            </a>
          </div>
        </div>
      </section>

      {/* ── 9. CONTACT CARDS & FOOTER ────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '80px 24px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
            <a href="mailto:sales@cybelinx.com" className="magic-card-light" style={{ padding: '28px', textDecoration: 'none', color: '#0f172a' }}>
              <Mail size={28} color="#0056A8" style={{ marginBottom: '14px' }} />
              <div style={{ fontWeight: 900, fontSize: '18px' }}>Email Sales Team</div>
              <div style={{ color: '#0056A8', fontWeight: 800, marginTop: '6px', fontSize: '15px' }}>sales@cybelinx.com</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>24-hour turnaround guaranteed</div>
            </a>

            <a href="tel:+918825492600" className="magic-card-light" style={{ padding: '28px', textDecoration: 'none', color: '#0f172a' }}>
              <Phone size={28} color="#059669" style={{ marginBottom: '14px' }} />
              <div style={{ fontWeight: 900, fontSize: '18px' }}>Phone Sales Hotline</div>
              <div style={{ color: '#059669', fontWeight: 800, marginTop: '6px', fontSize: '15px' }}>+91 88254 92600</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>Mon – Sat, 9:00 AM – 7:00 PM IST</div>
            </a>

            <a href="https://wa.me/918825492600" target="_blank" rel="noreferrer" className="magic-card-light" style={{ padding: '28px', textDecoration: 'none', color: '#0f172a' }}>
              <MessageSquare size={28} color="#25D366" style={{ marginBottom: '14px' }} />
              <div style={{ fontWeight: 900, fontSize: '18px' }}>Instant WhatsApp Demo</div>
              <div style={{ color: '#25D366', fontWeight: 800, marginTop: '6px', fontSize: '15px' }}>+91 88254 92600</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>Instant reply from sales engineer</div>
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
