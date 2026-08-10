import React from "react";
import { Sparkles, Sliders, Download, Clock, LayoutGrid, Table, Key } from "lucide-react";

export default function Navbar({
  activeView,
  setActiveView,
  settings,
  onOpenSettings,
  onExportCSV,
  totalLeadsCount,
  historyCount
}) {
  const hasRealData = !!(settings.apifyToken);

  return (
    <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: "10px 16px", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(6, 182, 212, 0.4)", flexShrink: 0 }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, background: "linear-gradient(90deg, #f8fafc 0%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2 }}>
              Synvora <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--accent-cyan)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Lead Intelligence</span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
              {hasRealData
                ? <span style={{ color: "#10b981", fontWeight: 600 }}>● Live Google Maps Data</span>
                : <span style={{ color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Key size={10} /> Add API Key for Real Leads</span>
              }
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div style={{ display: "flex", alignItems: "center", background: "var(--bg-input)", padding: 3, borderRadius: 8, border: "1px solid var(--border-light)", gap: 2 }}>
          {[
            { key: "table", icon: <Table size={13} />, label: "List" },
            { key: "kanban", icon: <LayoutGrid size={13} />, label: "Kanban" },
            { key: "history", icon: <Clock size={13} />, label: "History", badge: historyCount || 0 }
          ].map(({ key, icon, label, badge }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className="btn-secondary"
              style={{
                padding: "5px 10px",
                fontSize: "0.78rem",
                background: activeView === key ? "var(--accent-cyan-glow)" : "transparent",
                color: activeView === key ? "var(--accent-cyan)" : "var(--text-muted)",
                border: activeView === key ? "1px solid rgba(6, 182, 212, 0.3)" : "none",
                display: "flex", alignItems: "center", gap: 4, position: "relative"
              }}
            >
              {icon} {label}
              {badge > 0 && (
                <span style={{
                  background: "var(--accent-indigo)",
                  color: "#fff",
                  fontSize: "0.6rem",
                  borderRadius: 10,
                  padding: "0 4px",
                  minWidth: 16,
                  textAlign: "center",
                  fontWeight: 700
                }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            style={{ padding: "5px 10px", fontSize: "0.78rem", color: hasRealData ? "var(--text-muted)" : "#f59e0b", border: !hasRealData ? "1px solid rgba(245,158,11,0.4)" : undefined }}
            title="Configure Apify & Hunter.io API Keys"
          >
            <Sliders size={14} /> {hasRealData ? "Settings" : "⚙️ Add API Keys"}
          </button>

          {activeView !== "history" && (
            <button onClick={onExportCSV} className="btn-secondary" style={{ padding: "5px 10px", fontSize: "0.78rem" }} title="Export leads to CSV">
              <Download size={14} /> Export ({totalLeadsCount})
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
