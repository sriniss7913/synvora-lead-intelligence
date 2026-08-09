import React from "react";
import { Award, Mail, Eye, MapPin, Building2 } from "lucide-react";

export default function PipelineKanban({
  leads,
  onOpenScoreModal,
  onOpenOutreach,
  onSelectLead,
  onUpdateLeadStatus
}) {
  const STAGES = [
    { id: "Discovered", title: "Discovered", color: "#64748b" },
    { id: "Scored", title: "Scored & Qualified", color: "#06b6d4" },
    { id: "Outreach Prepared", title: "Outreach Prepared", color: "#6366f1" },
    { id: "Sent", title: "Outreach Sent", color: "#f59e0b" },
    { id: "Interested", title: "Interested / Replied", color: "#a855f7" },
    { id: "Meeting Scheduled", title: "Meeting Scheduled", color: "#10b981" }
  ];

  const getLeadsByStage = (stageId) => {
    return leads.filter(l => (l.status || "Discovered") === stageId);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "20px auto 40px auto", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 16, minWidth: 1200, paddingBottom: 20 }}>
        {STAGES.map(stage => {
          const stageLeads = getLeadsByStage(stage.id);
          return (
            <div
              key={stage.id}
              className="glass-panel"
              style={{
                flex: 1,
                minWidth: 240,
                background: "rgba(15, 23, 42, 0.7)",
                padding: 16,
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Stage Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${stage.color}` }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>
                  {stage.title}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: "rgba(255, 255, 255, 0.1)",
                    color: stage.color,
                    padding: "2px 8px",
                    borderRadius: 12
                  }}
                >
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", maxHeight: "65vh" }}>
                {stageLeads.length === 0 ? (
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", textAlign: "center", padding: "20px 0" }}>
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map(company => (
                    <div
                      key={company.id}
                      style={{
                        background: "rgba(30, 41, 59, 0.7)",
                        border: "1px solid var(--border-light)",
                        borderRadius: 8,
                        padding: 12,
                        transition: "all 0.2s ease",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-cyan)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-light)"}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>
                          {company.companyName}
                        </div>
                        <span className={`badge ${company.tierBadgeClass}`} style={{ fontSize: "0.6rem", padding: "1px 5px" }}>
                          {company.score}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <Building2 size={11} color="var(--accent-cyan)" /> {company.industry} • {company.location}
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "var(--text-main)", marginBottom: 10 }}>
                        👤 {company.decisionMaker?.name || "Decision Maker"}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border-light)" }}>
                        <select
                          className="glass-input"
                          style={{ padding: "2px 4px", fontSize: "0.7rem", height: 24, background: "#0f172a" }}
                          value={company.status || "Discovered"}
                          onChange={(e) => onUpdateLeadStatus(company.id, e.target.value)}
                        >
                          {STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>

                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => onOpenOutreach(company)}
                            className="btn-secondary"
                            style={{ padding: "3px 6px" }}
                            title="Personalized Outreach"
                          >
                            <Mail size={12} color="var(--accent-cyan)" />
                          </button>
                          <button
                            onClick={() => onSelectLead(company)}
                            className="btn-secondary"
                            style={{ padding: "3px 6px" }}
                            title="View Details"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
