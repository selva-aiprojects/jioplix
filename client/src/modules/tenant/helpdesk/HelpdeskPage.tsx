import { useState } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import HelpdeskDashboard from "./HelpdeskDashboard";
import TicketList from "./TicketList";
import TicketDetail from "./TicketDetail";
import EquipmentRegister from "./EquipmentRegister";
import NewTicketModal from "./NewTicketModal";

type Tab = "dashboard" | "tickets" | "equipment";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tickets", label: "Tickets" },
  { id: "equipment", label: "Equipment" },
];

export default function HelpdeskPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const openTab = (t: Tab) => {
    setTab(t);
    setSelectedId(null);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Helpdesk" />

        <div style={{ maxWidth: 1200 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Internal Helpdesk</h2>
              <p style={{ color: "#64748b", marginTop: "4px" }}>Ticketing, SLA enforcement, escalations and equipment registry</p>
            </div>
            <button onClick={() => setShowNew(true)} style={{ padding: "12px 24px", borderRadius: "14px", background: "#0f172a", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>
              + Raise New Ticket
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => openTab(t.id)}
                style={{ padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "14px",
                  background: tab === t.id && !selectedId ? "#0f172a" : "transparent", color: tab === t.id && !selectedId ? "#fff" : "#64748b" }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "dashboard" && <HelpdeskDashboard />}
          {tab === "tickets" && !selectedId && <TicketList onOpen={setSelectedId} />}
          {tab === "tickets" && selectedId && <TicketDetail ticketId={selectedId} onBack={() => setSelectedId(null)} />}
          {tab === "equipment" && <EquipmentRegister />}
        </div>
      </main>

      {showNew && <NewTicketModal onClose={() => setShowNew(false)} onCreated={() => { setTab("tickets"); setSelectedId(null); }} />}
    </div>
  );
}
