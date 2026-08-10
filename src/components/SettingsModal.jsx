import React, { useState } from "react";
import { X, Sliders, Key, ShieldCheck, Check, Info, ExternalLink, AlertTriangle } from "lucide-react";

export default function SettingsModal({ settings, onClose, onSaveSettings }) {
  const [apifyToken, setApifyToken] = useState(settings.apifyToken || "");
  const [hunterApiKey, setHunterApiKey] = useState(settings.hunterApiKey || "");
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      apifyToken: apifyToken.trim(),
      hunterApiKey: hunterApiKey.trim(),
      geminiApiKey: geminiApiKey.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const hasApify = apifyToken.trim().length > 10;
  const hasHunter = hunterApiKey.trim().length > 10;
  const hasGemini = geminiApiKey.trim().length > 10;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{ width: 600, maxWidth: "95%", padding: 28, position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", right: 20, top: 20, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sliders size={22} color="var(--accent-purple)" />
          </div>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>API Configuration</h2>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Connect real data sources for genuine lead intelligence</div>
          </div>
        </div>

        <form onSubmit={handleSave}>

          {/* Apify Section */}
          <div style={{ marginBottom: 20, background: "rgba(15, 23, 42, 0.7)", padding: 16, borderRadius: 10, border: `1px solid ${hasApify ? 'rgba(16,185,129,0.5)' : 'var(--border-light)'}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: "1.3rem" }}>🗺️</span>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
                  Apify — Google Maps Scraper
                  {hasApify && <span style={{ marginLeft: 8, color: "#10b981", fontSize: "0.72rem" }}>✅ Connected</span>}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Real Indian businesses from Google Maps • Free tier: 5,000 results/month
                </div>
              </div>
            </div>

            <input
              type="password"
              className="glass-input"
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem", marginBottom: 8 }}
              placeholder="apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={apifyToken}
              onChange={(e) => setApifyToken(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={11} color="var(--tier-nurture)" /> Stored locally in your browser only
              </div>
              <a
                href="https://console.apify.com/account/integrations"
                target="_blank" rel="noreferrer"
                style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
              >
                Get free Apify token <ExternalLink size={10} />
              </a>
            </div>

            {/* Setup Guide */}
            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", cursor: "pointer" }}>📖 Setup guide (2 minutes)</summary>
              <ol style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8, paddingLeft: 16, lineHeight: 1.7 }}>
                <li>Go to <strong>apify.com</strong> → Sign up free (Google login works)</li>
                <li>Go to <strong>Account → Integrations → API Tokens</strong></li>
                <li>Click <strong>"Create new token"</strong> → Name it "Synvora"</li>
                <li>Copy the token and paste above</li>
                <li>Free tier gives you $5/month credit ≈ 5,000+ business searches</li>
              </ol>
            </details>
          </div>

          {/* Hunter.io Section */}
          <div style={{ marginBottom: 20, background: "rgba(15, 23, 42, 0.7)", padding: 16, borderRadius: 10, border: `1px solid ${hasHunter ? 'rgba(99,102,241,0.5)' : 'var(--border-light)'}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: "1.3rem" }}>🦅</span>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
                  Hunter.io — Email Discovery
                  {hasHunter && <span style={{ marginLeft: 8, color: "#6366f1", fontSize: "0.72rem" }}>✅ Connected</span>}
                  <span style={{ marginLeft: 8, fontSize: "0.7rem", color: "var(--text-dim)", fontWeight: 400 }}>(Optional)</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Find real email addresses for discovered companies • Free: 25/month
                </div>
              </div>
            </div>

            <input
              type="password"
              className="glass-input"
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem", marginBottom: 8 }}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={hunterApiKey}
              onChange={(e) => setHunterApiKey(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={11} color="var(--tier-nurture)" /> Stored locally in your browser only
              </div>
              <a
                href="https://hunter.io/api-keys"
                target="_blank" rel="noreferrer"
                style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
              >
                Get free Hunter.io key <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Gemini AI Section */}
          <div style={{ marginBottom: 20, background: "rgba(15, 23, 42, 0.7)", padding: 16, borderRadius: 10, border: `1px solid ${hasGemini ? 'rgba(168,85,247,0.5)' : 'var(--border-light)'}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: "1.3rem" }}>✨</span>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
                  Gemini AI — Personalized Outreach
                  {hasGemini && <span style={{ marginLeft: 8, color: "#a855f7", fontSize: "0.72rem" }}>✅ Connected</span>}
                  <span style={{ marginLeft: 8, fontSize: "0.7rem", color: "var(--text-dim)", fontWeight: 400 }}>(Optional)</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Generates a unique email, WhatsApp & call script per lead using AI • Free: 1,500 requests/day
                </div>
              </div>
            </div>

            <input
              type="password"
              className="glass-input"
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem", marginBottom: 8 }}
              placeholder="AIza..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={11} color="var(--tier-nurture)" /> Stored locally in your browser only
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank" rel="noreferrer"
                style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
              >
                Get free Gemini key (AI Studio) <ExternalLink size={10} />
              </a>
            </div>

            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", cursor: "pointer" }}>📖 Setup guide (1 minute)</summary>
              <ol style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8, paddingLeft: 16, lineHeight: 1.7 }}>
                <li>Go to <strong>aistudio.google.com</strong> → Sign in with Google</li>
                <li>Click <strong>"Get API Key"</strong> → <strong>"Create API key"</strong></li>
                <li>Copy the key (starts with "AIza...")</li>
                <li>Paste above → Each lead gets a unique AI-written message</li>
                <li>Free tier: 1,500 requests/day — plenty for normal usage</li>
              </ol>
            </details>
          </div>

          {/* Status Banner */}
          {!hasApify && (
            <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)", padding: 12, borderRadius: 8, fontSize: "0.8rem", color: "#fbbf24", marginBottom: 20, display: "flex", gap: 8 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong>Apify token required</strong> — without it, no real lead data can be fetched.</span>
            </div>
          )}

          {hasApify && (
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: 12, borderRadius: 8, fontSize: "0.8rem", color: "#6ee7b7", marginBottom: 20 }}>
              ✅ <strong>Ready for real leads.</strong>{" "}
              {hasGemini ? "Gemini AI will write unique outreach per lead. " : "Add Gemini key for AI-written outreach. "}
              {hasHunter ? "Hunter.io connected for email enrichment." : ""}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {saveSuccess ? <><Check size={16} /> Saved!</> : "Save & Connect"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
