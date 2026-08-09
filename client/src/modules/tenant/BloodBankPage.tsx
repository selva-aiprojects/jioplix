import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Droplet,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  FlaskConical,
  Heart,
  FileText,
  RefreshCw,
  Send,
  Zap,
  Layers,
  ChevronRight
} from "lucide-react";

interface BloodBag {
  id: string;
  bagNumber: string;
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
  component: "Whole Blood" | "PRBC" | "FFP" | "Platelets";
  volumeMl: number;
  collectionDate: string;
  expiryDate: string;
  donorName: string;
  status: "available" | "reserved" | "expiring_soon" | "quarantine";
  testingStatus: "tested_negative" | "pending";
}

interface Donor {
  id: string;
  donorId: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  lastDonated: string;
  eligibility: "eligible" | "deferred";
  totalDonations: number;
}

const SAMPLE_BAGS: BloodBag[] = [
  { id: "b1", bagNumber: "BB-2026-9041", bloodGroup: "O+", component: "PRBC", volumeMl: 350, collectionDate: "2026-08-01", expiryDate: "2026-09-12", donorName: "Karthik Subramanian", status: "available", testingStatus: "tested_negative" },
  { id: "b2", bagNumber: "BB-2026-9042", bloodGroup: "O+", component: "FFP", volumeMl: 200, collectionDate: "2026-08-02", expiryDate: "2026-11-02", donorName: "Karthik Subramanian", status: "available", testingStatus: "tested_negative" },
  { id: "b3", bagNumber: "BB-2026-8910", bloodGroup: "A+", component: "Whole Blood", volumeMl: 450, collectionDate: "2026-07-28", expiryDate: "2026-08-15", donorName: "Suresh Babu", status: "expiring_soon", testingStatus: "tested_negative" },
  { id: "b4", bagNumber: "BB-2026-9102", bloodGroup: "B+", component: "Platelets", volumeMl: 150, collectionDate: "2026-08-08", expiryDate: "2026-08-13", donorName: "Anitha Ramesh", status: "available", testingStatus: "tested_negative" },
  { id: "b5", bagNumber: "BB-2026-9105", bloodGroup: "AB+", component: "PRBC", volumeMl: 350, collectionDate: "2026-08-05", expiryDate: "2026-09-16", donorName: "Deepak Verma", status: "reserved", testingStatus: "tested_negative" },
  { id: "b6", bagNumber: "BB-2026-8840", bloodGroup: "O-", component: "PRBC", volumeMl: 350, collectionDate: "2026-08-03", expiryDate: "2026-09-14", donorName: "Meenakshi Sundaram", status: "available", testingStatus: "tested_negative" },
  { id: "b7", bagNumber: "BB-2026-8799", bloodGroup: "B-", component: "FFP", volumeMl: 200, collectionDate: "2026-07-25", expiryDate: "2026-10-25", donorName: "Venkatesh Rao", status: "available", testingStatus: "tested_negative" }
];

const SAMPLE_DONORS: Donor[] = [
  { id: "d1", donorId: "DNR-2026-104", name: "Karthik Subramanian", age: 32, gender: "Male", bloodGroup: "O+", phone: "+91 98410 12345", lastDonated: "2026-08-01", eligibility: "eligible", totalDonations: 4 },
  { id: "d2", donorId: "DNR-2026-105", name: "Suresh Babu", age: 41, gender: "Male", bloodGroup: "A+", phone: "+91 97100 88234", lastDonated: "2026-07-28", eligibility: "eligible", totalDonations: 2 },
  { id: "d3", donorId: "DNR-2026-106", name: "Anitha Ramesh", age: 28, gender: "Female", bloodGroup: "B+", phone: "+91 99402 33112", lastDonated: "2026-08-08", eligibility: "eligible", totalDonations: 1 },
  { id: "d4", donorId: "DNR-2026-107", name: "Meenakshi Sundaram", age: 36, gender: "Female", bloodGroup: "O-", phone: "+91 98840 77123", lastDonated: "2026-08-03", eligibility: "eligible", totalDonations: 6 }
];

