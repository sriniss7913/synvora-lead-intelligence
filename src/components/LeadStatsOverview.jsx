import React from "react";
import { Flame, Zap, ShieldCheck, Award, Target } from "lucide-react";

export default function LeadStatsOverview({ leads }) {
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.tier === "Hot lead" || l.score >= 80).length;
  const warmLeads = leads.filter(l => l.tier === "Warm lead" || (l.score >= 60 && l.score < 80)).length;
  const avgScore = totalLeads > 0 
    ? Math.round(leads.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalLeads) 
    : 0;
  const highAiOppCount = leads.filter(l => (l.scoreBreakdown?.digitalOpportunity?.score || 0) >= 17).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, margin: "20px auto 0 auto", maxWidth: 1400 }}>
      
      {/* Metric 1: Total Leads */}
      <div className="glass-panel" style={{ padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, background: "rgba(6, 182, 212, 0.15)", border: "1px solid rgba(6, 182, 212, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Target size={24} color="var(--accent-cyan)" />
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{totalLeads}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>Total Discovered Leads</div>
        </div>
      </div>

      {/* Metric 2: Hot Leads */}
      <div className="glass-panel" style={{ padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, background: "var(--tier-hot-bg)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Flame size={24} color="var(--tier-hot)" />
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--tier-hot)", lineHeight: 1.1 }}>{hotLeads}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>🔥 Hot Leads (80-100)</div>
        </div>
      </div>

      {/* Metric 3: Warm Leads */}
      <div className="glass-panel" style={{ padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, background: "var(--tier-warm-bg)", border: "1px solid rgba(245, 158, 11, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={24} color="var(--tier-warm)" />
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--tier-warm)", lineHeight: 1.1 }}>{warmLeads}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>⚡ Warm Leads (60-79)</div>
        </div>
      </div>

      {/* Metric 4: Average Score */}
      <div className="glass-panel" style={{ padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Award size={24} color="var(--accent-indigo)" />
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{avgScore} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>/ 100</span></div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>Average AI Lead Score</div>
        </div>
      </div>

      {/* Metric 5: High AI Opportunity */}
      <div className="glass-panel" style={{ padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={24} color="var(--accent-purple)" />
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-purple)", lineHeight: 1.1 }}>{highAiOppCount}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>High AI Automation Fit</div>
        </div>
      </div>

    </div>
  );
}
