import React, { useState } from "react";
import { X, Sliders, Key, Cpu, ShieldCheck, Check, Info } from "lucide-react";
import { AI_PROVIDERS } from "../services/aiProviderService";

export default function SettingsModal({ settings, onClose, onSaveSettings }) {
  const [selectedProvider, setSelectedProvider] = useState(settings.providerId || "heuristic");
  const [apiKey, setApiKey] = useState(settings.apiKey || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      providerId: selectedProvider,
      apiKey: apiKey.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const currentProviderObj = AI_PROVIDERS[selectedProvider.toUpperCase()] || AI_PROVIDERS.HEURISTIC;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{ width: 580, maxWidth: "92%", padding: 28, position: "relative" }}
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
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sliders size={22} color="var(--accent-purple)" />
          </div>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
              AI Intelligence Provider Settings
            </h2>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Choose between built-in zero-key heuristic mode or external AI APIs
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          
          {/* Provider Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Cpu size={15} color="var(--accent-cyan)" /> Select AI Provider Engine
            </label>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.values(AI_PROVIDERS).map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  style={{
                    background: selectedProvider === provider.id ? "rgba(6, 182, 212, 0.12)" : "rgba(30, 41, 59, 0.5)",
                    border: `1px solid ${selectedProvider === provider.id ? 'var(--accent-cyan)' : 'var(--border-light)'}`,
                    borderRadius: 8,
                    padding: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: selectedProvider === provider.id ? "#fff" : "var(--text-main)", fontSize: "0.9rem" }}>
                      {provider.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {provider.requiresKey ? "Requires API Key (Stored in Browser LocalStorage)" : "No API key required • Zero Cost"}
                    </div>
                  </div>

                  {selectedProvider === provider.id && (
                    <span style={{ color: "var(--accent-cyan)", display: "flex", alignItems: "center" }}>
                      <Check size={18} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* API Key Input (if provider requires key) */}
          {currentProviderObj.requiresKey && (
            <div style={{ marginBottom: 20, background: "rgba(15, 23, 42, 0.8)", padding: 14, borderRadius: 8, border: "1px solid var(--border-light)" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Key size={14} color="var(--tier-warm)" /> {currentProviderObj.name} API Key
              </label>
              <input
                type="password"
                className="glass-input"
                style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                placeholder={`Paste your ${currentProviderObj.name} API key here...`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={12} color="var(--tier-nurture)" /> Keys are saved locally in your browser's LocalStorage and never sent to external servers except direct AI endpoints.
              </div>
            </div>
          )}

          {/* Info note */}
          <div style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: 12, borderRadius: 8, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Info size={16} color="var(--accent-indigo)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Pro-tip:</strong> You can host this app on <strong>Vercel</strong> or Netlify with zero backend setup. The Heuristic Engine runs 100% client-side without any key requirements!
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {saveSuccess ? (
                <>
                  <Check size={16} /> Settings Saved!
                </>
              ) : (
                "Save Configuration"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
