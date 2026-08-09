import React, { useState } from "react";
import { Eye, Mail, Award, MapPin, Building2, User, Phone, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";

export default function LeadTable({
  leads = [],
  onSelectLead,
  onOpenScoreModal,
  onOpenOutreach
}) {
  const [filterTier, setFilterTier] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedText, setCopiedText] = useState(null);

  const safeLeads = Array.isArray(leads) ? leads : [];

  const handleCopyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredLeads = safeLeads.filter(l => {
    if (!l) return false;
    const matchesTier = filterTier === "ALL" || (
      filterTier === "HOT" && (l.tier === "Hot lead" || l.score >= 80)
    ) || (
      filterTier === "WARM" && (l.tier === "Warm lead" || (l.score >= 60 && l.score < 80))
    ) || (
      filterTier === "NURTURE" && (l.tier === "Nurture" || (l.score >= 40 && l.score < 60))
    );

    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      l.companyName?.toLowerCase().includes(term) ||
      l.industry?.toLowerCase().includes(term) ||
      l.location?.toLowerCase().includes(term) ||
      l.address?.toLowerCase().includes(term) ||
      l.decisionMaker?.name?.toLowerCase().includes(term) ||
      l.decisionMaker?.email?.toLowerCase().includes(term) ||
      l.decisionMaker?.phone?.toLowerCase().includes(term)
    );

    return matchesTier && matchesSearch;
  });

  return (
    <div className="glass-panel" style={{ margin: "20px auto 40px auto", maxWidth: 1450, overflow: "hidden" }}>
      
      {/* Table Action Bar */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
            Discovered Company Intelligence ({filteredLeads.length})
          </h3>
        </div>

        {/* Tier Filter Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterTier("ALL")}
            className="btn-secondary"
            style={{ padding: "4px 12px", fontSize: "0.75rem", background: filterTier === "ALL" ? "rgba(255, 255, 255, 0.15)" : "transparent" }}
          >
            All ({leads.length})
          </button>
          <button
            onClick={() => setFilterTier("HOT")}
            className="btn-secondary"
            style={{ padding: "4px 12px", fontSize: "0.75rem", color: "var(--tier-hot)", borderColor: filterTier === "HOT" ? "rgba(239, 68, 68, 0.5)" : "var(--border-light)" }}
          >
            🔥 Hot ({leads.filter(l => l.score >= 80).length})
          </button>
          <button
            onClick={() => setFilterTier("WARM")}
            className="btn-secondary"
            style={{ padding: "4px 12px", fontSize: "0.75rem", color: "var(--tier-warm)", borderColor: filterTier === "WARM" ? "rgba(245, 158, 11, 0.5)" : "var(--border-light)" }}
          >
            ⚡ Warm ({leads.filter(l => l.score >= 60 && l.score < 80).length})
          </button>
          <button
            onClick={() => setFilterTier("NURTURE")}
            className="btn-secondary"
            style={{ padding: "4px 12px", fontSize: "0.75rem", color: "var(--tier-nurture)", borderColor: filterTier === "NURTURE" ? "rgba(16, 185, 129, 0.5)" : "var(--border-light)" }}
          >
            🌱 Nurture ({leads.filter(l => l.score >= 40 && l.score < 60).length})
          </button>

          <input
            type="text"
            className="glass-input"
            style={{ padding: "4px 10px", fontSize: "0.8rem", width: 180, height: 30, marginLeft: 10 }}
            placeholder="Search name, email, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "14px 16px" }}>Company & Industry</th>
              <th style={{ padding: "14px 16px" }}>Physical Address</th>
              <th style={{ padding: "14px 16px" }}>Contact Email</th>
              <th style={{ padding: "14px 16px" }}>Phone Number</th>
              <th style={{ padding: "14px 16px" }}>Decision Maker</th>
              <th style={{ padding: "14px 16px", textAlign: "center" }}>AI Lead Score</th>
              <th style={{ padding: "14px 16px", textAlign: "center" }}>Status</th>
              <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                  No companies found matching current criteria. Enter a target query in the search bar above to discover leads!
                </td>
              </tr>
            ) : (
              filteredLeads.map((company) => {
                const isApproved = company.outreachApprovedStatus === "Approved";
                const dmEmail = company.decisionMaker?.email || company.companyEmail || "N/A";
                const dmPhone = company.decisionMaker?.phone || "N/A";
                const fullAddress = company.address || company.location || "N/A";

                return (
                  <tr
                    key={company.id}
                    style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Company & Industry */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.92rem" }}>
                        {company.companyName}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Building2 size={12} color="var(--accent-cyan)" />
                        {company.industry} ({company.companySize || "SME"})
                      </div>
                    </td>

                    {/* Physical Address */}
                    <td style={{ padding: "14px 16px", maxWidth: 220 }}>
                      <div style={{ color: "var(--text-main)", fontSize: "0.8rem", display: "flex", alignItems: "flex-start", gap: 4, lineHeight: 1.35 }}>
                        <MapPin size={13} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span title={fullAddress}>{fullAddress}</span>
                      </div>
                    </td>

                    {/* Contact Email */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} color="var(--accent-indigo)" />
                        <a href={`mailto:${dmEmail}`} style={{ color: "var(--accent-cyan)", fontSize: "0.82rem", textDecoration: "none" }}>
                          {dmEmail}
                        </a>
                        <button
                          onClick={() => handleCopyText(dmEmail, `email-${company.id}`)}
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
                          title="Copy Email"
                        >
                          {copiedText === `email-${company.id}` ? <Check size={12} color="var(--tier-nurture)" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Phone size={13} color="var(--tier-nurture)" />
                        <a href={`tel:${dmPhone}`} style={{ color: "var(--text-main)", fontSize: "0.82rem", textDecoration: "none" }}>
                          {dmPhone}
                        </a>
                        <button
                          onClick={() => handleCopyText(dmPhone, `phone-${company.id}`)}
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
                          title="Copy Phone"
                        >
                          {copiedText === `phone-${company.id}` ? <Check size={12} color="var(--tier-nurture)" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Decision Maker */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <User size={13} color="var(--accent-indigo)" />
                        {company.decisionMaker?.name || "N/A"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                        {company.decisionMaker?.title || "Executive Lead"}
                      </div>
                    </td>

                    {/* AI Lead Score */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div
                        onClick={() => onOpenScoreModal(company)}
                        className="score-pill"
                        style={{
                          cursor: "pointer",
                          background: company.score >= 80 ? "var(--tier-hot-bg)" : company.score >= 60 ? "var(--tier-warm-bg)" : "var(--tier-nurture-bg)",
                          color: company.score >= 80 ? "var(--tier-hot)" : company.score >= 60 ? "var(--tier-warm)" : "var(--tier-nurture)",
                          border: `1px solid ${company.score >= 80 ? 'rgba(239, 68, 68, 0.4)' : company.score >= 60 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                        }}
                        title="Click to view 6-Factor AI Score Breakdown"
                      >
                        {company.score} / 100
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <span className={`badge ${company.tierBadgeClass}`} style={{ fontSize: "0.62rem", padding: "2px 6px" }}>
                          {company.tier}
                        </span>
                      </div>
                    </td>

                    {/* Outreach Status */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      {isApproved ? (
                        <span style={{ fontSize: "0.75rem", color: "var(--tier-nurture)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Approved
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--tier-warm)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> Review Needed
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <button
                          onClick={() => onOpenScoreModal(company)}
                          className="btn-secondary"
                          style={{ padding: "5px 8px" }}
                          title="Score Breakdown"
                        >
                          <Award size={14} color="var(--accent-cyan)" />
                        </button>
                        
                        <button
                          onClick={() => onOpenOutreach(company)}
                          className="btn-primary"
                          style={{ padding: "5px 10px", fontSize: "0.78rem" }}
                          title="Prepare & Approve Outreach Copy"
                        >
                          <Mail size={14} /> Personalize
                        </button>

                        <button
                          onClick={() => onSelectLead(company)}
                          className="btn-secondary"
                          style={{ padding: "5px 8px" }}
                          title="View Full Company Dossier"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
