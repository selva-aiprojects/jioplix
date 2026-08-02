import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo";
import { API_BASE_URL as API_BASE } from "../../config/api";
import { applyTheme, setNamespacedItem } from "../../config/theme";
import { Shield, Building2, Lock, Mail, Eye, EyeOff, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

const RESERVED_SUBDOMAINS = ['dev', 'staging', 'stage', 'test', 'www', 'api', 'app', 'mail', 'admin', 'support', 'help', 'docs', 'status', 'uat', 'qa'];

function getSubdomain(): string | null {
  const host = window.location.hostname;
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("::1")) return null;
  const parts = host.split(".");
  if (parts.length >= 3 && !parts[0].startsWith("www") && !RESERVED_SUBDOMAINS.includes(parts[0])) return parts[0];
  return null;
}

const LOGIN_CSS = `
  @keyframes orbFloat {
    0%, 100% { transform: translate(0px, 0px) scale(1); }
    50% { transform: translate(20px, -20px) scale(1.1); }
  }
  .login-input-box {
    transition: all 0.25s ease;
    border: 1.5px solid #cbd5e1;
  }
  .login-input-box:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    background: #ffffff !important;
  }
  .role-pill-btn {
    transition: all 0.2s ease;
  }
  .role-pill-btn:hover {
    transform: translateY(-1px);
  }
`;

