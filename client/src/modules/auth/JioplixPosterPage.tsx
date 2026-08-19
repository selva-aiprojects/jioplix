import { useNavigate } from 'react-router-dom';
import type { CSSProperties } from 'react';
import {
  Activity,
  ArrowRight,
  Bed,
  Bot,
  CalendarDays,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  Globe2,
  HeartPulse,
  MessageSquare,
  Pill,
  ShieldCheck,
  Stethoscope,
  WalletCards,
  Wifi,
} from 'lucide-react';

const featureGroups = [
  {
    icon: Building2,
    title: 'Run the whole hospital',
    items: ['OPD, IPD, emergency & nursing', 'ICU, OT, CSSD & blood bank', 'Ambulance, mortuary & dietetics'],
    accent: '#0b5cad',
  },
  {
    icon: Activity,
    title: 'Make every decision clearer',
    items: ['EMR, MRD, quality & infection control', 'Laboratory, radiology & AI lab', 'DICOM/PACS, FHIR, HL7 & ABDM'],
    accent: '#008b78',
  },
  {
    icon: WalletCards,
    title: 'Keep operations moving',
    items: ['Billing, finance, insurance & GST', 'Pharmacy, inventory & procurement', 'HRMS, payroll, CRM & help desk'],
    accent: '#d56b26',
  },
  {
    icon: HeartPulse,
    title: 'Put patients in the loop',
    items: ['Patient portal & mobile experience', 'Telemedicine & virtual rooms', 'Appointments, referrals & consent'],
    accent: '#2563eb',
  },
  {
    icon: ShieldCheck,
    title: 'Connect every layer securely',
    items: ['Device telemetry & connected care', 'Role-based access & PHI governance', 'Multi-tenant Nexus administration'],
    accent: '#7c3aed',
  },
];

const quickWins = [
  { icon: Bot, label: 'AI Co-Pilot', detail: 'Ask. Find. Act.' },
  { icon: MessageSquare, label: 'WhatsApp automation', detail: 'Stay connected.' },
  { icon: ShieldCheck, label: 'Secure by design', detail: 'Audit every action.' },
  { icon: Wifi, label: 'Cloud + offline ready', detail: 'Care never pauses.' },
];

export default function JioplixPosterPage() {
  const navigate = useNavigate();

  return (
    <main className="jioplix-poster-page">
      <div className="poster-shell">
        <header className="poster-nav">
          <a href="/" className="poster-brand" aria-label="Jioplix home">
            <img src="/logo.png" alt="Jioplix" />
          </a>
          <div className="poster-nav-actions">
            <button type="button" className="poster-text-button" onClick={() => navigate('/login')}>Sign in</button>
            <a className="poster-nav-cta" href="https://wa.me/918825492600" target="_blank" rel="noreferrer">
              Book a demo <ArrowRight size={15} />
            </a>
          </div>
        </header>

        <section className="poster-hero">
          <div className="poster-hero-copy">
            <div className="poster-kicker"><span /> The intelligent hospital OS</div>
            <h1>One system.<br /><em>Every</em> care moment.</h1>
            <p className="poster-lede">Jioplix brings clinical care, hospital operations and patient experience into one calm, connected command center.</p>
            <div className="poster-proof-row">
              <div><strong>30+</strong><span>connected modules</span></div>
              <div><strong>24/7</strong><span>care continuity</span></div>
              <div><strong>1</strong><span>unified workspace</span></div>
            </div>
          </div>

          <div className="poster-dashboard" aria-label="Jioplix command center preview">
            <div className="dashboard-topline"><div className="window-dots"><i /><i /><i /></div><span>jioplix / command center</span><b><span /> LIVE</b></div>
            <div className="dashboard-heading"><div><small>GOOD MORNING, ADMIN</small><h2>Hospital overview</h2></div><div className="dashboard-avatar">RV</div></div>
            <div className="dashboard-metrics">
              <div><span>Patients today</span><strong>228</strong><small className="up">↑ 12.4%</small></div>
              <div><span>Appointments</span><strong>32</strong><small>Across 8 departments</small></div>
              <div><span>Bed occupancy</span><strong>78%</strong><small>42 beds available</small></div>
            </div>
            <div className="dashboard-body">
              <div className="dashboard-chart"><div className="chart-head"><span>Patient flow</span><small>Last 7 days</small></div><div className="chart-area"><span className="chart-line" /><i /><i /><i /><i /><i /></div><div className="chart-labels"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div></div>
              <div className="dashboard-activity"><div className="chart-head"><span>Live pulse</span><small className="pulse-dot">● Online</small></div><p><Activity size={13} /> 18 consults in progress</p><p><FlaskConical size={13} /> 6 lab reports ready</p><p><Bed size={13} /> ICU bed review flagged</p></div>
            </div>
            <div className="dashboard-ai"><Bot size={18} /><span><b>AI Co-Pilot</b><small>“3 discharge summaries ready for review.”</small></span><ChevronRight size={16} /></div>
          </div>
        </section>

        <section className="poster-ribbon"><div><span className="ribbon-mark">J</span><p><strong>From first registration to final discharge.</strong><br />Everything your team needs, already in the flow.</p></div><span className="ribbon-arrow"><ArrowRight size={22} /></span></section>

        <section className="poster-features">
          <div className="section-intro"><span>BUILT FOR REAL-WORLD CARE</span><h2>More than a software suite.<br /><strong>A better way to work.</strong></h2></div>
          <div className="feature-grid">{featureGroups.map(({ icon: Icon, title, items, accent }) => <article className="feature-group" key={title} style={{ '--group-accent': accent } as CSSProperties}><div className="feature-icon"><Icon size={19} /></div><h3>{title}</h3>{items.map(item => <p key={item}><Check size={14} /> {item}</p>)}</article>)}</div>
        </section>

        <section className="poster-quick-wins"><div className="quick-wins-heading"><span>THE JIOPLIX DIFFERENCE</span><h2>Small moments.<br /><strong>Remarkable momentum.</strong></h2></div><div className="quick-wins-grid">{quickWins.map(({ icon: Icon, label, detail }) => <div className="quick-win" key={label}><Icon size={20} /><div><b>{label}</b><span>{detail}</span></div></div>)}</div></section>

        <footer className="poster-footer"><div><div className="footer-brand"><img src="/logo.png" alt="Jioplix" /><span>Healthcare, in sync.</span></div><p>One connected platform for clinics, hospitals and diagnostic networks.</p><div className="footer-links"><span><Globe2 size={14} /> jioplix.com</span><span><Stethoscope size={14} /> Built for better care</span></div></div><div className="footer-action"><span>Ready to see your hospital in motion?</span><a href="https://wa.me/918825492600" target="_blank" rel="noreferrer">Book a private demo <ArrowRight size={17} /></a><small>Custom walkthrough · No obligation</small></div></footer>
      </div>
    </main>
  );
}
