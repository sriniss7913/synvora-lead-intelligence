import React from "react";
import { Sparkles, Sliders, Download, RotateCcw, Cpu, LayoutGrid, Table } from "lucide-react";
import { AI_PROVIDERS } from "../services/aiProviderService";

export default function Navbar({
  activeView,
  setActiveView,
  settings,
  onOpenSettings,
  onResetData,
  onExportCSV,
  totalLeadsCount
}) {
  const providerInfo = AI_PROVIDERS[settings.providerId?.toUpperCase()] || AI_PROVIDERS.HEURISTIC;

  return (
    <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: "10px 16px", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        
        {/* Brand logo & tagline */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(6, 182, 212, 0.4)", flexShrink: 0 }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, background: "linear-gradient(90deg, #f8fafc 0%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2 }}>
              Synvora <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--accent-cyan)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Lead Intelligence</span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <span>AI Lead Engine</span>
              <span style={{ color: "var(--text-dim)" }}>•</span>
              <span className="badge badge-purple" style={{ padding: "1px 6px", fontSize: "0.6rem" }}>
                <Cpu size={9} /> {providerInfo.name.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>

        {/* View switcher (Table vs Kanban) */}
        <div style={{ display: "flex", alignItems: "center", background: "var(--bg-input)", padding: 3, borderRadius: 8, border: "1px solid var(--border-light)" }}>
          <button
            onClick={() => setActiveView("table")}
            className="btn-secondary"
            style={{
              padding: "5px 10px",
              fontSize: "0.78rem",
              background: activeView === "table" ? "var(--accent-cyan-glow)" : "transparent",
              color: activeView === "table" ? "var(--accent-cyan)" : "var(--text-muted)",
              border: activeView === "table" ? "1px solid rgba(6, 182, 212, 0.3)" : "none"
            }}
          >
            <Table size={13} /> List
          </button>
          <button
            onClick={() => setActiveView("kanban")}
            className="btn-secondary"
            style={{
              padding: "5px 10px",
              fontSize: "0.78rem",
              background: activeView === "kanban" ? "var(--accent-cyan-glow)" : "transparent",
              color: activeView === "kanban" ? "var(--accent-cyan)" : "var(--text-muted)",
              border: activeView === "kanban" ? "1px solid rgba(6, 182, 212, 0.3)" : "none"
            }}
          >
            <LayoutGrid size={13} /> Kanban
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button onClick={onOpenSettings} className="btn-secondary" style={{ padding: "5px 10px", fontSize: "0.78rem" }} title="Configure AI Provider & API Keys">
            <Sliders size={14} /> AI Settings
          </button>

          <button onClick={onExportCSV} className="btn-secondary" style={{ padding: "5px 10px", fontSize: "0.78rem" }} title="Export lead pipeline to CSV">
            <Download size={14} /> Export ({totalLeadsCount})
          </button>

          <button onClick={onResetData} className="btn-secondary" style={{ padding: "5px 8px", color: "var(--tier-hot)" }} title="Reset to initial sample leads">
            <RotateCcw size={14} />
          </button>
        </div>

      </div>
    </nav>
  );
}
