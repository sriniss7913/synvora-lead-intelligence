import React from "react";
import { X, Building2, MapPin, Globe, Users, Phone, Mail, Share2, AlertTriangle, TrendingUp, Cpu, MailPlus } from "lucide-react";

export default function LeadDetailModal({ company, onClose, onOpenOutreach }) {
  if (!company) return null;

  const dm = company.decisionMaker || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{ width: 760, maxWidth: "94%", maxHeight: "88vh", overflowY: "auto", padding: 28, position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", right: 20, top: 20, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        {/* Company Title Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>
              {company.companyName}
            </h2>
            <span className={`badge ${company.tierBadgeClass}`}>
              {company.tier} ({company.score}/100)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 8, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Building2 size={14} color="var(--accent-cyan)" /> {company.industry}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={14} color="var(--accent-cyan)" /> {company.location}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={14} color="var(--accent-cyan)" /> {company.companySize}
            </span>
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent-cyan)" }}>
                <Globe size={14} /> Website
              </a>
            )}
          </div>
        </div>

        {/* Decision Maker Dossier Card */}
        <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: 16, borderRadius: 10, border: "1px solid rgba(99, 102, 241, 0.3)", marginBottom: 20 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-indigo)", marginBottom: 8 }}>
            Key Decision Maker Contact
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>
                {dm.name || "N/A"}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                {dm.title || "Executive Director"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.82rem" }}>
              {dm.email && (
                <a href={`mailto:${dm.email}`} style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Mail size={14} color="var(--accent-cyan)" /> {dm.email}
                </a>
              )}
              {dm.phone && (
                <a href={`tel:${dm.phone}`} style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Phone size={14} color="var(--tier-nurture)" /> {dm.phone}
                </a>
              )}
              {dm.linkedin && (
                <a href={dm.linkedin} target="_blank" rel="noreferrer" style={{ color: "#0a66c2", display: "flex", alignItems: "center", gap: 4 }}>
                  <Share2 size={14} /> LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Products & Digital Audit */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 20 }}>
          
          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 14, borderRadius: 8, border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Cpu size={14} color="var(--accent-cyan)" /> Products & Digital Maturity
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-main)", marginBottom: 6 }}>
              <strong>Products/Services:</strong> {company.productsServices || "B2B Products"}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <strong>Maturity:</strong> {company.digitalMaturity || "Moderate"}
            </div>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 14, borderRadius: 8, border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--tier-warm)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <TrendingUp size={14} /> Growth & Business Triggers
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
              {company.triggers || "Expanding operations"}
            </div>
          </div>

        </div>

        {/* Tech Signals & Potential Problems */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 24 }}>
          
          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 14, borderRadius: 8, border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-purple)", marginBottom: 8 }}>
              Tech & Infrastructure Signals
            </div>
            <ul style={{ paddingLeft: 18, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {company.techSignals?.map((sig, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{sig}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 14, borderRadius: 8, border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--tier-hot)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <AlertTriangle size={14} /> Operational Bottlenecks & Problems
            </div>
            <ul style={{ paddingLeft: 18, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {company.potentialProblems?.map((prob, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{prob}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* Footer Action */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-light)" }}>
          <button onClick={onClose} className="btn-secondary">
            Close Dossier
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenOutreach(company);
            }}
            className="btn-primary"
          >
            <MailPlus size={16} /> Prepare Personalized Outreach
          </button>
        </div>

      </div>
    </div>
  );
}
