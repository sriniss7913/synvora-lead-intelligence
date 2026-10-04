import React, { useState } from "react";
import { Search, Sparkles, Filter, MapPin, Building, Users, RefreshCw } from "lucide-react";
import { INDUSTRY_PRESETS, CITIES_LIST, INDUSTRIES_LIST, COMPANY_SIZES_LIST } from "../data/industryPresets";

export default function QueryHeader({ onSearch, isSearching }) {
  const [queryText, setQueryText] = useState("Manufacturing companies in Chennai with 20-200 employees");
  const [selectedCity, setSelectedCity] = useState("All Locations");
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries");
  const [selectedSize, setSelectedSize] = useState("Any Size");
  const [leadCount, setLeadCount] = useState("10");
  const [showFilters, setShowFilters] = useState(false);
  const [provider, setProvider] = useState("gemini");
  const [useEmails, setUseEmails] = useState(true);
  const [useSearchBackup, setUseSearchBackup] = useState(true);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!queryText.trim()) return;
    onSearch(queryText, {
      city: selectedCity,
      industry: selectedIndustry,
      companySize: selectedSize,
      leadCount: leadCount,
      provider: provider,
      useEmails: useEmails,
      useSearchBackup: useSearchBackup
    });
  };

  const handlePresetSelect = (preset) => {
    setQueryText(preset.query);
    setSelectedIndustry(preset.industry);
    setSelectedCity(preset.location.split(",")[0]);
    onSearch(preset.query, {
      city: preset.location.split(",")[0],
      industry: preset.industry,
      companySize: preset.size,
      leadCount: leadCount,
      provider: provider,
      useEmails: useEmails,
      useSearchBackup: useSearchBackup
    });
  };

  return (
    <div className="glass-panel" style={{ padding: 24, margin: "20px auto 0 auto", maxWidth: 1400 }}>
      
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={20} color="var(--accent-cyan)" />
          Target Lead Discovery & Intelligence Search
        </h2>
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: 4 }}>
          Enter any natural business query (e.g. <i>"SMEs in Hyderabad with 10-50 employees"</i>) across any city, region, or industry.
        </p>

        {/* Lead Generation Mode Toggle */}
        <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            ⚡ Lead Generation Mode
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* AI Mode Card */}
            <button
              type="button"
              onClick={() => setProvider("gemini")}
              style={{
                padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                transition: "all 0.25s ease", border: "none",
                background: provider === "gemini"
                  ? "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(6,182,212,0.15))"
                  : "rgba(255,255,255,0.03)",
                outline: provider === "gemini" ? "2px solid rgba(168,85,247,0.6)" : "1px solid var(--border-light)",
                boxShadow: provider === "gemini" ? "0 0 20px rgba(168,85,247,0.2)" : "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "1.3rem" }}>✨</span>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: provider === "gemini" ? "#c084fc" : "#fff" }}>
                  AI Mode
                </span>
                {provider === "gemini" && <span style={{ fontSize: "0.65rem", background: "rgba(168,85,247,0.3)", color: "#c084fc", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>ACTIVE</span>}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Gemini AI + Google Search Grounding
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: "0.72rem", color: "#10b981" }}>⚡ Fast — 3-5 seconds</span>
                <span style={{ fontSize: "0.72rem", color: "#10b981" }}>🔑 Needs Gemini or Grok key</span>
                <span style={{ fontSize: "0.72rem", color: "#fbbf24" }}>⚠️ Burns LLM tokens for search + outreach</span>
              </div>
            </button>

            {/* Apify Mode Card */}
            <button
              type="button"
              onClick={() => setProvider("apify")}
              style={{
                padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                transition: "all 0.25s ease", border: "none",
                background: provider === "apify"
                  ? "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.15))"
                  : "rgba(255,255,255,0.03)",
                outline: provider === "apify" ? "2px solid rgba(6,182,212,0.6)" : "1px solid var(--border-light)",
                boxShadow: provider === "apify" ? "0 0 20px rgba(6,182,212,0.2)" : "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "1.3rem" }}>📍</span>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: provider === "apify" ? "#22d3ee" : "#fff" }}>
                  Apify Scraper Mode
                </span>
                {provider === "apify" && <span style={{ fontSize: "0.65rem", background: "rgba(6,182,212,0.3)", color: "#22d3ee", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>ACTIVE</span>}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Google Maps deep scrape via Apify actors
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: "0.72rem", color: "#10b981" }}>🗺️ Deep — real Google Maps data</span>
                <span style={{ fontSize: "0.72rem", color: "#10b981" }}>💰 LLM tokens used for outreach only</span>
                <span style={{ fontSize: "0.72rem", color: "#fbbf24" }}>⏱️ Slower — 60-180 seconds</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Bar */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", position: "relative" }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 14 }} />
          <input
            type="text"
            className="glass-input"
            style={{ width: "100%", paddingLeft: 42, paddingRight: 14, fontSize: "0.95rem", height: 48 }}
            placeholder="e.g. Manufacturing companies in Chennai with 20-200 employees..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flex: "1 1 auto", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
            style={{ height: 48, padding: "0 16px", flex: "1 1 auto", justifyContent: "center" }}
          >
            <Filter size={16} /> Filters {showFilters ? "▲" : "▼"}
          </button>

          <button
            type="submit"
            disabled={isSearching}
            className="btn-primary"
            style={{ height: 48, padding: "0 20px", flex: "2 1 160px", justifyContent: "center" }}
          >
            {isSearching ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Synthesizing AI Leads...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Run Lead Intelligence
              </>
            )}
          </button>
        </div>
      </form>

      {/* Optional Filters Drawer */}
      {showFilters && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-light)" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <MapPin size={13} /> Location / City
            </label>
            <select
              className="glass-input"
              style={{ width: "100%", height: 38 }}
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {CITIES_LIST.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Building size={13} /> Target Industry
            </label>
            <select
              className="glass-input"
              style={{ width: "100%", height: 38 }}
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
            >
              {INDUSTRIES_LIST.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Users size={13} /> Employee Size
            </label>
            <select
              className="glass-input"
              style={{ width: "100%", height: 38 }}
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {COMPANY_SIZES_LIST.map(sz => <option key={sz} value={sz}>{sz}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Sparkles size={13} /> Leads Per Search
            </label>
            <select
              className="glass-input"
              style={{ width: "100%", height: 38, border: "1px solid var(--border-glow)" }}
              value={leadCount}
              onChange={(e) => setLeadCount(e.target.value)}
            >
              <option value="5">5 Leads</option>
              <option value="10">10 Leads (Default)</option>
              <option value="15">15 Leads</option>
              <option value="25">25 Leads</option>
              <option value="50">50 Leads</option>
            </select>
          </div>
        </div>
      )}

      {/* Scraping Depth & Tool Selectors */}
      {showFilters && (
        <div style={{
          marginTop: 16, padding: "14px 18px", borderRadius: 10,
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-light)",
          display: "flex", gap: 24, flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🛠️ Discovery Pipeline Configuration
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Customize active scraping sources. Maps is always active. Turn on optional scrapers for deeper intelligence.
            </span>
          </div>

          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#fff", cursor: "pointer" }}>
              <input type="checkbox" checked={true} disabled style={{ accentColor: "var(--accent-cyan)" }} />
              <span>🗺️ Google Maps Scraper <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(Fast / Required)</span></span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#fff", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={useEmails}
                onChange={(e) => setUseEmails(e.target.checked)}
                style={{ accentColor: "var(--accent-cyan)", cursor: "pointer" }}
              />
              <span>📧 Website Email Extractor <span style={{ fontSize: "0.7rem", color: "#a855f7" }}>(Slower but enriched)</span></span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#fff", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={useSearchBackup}
                onChange={(e) => setUseSearchBackup(e.target.checked)}
                style={{ accentColor: "var(--accent-cyan)", cursor: "pointer" }}
              />
              <span>🔍 Google Search Backup <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(Fallback if Maps runs low)</span></span>
            </label>
          </div>
        </div>
      )}

      {/* Quick Search Preset Chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Presets:
        </span>
        {INDUSTRY_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => handlePresetSelect(preset)}
            className="btn-secondary"
            style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: 20 }}
          >
            {preset.title}
          </button>
        ))}
      </div>

    </div>
  );
}
