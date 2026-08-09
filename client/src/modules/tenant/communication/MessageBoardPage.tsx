import { useState } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import {
  Megaphone,
  AlertTriangle,
  Bell,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Sparkles,
  Info,
  ShieldCheck,
  Pin
} from "lucide-react";

interface Notice {
  id: string;
  title: string;
  category: "Emergency" | "Clinical" | "Administrative" | "General";
  priority: "STAT Red" | "High Orange" | "Routine Blue";
  publisher: string;
  publishedAt: string;
  content: string;
  isPinned: boolean;
}

const SAMPLE_NOTICES: Notice[] = [
  {
    id: "n1",
    title: "🚨 MANDATORY HOSPITAL FIRE SAFETY DRILL (CODE RED)",
    category: "Emergency",
    priority: "STAT Red",
    publisher: "Facility Safety Officer (Dr. S. Ramesh)",
    publishedAt: "2026-08-09 09:00 AM",
    content: "All OPD & IPD floor ward incharges please note: Mock fire evacuation drill will commence at 03:00 PM today. Emergency elevators will operate on secondary generator power.",
    isPinned: true
  },
  {
    id: "n2",
    title: "Revised Antimicrobial Stewardship Guidelines (ABX Protocol 2026)",
    category: "Clinical",
    priority: "High Orange",
    publisher: "Clinical Excellence Committee",
    publishedAt: "2026-08-08 04:30 PM",
    content: "Restricted antibiotic usage policy updated for Carbapenems and Colistin in ICU settings. Dual approval from Infectious Disease specialist mandatory prior to POS dispensing.",
    isPinned: true
  },
  {
    id: "n3",
    title: "Scheduled HIMS Server Database Maintenance Window",
    category: "Administrative",
    priority: "Routine Blue",
    publisher: "Nexus IT Governance Team",
    publishedAt: "2026-08-07 11:00 AM",
    content: "Jioplix database maintenance scheduled on Aug 14 from 02:00 AM to 03:30 AM IST. Offline emergency prescription pads available at all ward desks.",
    isPinned: false
  }
];

export default function MessageBoardPage() {
  const [notices, setNotices] = useState<Notice[]>(SAMPLE_NOTICES);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [newNotice, setNewNotice] = useState({
    title: "",
    category: "Clinical",
    priority: "Routine Blue",
    content: "",
    isPinned: false
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredNotices = notices.filter(n => {
    if (selectedCategory !== "ALL" && n.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.publisher.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) return showToast("Please enter notice title and content.");

    const created: Notice = {
      id: `n${notices.length + 1}`,
      title: newNotice.title,
      category: newNotice.category as any,
      priority: newNotice.priority as any,
      publisher: "Hospital Administration Desk",
      publishedAt: new Date().toLocaleString(),
      content: newNotice.content,
      isPinned: newNotice.isPinned
    };

    setNotices([created, ...notices]);
    setShowAddModal(false);
    showToast("📢 Hospital notice broadcasted successfully!");
    setNewNotice({ title: "", category: "Clinical", priority: "Routine Blue", content: "", isPinned: false });
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Clinical &amp; Hospital Announcement Board" subtitle="Emergency Code Alerts, Clinical Practice Directives &amp; Departmental Notice Broadcasts" />

        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
            background: "#0f172a", color: "#ffffff", padding: "14px 22px", borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px",
            border: "1px solid rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: 700
          }}>
            <Sparkles size={18} color="#f59e0b" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HERO BANNER */}
        <div style={{
          background: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)",
          borderRadius: "28px", padding: "32px 36px", color: "white", marginBottom: "28px",
          position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(180, 83, 9, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
                <Megaphone size={14} color="#fde047" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#fef9c3", letterSpacing: "0.5px" }}>HOSPITAL-WIDE BROADCAST SYSTEM</span>
              </div>
              <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
                Internal Notice &amp; Announcement Center
              </h1>
              <p style={{ fontSize: "14px", color: "#fde047", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
                Publish clinical directives, emergency safety alerts, duty shift rosters, and hospital administrative updates.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "14px 24px", borderRadius: "16px", background: "#ffffff", color: "#78350f",
                border: "none", fontWeight: 900, fontSize: "14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
              }}
            >
              <Plus size={18} /> Publish New Notice
            </button>
          </div>
        </div>

        {/* CATEGORY BAR & SEARCH */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search announcements by title or content..."
              style={{ width: "100%", maxWidth: "400px", padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />

            <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
              {["ALL", "Emergency", "Clinical", "Administrative", "General"].map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px", border: `1.5px solid ${selectedCategory === c ? "#78350f" : "#e2e8f0"}`,
                    background: selectedCategory === c ? "#78350f" : "#ffffff", color: selectedCategory === c ? "#ffffff" : "#475569",
                    fontWeight: 800, fontSize: "12px", cursor: "pointer"
                  }}
                >
                  {c === "ALL" ? "All Categories" : c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NOTICES LIST */}
        <div style={{ display: "grid", gap: "20px" }}>
          {filteredNotices.map(notice => (
            <div
              key={notice.id}
              style={{
                background: "#ffffff",
                padding: "28px",
                borderRadius: "24px",
                border: `2px solid ${notice.category === "Emergency" ? "#fecaca" : "#e2e8f0"}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    padding: "4px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 900,
                    background: notice.category === "Emergency" ? "#fef2f2" : notice.category === "Clinical" ? "#f3e8ff" : "#eff6ff",
                    color: notice.category === "Emergency" ? "#dc2626" : notice.category === "Clinical" ? "#7e22ce" : "#1d4ed8",
                    border: `1px solid ${notice.category === "Emergency" ? "#fecaca" : notice.category === "Clinical" ? "#e9d5ff" : "#bfdbfe"}`
                  }}>
                    {notice.category.toUpperCase()}
                  </span>

                  {notice.isPinned && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800 }}>
                      <Pin size={12} /> Pinned Directive
                    </span>
                  )}
                </div>

                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {notice.publishedAt}
                </div>
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", margin: "0 0 10px 0", lineHeight: 1.4 }}>
                {notice.title}
              </h3>

              <p style={{ fontSize: "14px", color: "#334155", lineHeight: 1.7, margin: "0 0 16px 0" }}>
                {notice.content}
              </p>

              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                Published by: <strong style={{ color: "#0f172a" }}>{notice.publisher}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* PUBLISH NOTICE MODAL */}
        {showAddModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#ffffff", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "600px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 20px 0" }}>Publish Hospital Notice / Alert</h3>

              <form onSubmit={handlePublishNotice} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Notice Title *</label>
                  <input value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} required placeholder="e.g. Revised Shift Duty Hours for OT Staff" style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Category</label>
                    <select value={newNotice.category} onChange={e => setNewNotice({ ...newNotice, category: e.target.value as any })} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                      <option value="Emergency">Emergency Alert</option>
                      <option value="Clinical">Clinical Protocol</option>
                      <option value="Administrative">Administrative Update</option>
                      <option value="General">General Notice</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Pin to Top</label>
                    <select value={newNotice.isPinned ? "yes" : "no"} onChange={e => setNewNotice({ ...newNotice, isPinned: e.target.value === "yes" })} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                      <option value="no">Normal Stream</option>
                      <option value="yes">Pin to Top of Board</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Announcement Content *</label>
                  <textarea rows={5} value={newNotice.content} onChange={e => setNewNotice({ ...newNotice, content: e.target.value })} required placeholder="Enter full announcement details..." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", lineHeight: 1.6 }} />
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#78350f", color: "white", fontWeight: 900, cursor: "pointer" }}>Publish Notice</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