export default function LoginPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<"nexus" | "tenant">("tenant");
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facility, setFacility] = useState("");
  const [domainFacility, setDomainFacility] = useState<string | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = LOGIN_CSS;
    document.head.appendChild(style);

    axios.get(`${API_BASE}/api/nexus/tenants/public`).then(res => {
      const list: any[] = res.data || [];
      setFacilities(list);
      const subdomain = getSubdomain();
      if (subdomain) {
        const matched = list.find(f => f.domain === subdomain);
        if (matched) {
          setFacility(matched.id);
          setDomainFacility(matched.id);
          setDomainName(matched.name);
          return;
        }
      }
      // Default to first facility if not set
      if (list.length > 0) {
        setFacility(list[0].id);
      }
    }).catch(err => {
      console.error("[AUTH] Error loading facilities:", err);
    });

    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => {
      document.head.removeChild(style);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const selectedFacility = facility || (facilities.length > 0 ? facilities[0].id : "");

    try {
      const landingPage = type === "nexus" ? "/nexus/dashboard" : "/tenant/dashboard";
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, {
        email: email.trim(),
        password,
        type,
        facility: selectedFacility,
        landingPage
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("tenant", data.tenantId);
      localStorage.setItem("tenantName", data.tenantName || "Jioplix Hospital");
      localStorage.setItem("tenantPlan", data.tenantPlan || "basic");
      localStorage.setItem("landingPage", data.landingPage);
      localStorage.setItem("userType", data.type);
      localStorage.setItem("role", data.role || "");
      localStorage.setItem("userName", data.userName || "User");
      localStorage.setItem("userId", data.userId || "");

      // Save dynamic RBAC data
      localStorage.setItem("userMenus", JSON.stringify(data.menus || []));
      localStorage.setItem("userPermissions", JSON.stringify(data.permissions || []));

      // Save branding configuration (namespaced per-tenant)
      if (data.uiSettings) {
        if (data.uiSettings.primaryDark) setNamespacedItem('theme_primary_dark', data.uiSettings.primaryDark);
        if (data.uiSettings.primaryAccent) setNamespacedItem('theme_primary_accent', data.uiSettings.primaryAccent);
        if (data.uiSettings.appBg) setNamespacedItem('theme_app_bg', data.uiSettings.appBg);
        if (data.uiSettings.textMain) setNamespacedItem('theme_text_main', data.uiSettings.textMain);
        if (data.uiSettings.fontSize) setNamespacedItem('theme_font_size', data.uiSettings.fontSize);
        if (data.uiSettings.logoUrl) setNamespacedItem('theme_logo_url', data.uiSettings.logoUrl);
        if (data.uiSettings.heroBg) setNamespacedItem('theme_hero_bg', data.uiSettings.heroBg);
        if (data.uiSettings.heroText) setNamespacedItem('theme_hero_text', data.uiSettings.heroText);
        if (data.uiSettings.sidebarText) setNamespacedItem('theme_sidebar_text', data.uiSettings.sidebarText);
      }

      applyTheme();
      navigate(data.landingPage);
    } catch (err: any) {
      console.error("[LOGIN_ERROR]", err);
      setError(err.response?.data?.error || "Login failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(37, 99, 235, 0.12) 0%, rgba(248, 250, 252, 1) 100%)',
      padding: '24px',
      boxSizing: 'border-box',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1080px',
        margin: '0 auto',
        minHeight: isMobile ? 'auto' : '640px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        background: '#ffffff',
        borderRadius: '32px',
        overflow: 'hidden',
        boxShadow: '0 32px 64px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(226, 232, 240, 0.8)',
      }}>

        {/* LEFT PANEL: Sleek Dark Glass & Floating Orbs */}
        {!isMobile && (
          <div style={{
            flex: 1.1,
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
            padding: '56px',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            color: 'white'
          }}>
            {/* Glowing Orb Effects */}
            <div style={{
              position: 'absolute', top: '-60px', left: '-60px', width: '260px', height: '260px',
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.4), transparent 70%)',
              filter: 'blur(30px)', animation: 'orbFloat 8s ease-in-out infinite'
            }} />
            <div style={{
              position: 'absolute', bottom: '-80px', right: '-80px', width: '300px', height: '300px',
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent 70%)',
              filter: 'blur(40px)', animation: 'orbFloat 10s ease-in-out infinite'
            }} />

            {/* Grid Pattern Overlay */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ marginBottom: '40px' }}>
                <BrandLogo size="lg" forcePlatformLogo />
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '20px' }}>
                <Sparkles size={14} color="#60a5fa" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd' }}>Jioplix AI Clinical Suite 2026</span>
              </div>

              <h1 style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1px', margin: '0 0 16px 0' }}>
                Precision Care &amp; Hospital Intelligence.
              </h1>

              <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, maxWidth: '380px', margin: 0 }}>
                Unified EMR, OPD Voice Dictation, Executive WhatsApp Automation &amp; Dynamic Hourly Bed Billing.
              </p>
            </div>

            {/* Status Badges */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', fontSize: '11px', fontWeight: 700 }}>
                  <CheckCircle size={13} /> ABDM Certified
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa', fontSize: '11px', fontWeight: 700 }}>
                  <Shield size={13} /> HIPAA &amp; FHIR R4
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                Powered by <strong style={{ color: '#38bdf8' }}>Cybelinx Technologies</strong>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT PANEL: Modern Authentication Form */}
        <div style={{
          flex: 1,
          padding: isMobile ? '32px 24px' : '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff'
        }}>
          {isMobile && (
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
              <BrandLogo size="md" forcePlatformLogo />
            </div>
          )}

          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
              Welcome Back
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Sign in to your clinical workspace
            </p>
          </div>

          {/* Workspace Type Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '4px', background: '#f1f5f9', borderRadius: '14px', marginBottom: '24px' }}>
            <button
              type="button"
              className="role-pill-btn"
              onClick={() => setType("tenant")}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                background: type === "tenant" ? '#ffffff' : 'transparent',
                color: type === "tenant" ? '#0f172a' : '#64748b',
                boxShadow: type === "tenant" ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <Building2 size={15} color={type === "tenant" ? '#2563eb' : '#64748b'} /> Hospital Facility
            </button>

            <button
              type="button"
              className="role-pill-btn"
              onClick={() => setType("nexus")}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                background: type === "nexus" ? '#ffffff' : 'transparent',
                color: type === "nexus" ? '#0f172a' : '#64748b',
                boxShadow: type === "nexus" ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <Shield size={15} color={type === "nexus" ? '#059669' : '#64748b'} /> Nexus Admin
            </button>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Hospital Facility Selector */}
            {type === "tenant" && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Hospital Facility *
                </label>

                {domainFacility && domainName ? (
                  <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #10b981', background: '#ecfdf5', fontWeight: 700, color: '#065f46', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} color="#10b981" />
                    <span>{domainName}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#047857', background: '#d1fae5', padding: '2px 8px', borderRadius: '6px' }}>Auto Domain</span>
                  </div>
                ) : (
                  <div className="login-input-box" style={{ borderRadius: '12px', background: '#f8fafc', overflow: 'hidden' }}>
                    <select
                      required
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', fontWeight: 600, fontSize: '14px', outline: 'none', color: '#0f172a' }}
                    >
                      <option value="">Select your facility...</option>
                      {facilities.map(f => (
                        <option key={f.id} value={f.id}>{f.name}{f.domain ? ` (${f.domain})` : ''}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email Address *
              </label>
              <div className="login-input-box" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: '12px', background: '#f8fafc' }}>
                <Mail size={18} color="#94a3b8" />
                <input
                  required
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 0', border: 'none', background: 'transparent', fontWeight: 600, fontSize: '14px', outline: 'none', color: '#0f172a' }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Password *
                </label>
              </div>
              <div className="login-input-box" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: '12px', background: '#f8fafc' }}>
                <Lock size={18} color="#94a3b8" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 0', border: 'none', background: 'transparent', fontWeight: 600, fontSize: '14px', outline: 'none', color: '#0f172a' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: '#b91c1c', fontSize: '13px', fontWeight: 600, padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(30, 64, 175, 0.3)',
                transition: 'all 0.2s ease',
                marginTop: '4px'
              }}
            >
              {loading ? (
                "Authenticating Session..."
              ) : (
                <>Sign In to Workspace <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