export default function BloodBankPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "donors" | "issue" | "quarantine">("inventory");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [bags, setBags] = useState<BloodBag[]>(SAMPLE_BAGS);
  const [donors, setDonors] = useState<Donor[]>(SAMPLE_DONORS);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Donor Form State
  const [newDonor, setNewDonor] = useState({
    name: "",
    age: "",
    gender: "Male",
    bloodGroup: "O+",
    phone: "",
    weightKg: "",
    hemoglobin: "14.2"
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const bloodGroupCounts = {
    "O+": bags.filter(b => b.bloodGroup === "O+" && b.status !== "quarantine").length,
    "A+": bags.filter(b => b.bloodGroup === "A+" && b.status !== "quarantine").length,
    "B+": bags.filter(b => b.bloodGroup === "B+" && b.status !== "quarantine").length,
    "AB+": bags.filter(b => b.bloodGroup === "AB+" && b.status !== "quarantine").length,
    "O-": bags.filter(b => b.bloodGroup === "O-" && b.status !== "quarantine").length,
    "A-": bags.filter(b => b.bloodGroup === "A-" && b.status !== "quarantine").length,
    "B-": bags.filter(b => b.bloodGroup === "B-" && b.status !== "quarantine").length,
    "AB-": bags.filter(b => b.bloodGroup === "AB-" && b.status !== "quarantine").length
  };

  const filteredBags = bags.filter(b => {
    if (selectedGroup !== "ALL" && b.bloodGroup !== selectedGroup) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.bagNumber.toLowerCase().includes(q) || b.donorName.toLowerCase().includes(q) || b.component.toLowerCase().includes(q);
    }
    return true;
  });

  const handleRegisterDonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonor.name || !newDonor.phone) return showToast("Please fill in donor name and phone.");
    const created: Donor = {
      id: `d${donors.length + 1}`,
      donorId: `DNR-2026-${108 + donors.length}`,
      name: newDonor.name,
      age: parseInt(newDonor.age) || 30,
      gender: newDonor.gender,
      bloodGroup: newDonor.bloodGroup,
      phone: newDonor.phone,
      lastDonated: new Date().toISOString().split("T")[0],
      eligibility: "eligible",
      totalDonations: 1
    };
    setDonors([created, ...donors]);
    setShowAddDonorModal(false);
    showToast(`✅ Donor ${created.name} registered successfully (${created.donorId})!`);
  };

  const handleIssueBag = (bagId: string) => {
    setBags(bags.map(b => b.id === bagId ? { ...b, status: "reserved" } : b));
    showToast("✅ Blood bag reserved and cross-matched for issuing!");
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Blood Bank Management Suite" subtitle="Donor Registration, Blood Group Stock Grid, Cross-Matching & Issue Register" />

        {/* Toast Alert */}
        {toastMessage && (
          <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
            background: "#0f172a", color: "#ffffff", padding: "14px 22px", borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px",
            border: "1px solid rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: 700
          }}>
            <Droplet size={18} color="#ef4444" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HERO METRICS BANNER */}
        <div style={{
          background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 40%, #b91c1c 100%)",
          borderRadius: "28px", padding: "32px 36px", color: "white", marginBottom: "28px",
          position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(185, 28, 28, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
                <Droplet size={14} color="#fca5a5" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#fef2f2", letterSpacing: "0.5px" }}>NABH &amp; FDA COMPLIANT BLOOD HUB</span>
              </div>
              <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
                Central Blood Inventory &amp; Transfusion Control
              </h1>
              <p style={{ fontSize: "14px", color: "#fecaca", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
                Real-time tracking of blood units by ABO/Rh group, donor history logs, component separation, infectious screen testing, and cross-match issue records.
              </p>
            </div>

            <button
              onClick={() => setShowAddDonorModal(true)}
              style={{
                padding: "14px 24px", borderRadius: "16px", background: "#ffffff", color: "#991b1b",
                border: "none", fontWeight: 900, fontSize: "14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
              }}
            >
              <UserPlus size={18} /> Register New Donor
            </button>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "28px" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: "12px", color: "#fecaca", fontWeight: 700, marginBottom: "4px" }}>Total Blood Units</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff" }}>{bags.length} Units</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: "12px", color: "#fecaca", fontWeight: 700, marginBottom: "4px" }}>Registered Donors</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff" }}>{donors.length} Donors</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: "12px", color: "#fecaca", fontWeight: 700, marginBottom: "4px" }}>Expiring &lt; 7 Days</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#fef08a", display: "flex", alignItems: "center", gap: "6px" }}>
                {bags.filter(b => b.status === "expiring_soon").length} Units <AlertTriangle size={18} />
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: "12px", color: "#fecaca", fontWeight: 700, marginBottom: "4px" }}>Safety Screened</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#86efac", display: "flex", alignItems: "center", gap: "6px" }}>
                100% Negative <ShieldCheck size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* BLOOD GROUP QUICK FILTER CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          {Object.entries(bloodGroupCounts).map(([group, count]) => (
            <div
              key={group}
              onClick={() => setSelectedGroup(selectedGroup === group ? "ALL" : group)}
              style={{
                background: selectedGroup === group ? "#991b1b" : "#ffffff",
                color: selectedGroup === group ? "#ffffff" : "#0f172a",
                borderRadius: "18px",
                padding: "16px",
                textAlign: "center",
                cursor: "pointer",
                border: `2px solid ${selectedGroup === group ? "#991b1b" : "#e2e8f0"}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: 900, marginBottom: "4px" }}>{group}</div>
              <div style={{ fontSize: "12px", opacity: 0.8, fontWeight: 700 }}>{count} Units</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
          <button
            onClick={() => setActiveTab("inventory")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "inventory" ? "#991b1b" : "#ffffff", color: activeTab === "inventory" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "inventory" ? "0 4px 12px rgba(153, 27, 27, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Droplet size={16} /> Blood Units Stock Grid ({filteredBags.length})
          </button>

          <button
            onClick={() => setActiveTab("donors")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "donors" ? "#991b1b" : "#ffffff", color: activeTab === "donors" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "donors" ? "0 4px 12px rgba(153, 27, 27, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <UserPlus size={16} /> Registered Donors Directory ({donors.length})
          </button>

          <button
            onClick={() => setActiveTab("issue")}
            style={{
              padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              background: activeTab === "issue" ? "#991b1b" : "#ffffff", color: activeTab === "issue" ? "#ffffff" : "#64748b",
              boxShadow: activeTab === "issue" ? "0 4px 12px rgba(153, 27, 27, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <FlaskConical size={16} /> Cross-Matching &amp; Issue Log
          </button>
        </div>

        {/* TAB 1: INVENTORY GRID */}
        {activeTab === "inventory" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "400px" }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by Bag Barcode, Donor Name, Component..."
                  style={{ width: "100%", padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {selectedGroup !== "ALL" && (
                <button
                  onClick={() => setSelectedGroup("ALL")}
                  style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "8px 16px", borderRadius: "12px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  Clear Filter ({selectedGroup})
                </button>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px" }}>Bag Number / Barcode</th>
                    <th style={{ padding: "12px 16px" }}>Blood Group</th>
                    <th style={{ padding: "12px 16px" }}>Component</th>
                    <th style={{ padding: "12px 16px" }}>Volume</th>
                    <th style={{ padding: "12px 16px" }}>Donor Name</th>
                    <th style={{ padding: "12px 16px" }}>Expiry Date</th>
                    <th style={{ padding: "12px 16px" }}>Safety Testing</th>
                    <th style={{ padding: "12px 16px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBags.map(b => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{b.bagNumber}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, fontSize: "12px" }}>
                          {b.bloodGroup}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#334155" }}>{b.component}</td>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>{b.volumeMl} mL</td>
                      <td style={{ padding: "14px 16px", color: "#334155" }}>{b.donorName}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: b.status === "expiring_soon" ? "#dc2626" : "#64748b" }}>
                        {b.expiryDate}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                          <ShieldCheck size={12} /> Tested Negative
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <button
                          onClick={() => handleIssueBag(b.id)}
                          disabled={b.status === "reserved"}
                          style={{
                            padding: "6px 14px", borderRadius: "8px", border: "none",
                            background: b.status === "reserved" ? "#e2e8f0" : "#991b1b",
                            color: b.status === "reserved" ? "#94a3b8" : "#ffffff",
                            fontWeight: 800, fontSize: "12px", cursor: b.status === "reserved" ? "default" : "pointer"
                          }}
                        >
                          {b.status === "reserved" ? "Reserved" : "Reserve / Issue"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DONORS DIRECTORY */}
        {activeTab === "donors" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Registered Voluntary Donors</h3>
              <button
                onClick={() => setShowAddDonorModal(true)}
                style={{ padding: "10px 18px", background: "#991b1b", color: "white", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={16} /> Add Donor Record
              </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px" }}>Donor ID</th>
                  <th style={{ padding: "12px 16px" }}>Donor Name</th>
                  <th style={{ padding: "12px 16px" }}>Blood Group</th>
                  <th style={{ padding: "12px 16px" }}>Age / Gender</th>
                  <th style={{ padding: "12px 16px" }}>Contact Phone</th>
                  <th style={{ padding: "12px 16px" }}>Last Donation</th>
                  <th style={{ padding: "12px 16px" }}>Eligibility Status</th>
                </tr>
              </thead>
              <tbody>
                {donors.map(d => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{d.donorId}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#334155" }}>{d.name}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, fontSize: "12px" }}>
                        {d.bloodGroup}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{d.age} Yrs • {d.gender}</td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>{d.phone}</td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{d.lastDonated}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ color: "#166534", background: "#f0fdf4", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, border: "1px solid #bbf7d0" }}>
                        ✅ Eligible Donor
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: CROSS MATCHING & ISSUE LOG */}
        {activeTab === "issue" && (
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px 0", color: "#0f172a" }}>Pending Transfusion Cross-Match Queue</h3>
            
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>RECIPIENT: Ramesh Chandran (MRN-2026-4412) • Ward 304 (IPD)</div>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>Request: 2 Units PRBC (O Positive)</div>
                  <div style={{ fontSize: "12px", color: "#991b1b", marginTop: "2px", fontWeight: 700 }}>Indication: Acute GI Bleed / Hb 6.8 g/dL</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "6px 12px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                    Cross-Match Verified
                  </span>
                  <button onClick={() => showToast("✅ Issued 2 Units PRBC to Ward 304!")} style={{ padding: "10px 20px", background: "#991b1b", color: "white", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>
                    Dispatch Blood Bag
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD DONOR MODAL */}
        {showAddDonorModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#ffffff", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 20px 0" }}>Register Voluntary Blood Donor</h3>
              
              <form onSubmit={handleRegisterDonor} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Donor Full Name *</label>
                  <input value={newDonor.name} onChange={e => setNewDonor({ ...newDonor, name: e.target.value })} required placeholder="e.g. Ramesh Kumar" style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Blood Group</label>
                    <select value={newDonor.bloodGroup} onChange={e => setNewDonor({ ...newDonor, bloodGroup: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                      {["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Phone Number *</label>
                    <input value={newDonor.phone} onChange={e => setNewDonor({ ...newDonor, phone: e.target.value })} required placeholder="+91 98401..." style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Age (Yrs)</label>
                    <input type="number" value={newDonor.age} onChange={e => setNewDonor({ ...newDonor, age: e.target.value })} placeholder="30" style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Hemoglobin (g/dL)</label>
                    <input value={newDonor.hemoglobin} onChange={e => setNewDonor({ ...newDonor, hemoglobin: e.target.value })} placeholder="14.2" style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button type="button" onClick={() => setShowAddDonorModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#991b1b", color: "white", fontWeight: 800, cursor: "pointer" }}>Register Donor</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
