import React, { useState } from "react";
import { X, Mail, Share2, MessageSquare, PhoneCall, Copy, Check, ThumbsUp, Edit3, XCircle, Send, Sparkles } from "lucide-react";

export default function OutreachDrawer({ company, onClose, onUpdateStatus }) {
  if (!company) return null;

  const outreachData = company.outreach || {};
  const [activeTab, setActiveTab] = useState("email"); // email, linkedin, whatsapp, call
  const [copiedTab, setCopiedTab] = useState(null);

  // Editable states
  const [emailSubject, setEmailSubject] = useState(outreachData.email?.subject || "");
  const [emailBody, setEmailBody] = useState(outreachData.email?.body || "");
  const [linkedinMsg, setLinkedinMsg] = useState(outreachData.linkedin || "");
  const [whatsappMsg, setWhatsappMsg] = useState(outreachData.whatsapp || "");

  const dm = company.decisionMaker || {};

  const handleCopy = (text, tab) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleApprove = () => {
    onUpdateStatus(company.id, "Approved", {
      email: { subject: emailSubject, body: emailBody },
      linkedin: linkedinMsg,
      whatsapp: whatsappMsg
    });
    onClose();
  };

  const handleReject = () => {
    onUpdateStatus(company.id, "Rejected");
    onClose();
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div
        className="glass-panel drawer-content"
        style={{
          width: 640,
          maxWidth: "100%",
          height: "100vh",
          borderRadius: 0,
          borderRight: 0,
          padding: 24,
          overflowY: "auto",
          position: "relative",
          animation: "slideLeft 0.25s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", right: 20, top: 20, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        {/* Drawer Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase" }}>
            <Sparkles size={14} /> AI Outreach Personalization & Approval
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginTop: 4 }}>
            Outreach for {company.companyName}
          </h2>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
            Target Executive: <strong>{dm.name || "Decision Maker"}</strong> ({dm.title || "Role"}) • {dm.email}
          </div>
        </div>

        {/* Why Synvora Contacting Banner */}
        <div style={{ background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.25)", padding: 12, borderRadius: 8, fontSize: "0.82rem", color: "var(--text-main)", marginBottom: 20 }}>
          💡 <strong>Tailored Trigger:</strong> {outreachData.reasoning || company.whyContactReason}
        </div>

        {/* Multi-Channel Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-light)", marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab("email")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "email" ? "2px solid var(--accent-cyan)" : "2px solid transparent",
              color: activeTab === "email" ? "var(--accent-cyan)" : "var(--text-muted)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Mail size={15} /> Email
          </button>
          <button
            onClick={() => setActiveTab("linkedin")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "linkedin" ? "2px solid var(--accent-cyan)" : "2px solid transparent",
              color: activeTab === "linkedin" ? "var(--accent-cyan)" : "var(--text-muted)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Share2 size={15} /> LinkedIn
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "whatsapp" ? "2px solid var(--accent-cyan)" : "2px solid transparent",
              color: activeTab === "whatsapp" ? "var(--accent-cyan)" : "var(--text-muted)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <MessageSquare size={15} /> WhatsApp
          </button>
          <button
            onClick={() => setActiveTab("call")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "call" ? "2px solid var(--accent-cyan)" : "2px solid transparent",
              color: activeTab === "call" ? "var(--accent-cyan)" : "var(--text-muted)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <PhoneCall size={15} /> Phone Script
          </button>
        </div>

        {/* Tab 1: Cold Email */}
        {activeTab === "email" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Subject Line</label>
              <input
                type="text"
                className="glass-input"
                style={{ width: "100%", marginTop: 4, fontWeight: 600 }}
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Personalized Body Copy</label>
                <button onClick={() => handleCopy(`${emailSubject}\n\n${emailBody}`, "email")} className="btn-secondary" style={{ padding: "2px 8px", fontSize: "0.75rem" }}>
                  {copiedTab === "email" ? <Check size={12} color="var(--tier-nurture)" /> : <Copy size={12} />} Copy Email
                </button>
              </div>
              <textarea
                className="glass-input"
                rows={12}
                style={{ width: "100%", marginTop: 4, fontFamily: "var(--font-mono)", fontSize: "0.83rem", lineHeight: 1.5 }}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: LinkedIn */}
        {activeTab === "linkedin" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>LinkedIn InMail Note (300 char max)</label>
              <button onClick={() => handleCopy(linkedinMsg, "linkedin")} className="btn-secondary" style={{ padding: "2px 8px", fontSize: "0.75rem" }}>
                {copiedTab === "linkedin" ? <Check size={12} color="var(--tier-nurture)" /> : <Copy size={12} />} Copy Note
              </button>
            </div>
            <textarea
              className="glass-input"
              rows={6}
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
              value={linkedinMsg}
              onChange={(e) => setLinkedinMsg(e.target.value)}
            />
          </div>
        )}

        {/* Tab 3: WhatsApp */}
        {activeTab === "whatsapp" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>WhatsApp Direct Message</label>
              <button onClick={() => handleCopy(whatsappMsg, "whatsapp")} className="btn-secondary" style={{ padding: "2px 8px", fontSize: "0.75rem" }}>
                {copiedTab === "whatsapp" ? <Check size={12} color="var(--tier-nurture)" /> : <Copy size={12} />} Copy Message
              </button>
            </div>
            <textarea
              className="glass-input"
              rows={8}
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
              value={whatsappMsg}
              onChange={(e) => setWhatsappMsg(e.target.value)}
            />
          </div>
        )}

        {/* Tab 4: Phone Script */}
        {activeTab === "call" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Cold Call Opening Telephony Script</label>
              <button onClick={() => handleCopy(outreachData.callScript, "call")} className="btn-secondary" style={{ padding: "2px 8px", fontSize: "0.75rem" }}>
                {copiedTab === "call" ? <Check size={12} color="var(--tier-nurture)" /> : <Copy size={12} />} Copy Script
              </button>
            </div>
            <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-light)", padding: 16, borderRadius: 8, fontSize: "0.88rem", lineHeight: 1.5, color: "var(--text-main)" }}>
              {outreachData.callScript}
            </div>
          </div>
        )}

        {/* Human Approval Decision Bar */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
            Human Approval Control ("Don't blast cold leads automatically")
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleApprove}
              className="btn-primary"
              style={{ flex: 1, justifyContent: "center", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)" }}
            >
              <ThumbsUp size={16} /> Approve & Ready for Outreach
            </button>

            <button
              onClick={handleReject}
              className="btn-secondary"
              style={{ color: "var(--tier-hot)", borderColor: "rgba(239, 68, 68, 0.3)" }}
            >
              <XCircle size={16} /> Reject Lead
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
