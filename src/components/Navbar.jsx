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
    <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: "12px 24px", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        
        {/* Brand logo & tagline */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(6, 182, 212, 0.4)" }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, background: "linear-gradient(90deg, #f8fafc 0%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Synvora <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--accent-cyan)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Lead Intelligence</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>AI Lead Engine & Pipeline</span>
              <span style={{ color: "var(--text-dim)" }}>•</span>
              <span className="badge badge-purple" style={{ padding: "2px 8px", fontSize: "0.65rem" }}>
                <Cpu size={10} /> {providerInfo.name}
              </span>
            </div>
          </div>
        </div>

        {/* View switcher (Table vs Kanban) */}
        <div style={{ display: "flex", alignItems: "center", background: "var(--bg-input)", padding: 4, borderRadius: 8, border: "1px solid var(--border-light)" }}>
          <button
            onClick={() => setActiveView("table")}
            className="btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              background: activeView === "table" ? "var(--accent-cyan-glow)" : "transparent",
              color: activeView === "table" ? "var(--accent-cyan)" : "var(--text-muted)",
              border: activeView === "table" ? "1px solid rgba(6, 182, 212, 0.3)" : "none"
            }}
          >
            <Table size={14} /> Leads List
          </button>
          <button
            onClick={() => setActiveView("kanban")}
            className="btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              background: activeView === "kanban" ? "var(--accent-cyan-glow)" : "transparent",
              color: activeView === "kanban" ? "var(--accent-cyan)" : "var(--text-muted)",
              border: activeView === "kanban" ? "1px solid rgba(6, 182, 212, 0.3)" : "none"
            }}
          >
            <LayoutGrid size={14} /> Pipeline Board
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onOpenSettings} className="btn-secondary" title="Configure AI Provider & API Keys">
            <Sliders size={15} /> AI Engine Settings
          </button>

          <button onClick={onExportCSV} className="btn-secondary" title="Export lead pipeline to CSV">
            <Download size={15} /> Export CSV ({totalLeadsCount})
          </button>

          <button onClick={onResetData} className="btn-secondary" style={{ color: "var(--tier-hot)" }} title="Reset to initial sample leads">
            <RotateCcw size={15} />
          </button>
        </div>

      </div>
    </nav>
  );
}
