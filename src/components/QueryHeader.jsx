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

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!queryText.trim()) return;
    onSearch(queryText, {
      city: selectedCity,
      industry: selectedIndustry,
      companySize: selectedSize,
      leadCount: leadCount
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
      leadCount: leadCount
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
      </div>

      {/* Main Search Bar */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 14 }} />
          <input
            type="text"
            className="glass-input"
            style={{ width: "100%", paddingLeft: 42, paddingRight: 14, fontSize: "1rem", height: 48 }}
            placeholder="e.g. Manufacturing companies in Chennai with 20-200 employees..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary"
          style={{ height: 48, padding: "0 16px" }}
        >
          <Filter size={16} /> Filters {showFilters ? "▲" : "▼"}
        </button>

        <button
          type="submit"
          disabled={isSearching}
          className="btn-primary"
          style={{ height: 48, padding: "0 24px", minWidth: 160, justifyContent: "center" }}
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
