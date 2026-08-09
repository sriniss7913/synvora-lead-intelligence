import React from "react";
import { X, Award, CheckCircle, ShieldAlert, Sparkles, HelpCircle } from "lucide-react";

export default function ScoreBreakdownModal({ company, onClose, onOpenOutreach }) {
  if (!company) return null;

  const bd = company.scoreBreakdown || {};
  const total = company.score || 0;

  const factors = [
    { key: "businessFit", name: "Strong Business Fit", score: bd.businessFit?.score || 0, max: 25, reason: bd.businessFit?.reason },
    { key: "likelyPainPoint", name: "Likely Pain Point", score: bd.likelyPainPoint?.score || 0, max: 25, reason: bd.likelyPainPoint?.reason },
    { key: "digitalOpportunity", name: "Digital / AI Opportunity", score: bd.digitalOpportunity?.score || 0, max: 20, reason: bd.digitalOpportunity?.reason },
    { key: "companySize", name: "Company Size (20-200)", score: bd.companySize?.score || 0, max: 10, reason: bd.companySize?.reason },
    { key: "decisionMakerIdentified", name: "Decision-Maker Identified", score: bd.decisionMakerIdentified?.score || 0, max: 10, reason: bd.decisionMakerIdentified?.reason },
    { key: "recentTrigger", name: "Recent Business Trigger", score: bd.recentTrigger?.score || 0, max: 10, reason: bd.recentTrigger?.reason }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{ width: 680, maxWidth: "92%", padding: 28, position: "relative", border: "1px solid var(--border-glow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", right: 20, top: 20, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--accent-cyan-glow)", border: "1px solid rgba(6, 182, 212, 0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
              AI Lead Score Matrix Analysis
            </h2>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {company.companyName} ({company.industry})
            </div>
          </div>
        </div>

        {/* Overall Score Banner */}
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: total >= 80 ? "var(--tier-hot-bg)" : total >= 60 ? "var(--tier-warm-bg)" : "var(--tier-nurture-bg)",
            border: `1px solid ${total >= 80 ? 'rgba(239, 68, 68, 0.4)' : total >= 60 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700 }}>
              Lead Classification Tier
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: total >= 80 ? "var(--tier-hot)" : total >= 60 ? "var(--tier-warm)" : "var(--tier-nurture)", marginTop: 2 }}>
              {company.tier} ({total} / 100 PTS)
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenOutreach(company);
            }}
            className="btn-primary"
            style={{ padding: "8px 16px" }}
          >
            <Sparkles size={16} /> Prepare Outreach
          </button>
        </div>

        {/* Core Question Highlight */}
        <div style={{ background: "rgba(15, 23, 42, 0.8)", padding: 14, borderRadius: 8, borderLeft: "4px solid var(--accent-cyan)", marginBottom: 20 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <HelpCircle size={14} /> Core Insight: Why should Synvora contact this company?
          </div>
          <div style={{ fontSize: "0.88rem", color: "var(--text-main)", marginTop: 4, lineHeight: 1.4 }}>
            {company.whyContactReason}
          </div>
        </div>

        {/* Factor Breakdown Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {factors.map((f) => {
            const pct = Math.round((f.score / f.max) * 100);
            return (
              <div key={f.key} style={{ background: "rgba(30, 41, 59, 0.5)", padding: 12, borderRadius: 8, border: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fff" }}>
                    {f.name}
                  </span>
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                    {f.score} / {f.max} pts
                  </span>
                </div>

                {/* Progress Meter Bar */}
                <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: pct >= 80 ? "linear-gradient(90deg, #06b6d4, #10b981)" : pct >= 50 ? "linear-gradient(90deg, #f59e0b, #06b6d4)" : "#64748b",
                      borderRadius: 3,
                      transition: "width 0.3s ease"
                    }}
                  />
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                  {f.reason || "Score calculated from company signals."}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
