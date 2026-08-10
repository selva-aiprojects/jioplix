import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Inbox, AlertTriangle, CheckCircle2, Timer } from "lucide-react";
import { hd } from "./api";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  PENDING_CUSTOMER: "#8b5cf6",
  ESCALATED: "#ef4444",
  RESOLVED: "#10b981",
  CLOSED: "#64748b",
};

export default function HelpdeskDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await hd.analytics();
      setData(res);
    } catch (err) {
      console.error("Helpdesk analytics failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60000);
    return () => clearInterval(iv);
  }, []);

  if (loading && !data) {
    return <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Loading helpdesk analytics...</div>;
  }

  const kpi = data?.kpi || {};
  const byPriority = data?.byPriority || [];
  const byStatus = data?.byStatus || [];
  const deptBacklog = data?.deptBacklog || [];
  const trend = data?.trend || [];
  const byCategory = data?.byCategory || [];

  const priorityData = byPriority.map((p: any) => ({ name: p.priority, value: p.count }));
  const priorityOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: "pie",
      radius: ["48%", "72%"],
      center: ["50%", "45%"],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontWeight: 800, fontSize: 14 } },
      data: priorityData,
      color: ["#22c55e", "#eab308", "#f97316", "#ef4444"],
    }],
  };

  const trendOption = {
    tooltip: { trigger: "axis" },
    grid: { left: 36, right: 16, top: 24, bottom: 28 },
    xAxis: { type: "category", data: trend.map((t: any) => String(t.day).slice(5)) },
    yAxis: { type: "value", minInterval: 1 },
    series: [{
      type: "line", smooth: true, data: trend.map((t: any) => t.count),
      areaStyle: { opacity: 0.15 }, lineStyle: { width: 3, color: "#0ea5e9" },
      itemStyle: { color: "#0ea5e9" },
    }],
  };

  const card: React.CSSProperties = {
    background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "20px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <MetricsGrid minWidth="180px">
        <MetricCard
          icon={Inbox}
          label="Open Tickets"
          value={kpi.open_tickets ?? 0}
          sub={`of ${kpi.total_tickets ?? 0} total`}
          iconBg="#eff6ff"
          iconColor="#3b82f6"
          accent="#3b82f6"
        />
        <MetricCard
          icon={AlertTriangle}
          label="SLA Breached"
          value={kpi.breached ?? 0}
          sub="overdue right now"
          iconBg="#fef2f2"
          iconColor="#ef4444"
          accent="#dc2626"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Resolved"
          value={kpi.resolved ?? 0}
          sub={`${kpi.avg_resolution_hours ?? "-"}h avg resolution`}
          iconBg="#f0fdf4"
          iconColor="#10b981"
          accent="#059669"
        />
        <MetricCard
          icon={Timer}
          label="Avg First Response"
          value={kpi.avg_first_response_min ?? "-"}
          sub="minutes"
          iconBg="#faf5ff"
          iconColor="#8b5cf6"
          accent="#7c3aed"
        />
      </MetricsGrid>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={card}>
          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Ticket Priority Mix</h4>
          <div style={{ height: 260 }}>
            <ReactECharts option={priorityOption} style={{ height: 260 }} notMerge />
          </div>
        </div>
        <div style={card}>
          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Ticket Volume (30 days)</h4>
          <div style={{ height: 260 }}>
            <ReactECharts option={trendOption} style={{ height: 260 }} notMerge />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={card}>
          <h4 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Status Overview</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {byStatus.length === 0 && <p style={{ color: "#94a3b8", margin: 0 }}>No tickets yet.</p>}
            {byStatus.map((s: any) => {
              const total = byStatus.reduce((a: number, b: any) => a + b.count, 0) || 1;
              const pct = Math.round((s.count / total) * 100);
              return (
                <div key={s.status}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    <span>{s.status.replace(/_/g, " ")}</span><span>{s.count}</span>
                  </div>
                  <div style={{ height: 8, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: STATUS_COLORS[s.status] || "#94a3b8", borderRadius: 6 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={card}>
          <h4 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Department Backlog</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {deptBacklog.length === 0 && <p style={{ color: "#94a3b8", margin: 0 }}>No active departmental backlogs.</p>}
            {deptBacklog.map((d: any, i: number) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  <span>{d.department || "Unassigned"}</span><span>{d.backlog} open</span>
                </div>
                <div style={{ height: 8, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (d.backlog / (deptBacklog[0]?.backlog || 1)) * 100)}%`, background: "#0ea5e9", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div style={card}>
          <h4 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Top Categories</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {byCategory.map((c: any, i: number) => (
              <span key={i} style={{ background: "#f1f5f9", padding: "8px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                {c.category || "Uncategorized"} · <span style={{ color: "#0f172a" }}>{c.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
