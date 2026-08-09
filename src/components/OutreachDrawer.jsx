import React, { useState } from "react";
import { X, Mail, Share2, MessageSquare, PhoneCall, Copy, Check, ThumbsUp, XCircle, Sparkles, ExternalLink, Send } from "lucide-react";

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
  const targetEmail = dm.email || company.companyEmail || "";
  const targetPhone = dm.phone || "";

  // Helper for 1-Click WhatsApp
  const handleLaunchWhatsApp = () => {
    const rawDigits = targetPhone.replace(/[^0-9]/g, "");
    // Default to India country code 91 if length is 10 digits
    const formattedPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(url, "_blank");

    onUpdateStatus(company.id, "Sent", {
      email: { subject: emailSubject, body: emailBody },
      linkedin: linkedinMsg,
      whatsapp: whatsappMsg
    });
  };

  // Helper for 1-Click Email (mailto)
  const handleLaunchEmail = () => {
    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;

    onUpdateStatus(company.id, "Sent", {
      email: { subject: emailSubject, body: emailBody },
      linkedin: linkedinMsg,
      whatsapp: whatsappMsg
    });
  };

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
          width: 660,
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
            <Sparkles size={14} /> AI Outreach Personalization & Direct Dispatch
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginTop: 4 }}>
            Outreach for {company.companyName}
          </h2>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
            Target Executive: <strong>{dm.name || "Decision Maker"}</strong> ({dm.title || "Role"}) • {targetEmail}
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
            <Mail size={15} /> Cold Email
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
            <MessageSquare size={15} /> WhatsApp Direct
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
                  {copiedTab === "email" ? <Check size={12} color="var(--tier-nurture)" /> : <Copy size={12} />} Copy Body
                </button>
              </div>
              <textarea
                className="glass-input"
                rows={10}
                style={{ width: "100%", marginTop: 4, fontFamily: "var(--font-mono)", fontSize: "0.83rem", lineHeight: 1.5 }}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>

            {/* 1-Click Send Email Action */}
            <div style={{ background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: 14, borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-indigo)", marginBottom: 6 }}>
                ⚡ 1-Click Launch Email Client
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 10 }}>
                Launches your local email app (Gmail, Outlook, Apple Mail) with Recipient ({targetEmail}), Subject, and Body pre-filled.
              </p>
              <button
                onClick={handleLaunchEmail}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}
              >
                <Send size={16} /> Open Email Client with Pre-filled Copy
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: WhatsApp Direct */}
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
              rows={7}
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
              value={whatsappMsg}
              onChange={(e) => setWhatsappMsg(e.target.value)}
            />

            {/* 1-Click Send WhatsApp Action */}
            <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: 14, borderRadius: 8, marginTop: 14 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--tier-nurture)", marginBottom: 6 }}>
                🟢 1-Click Send WhatsApp Message
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 10 }}>
                Opens WhatsApp App on phone or WhatsApp Web on PC with recipient number ({targetPhone}) and message body ready.
              </p>
              <button
                onClick={handleLaunchWhatsApp}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)" }}
              >
                <ExternalLink size={16} /> Launch WhatsApp with Pre-filled Message
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: LinkedIn */}
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
            {dm.linkedin && (
              <a
                href={dm.linkedin}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ width: "100%", justifyContent: "center", marginTop: 14, color: "#0a66c2" }}
              >
                <ExternalLink size={14} /> Open {dm.name}'s LinkedIn Profile
              </a>
            )}
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
            <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-light)", padding: 16, borderRadius: 8, fontSize: "0.88rem", lineHeight: 1.5, color: "var(--text-main)", marginBottom: 14 }}>
              {outreachData.callScript}
            </div>
            {targetPhone && (
              <a href={`tel:${targetPhone}`} className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                <PhoneCall size={14} color="var(--tier-nurture)" /> Call {targetPhone}
              </a>
            )}
          </div>
        )}

        {/* Human Approval Decision Bar */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
            Human Approval Control
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
