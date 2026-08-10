import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  accent?: string;
  badge?: ReactNode;
  variant?: "solid" | "translucent";
  className?: string;
  style?: CSSProperties;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  accent,
  badge,
  variant = "solid",
  className,
  style
}: MetricCardProps) {
  const tint = accent || "#0284c7";
  const translucent = variant === "translucent";
  return (
    <div
      className={`metric-card ${translucent ? "metric-card-translucent " : ""}${className || ""}`}
      style={{
        background: translucent
          ? "rgba(255,255,255,0.1)"
          : "linear-gradient(160deg, rgba(255,255,255,0.94) 0%, rgba(240,249,255,0.72) 100%)",
        backdropFilter: "blur(14px) saturate(180%)",
        WebkitBackdropFilter: "blur(14px) saturate(180%)",
        border: translucent ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.75)",
        boxShadow: translucent
          ? "inset 0 1px 0 rgba(255,255,255,0.2)"
          : "0 10px 28px -14px rgba(2,132,199,0.22), inset 0 1px 0 rgba(255,255,255,0.95)",
        padding: "18px 20px",
        borderRadius: "18px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        position: "relative",
        overflow: "hidden",
        minHeight: "96px",
        ...style
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -34,
          right: -34,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tint}20 0%, transparent 70%)`,
          pointerEvents: "none"
        }}
      />
      {Icon && (
        <div
          style={{
            flexShrink: 0,
            width: 52,
            height: 52,
            borderRadius: "16px",
            background: iconBg || (translucent ? "rgba(255,255,255,0.15)" : `${tint}14`),
            color: iconColor || (translucent ? "#e0f2fe" : tint),
            display: "grid",
            placeItems: "center",
            boxShadow: translucent
              ? "inset 0 1px 0 rgba(255,255,255,0.25)"
              : "inset 0 1px 0 rgba(255,255,255,0.85)"
          }}
        >
          <Icon size={24} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: translucent ? "#e2e8f0" : "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            {label}
          </span>
          {badge}
        </div>
        <div style={{ fontSize: "26px", fontWeight: 900, color: accent || (translucent ? "#ffffff" : "#0f172a"), lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: "4px" }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: "12px", color: translucent ? "#cbd5e1" : "#94a3b8", fontWeight: 600, marginTop: "4px" }}>{sub}</div>}
      </div>
    </div>
  );
}

export interface MetricsGridProps {
  children: ReactNode;
  minWidth?: string;
  style?: CSSProperties;
}

export function MetricsGrid({ children, minWidth = "220px", style }: MetricsGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
        gap: "16px",
        marginBottom: "24px",
        ...style
      }}
    >
      {children}
    </div>
  );
}
