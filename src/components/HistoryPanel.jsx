import React, { useState, useEffect } from "react";
import {
  getAllHistoryLeads, updateLeadInHistory, getHistoryStats, clearAllHistory, bulkAddToHistory
} from "../services/historyDB";
import {
  Phone, Mail, Globe, MapPin, MessageSquare, ExternalLink,
  Check, RefreshCw, Trash2, Clock, Star, Filter, Download, Search
} from "lucide-react";

const OUTREACH_STATUSES = [
  { value: "New", color: "#94a3b8", emoji: "🆕" },
  { value: "Email Sent", color: "#6366f1", emoji: "📧" },
  { value: "WhatsApp Sent", color: "#10b981", emoji: "💬" },
  { value: "Interested", color: "#f59e0b", emoji: "⚡" },
  { value: "Meeting Scheduled", color: "#06b6d4", emoji: "📅" },
  { value: "Closed Won", color: "#10b981", emoji: "🏆" },
  { value: "Not Interested", color: "#ef4444", emoji: "❌" },
  { value: "Closed Lost", color: "#64748b", emoji: "💀" }
];

export default function HistoryPanel() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingNotes, setEditingNotes] = useState({}); // id -> note text

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await getAllHistoryLeads();
      const s = await getHistoryStats();
      setLeads(all);
      setStats(s);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    await updateLeadInHistory(id, newStatus, editingNotes[id]);
    loadData();
  };

  const handleNoteChange = async (id, note) => {
    setEditingNotes(prev => ({ ...prev, [id]: note }));
    await updateLeadInHistory(id, undefined, note);
  };

  const handleClearHistory = async () => {
    if (window.confirm("⚠️ Permanently delete ALL lead history? This cannot be undone.")) {
      await clearAllHistory();
      loadData();
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Company Name", "Category", "Address", "Phone", "Website", "Email", "Google Rating", "Outreach Status", "Notes", "Discovered At", "Data Source"];
    const rows = leads.map(l => [
      `"${l.companyName || ''}"`,
      `"${l.category || l.industry || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.website || ''}"`,
      `"${l.companyEmail || l.decisionMaker?.email || ''}"`,
      l.rating || '',
      `"${l.outreachStatus || 'New'}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${l.discoveredAt?.slice(0, 10) || ''}"`,
      `"${l.dataSource || ''}"`
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Synvora_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = leads.filter(l => {
    const matchStatus = filterStatus === "All" || l.outreachStatus === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || (
      l.companyName?.toLowerCase().includes(term) ||
      l.address?.toLowerCase().includes(term) ||
      l.phone?.toLowerCase().includes(term) ||
      l.category?.toLowerCase().includes(term)
    );
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ marginTop: 12 }}>Loading lead history...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "20px auto 60px auto", padding: "0 16px" }}>

      {/* History Header */}
      <div className="glass-panel" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>📋 Lead History Vault</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
              All {stats.total || 0} leads ever discovered — with full outreach & follow-up tracking
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleExportCSV} className="btn-secondary" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
              <Download size={14} /> Export CSV
            </button>
            <button onClick={loadData} className="btn-secondary" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleClearHistory} className="btn-secondary" style={{ fontSize: "0.8rem", padding: "6px 12px", color: "var(--tier-hot)" }}>
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        </div>

        {/* Status Summary Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {OUTREACH_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? "All" : s.value)}
              style={{
                padding: "3px 10px",
                borderRadius: 20,
                border: `1px solid ${filterStatus === s.value ? s.color : "var(--border-light)"}`,
                background: filterStatus === s.value ? `${s.color}22` : "transparent",
                color: filterStatus === s.value ? s.color : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {s.emoji} {s.value} ({stats[s.value] || 0})
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginTop: 12, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 10, color: "var(--text-muted)" }} />
          <input
            type="text"
            className="glass-input"
            placeholder="Search by company name, address, phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: 36, height: 36, fontSize: "0.85rem" }}
          />
        </div>
      </div>

      {/* History Lead Cards */}
      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
          <Clock size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontWeight: 600 }}>No history yet</div>
          <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
            Run a search to discover real leads — they'll be saved here automatically.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(lead => {
            const statusInfo = OUTREACH_STATUSES.find(s => s.value === lead.outreachStatus) || OUTREACH_STATUSES[0];

            return (
              <div key={lead.id} className="glass-panel" style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

                  {/* Left: Company Info */}
                  <div style={{ flex: "1 1 260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: "1rem", color: "#fff" }}>{lead.companyName}</span>
                      {lead.rating && (
                        <span style={{ fontSize: "0.75rem", color: "#f59e0b", display: "flex", alignItems: "center", gap: 3 }}>
                          <Star size={11} fill="#f59e0b" /> {lead.rating} ({lead.reviewsCount})
                        </span>
                      )}
                    </div>
                    {lead.category && (
                      <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", marginBottom: 6 }}>{lead.category}</div>
                    )}
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 4 }}>
                      <MapPin size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{lead.address || lead.location || "N/A"}</span>
                    </div>
                    {lead.phone && (
                      <div style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                        <Phone size={12} color="var(--tier-nurture)" />
                        <a href={`tel:${lead.phone}`} style={{ color: "var(--text-main)", textDecoration: "none" }}>{lead.phone}</a>
                        {lead.phone && !lead.phone.startsWith('0') && (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank" rel="noreferrer"
                            style={{ color: "var(--tier-nurture)", fontSize: "0.7rem" }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                    {(lead.companyEmail || lead.decisionMaker?.email) && (
                      <div style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                        <Mail size={12} color="var(--accent-indigo)" />
                        <a href={`mailto:${lead.companyEmail || lead.decisionMaker?.email}`} style={{ color: "var(--accent-cyan)", textDecoration: "none", fontSize: "0.8rem" }}>
                          {lead.companyEmail || lead.decisionMaker?.email}
                        </a>
                      </div>
                    )}
                    {lead.website && (
                      <div style={{ fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 5 }}>
                        <Globe size={11} color="var(--text-dim)" />
                        <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                          {lead.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
                        </a>
                      </div>
                    )}
                    <div style={{ fontSize: "0.68rem", color: "var(--accent-cyan)", marginTop: 6 }}>{lead.dataSource}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginTop: 2 }}>
                      Discovered: {lead.discoveredAt?.slice(0, 10)} · Last updated: {lead.lastUpdated?.slice(0, 10)}
                    </div>
                  </div>

                  {/* Right: Status + Notes */}
                  <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Outreach Status
                    </div>
                    <select
                      value={lead.outreachStatus || "New"}
                      onChange={e => handleStatusChange(lead.id, e.target.value)}
                      className="glass-input"
                      style={{
                        height: 36,
                        fontSize: "0.82rem",
                        color: statusInfo.color,
                        border: `1px solid ${statusInfo.color}55`,
                        fontWeight: 600
                      }}
                    >
                      {OUTREACH_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.emoji} {s.value}</option>
                      ))}
                    </select>

                    <textarea
                      className="glass-input"
                      rows={3}
                      placeholder="Add notes, next action, follow-up date..."
                      value={editingNotes[lead.id] !== undefined ? editingNotes[lead.id] : (lead.notes || '')}
                      onChange={e => handleNoteChange(lead.id, e.target.value)}
                      style={{ fontSize: "0.8rem", resize: "vertical", lineHeight: 1.4 }}
                    />

                    {lead.googleMapsUrl && (
                      <a
                        href={lead.googleMapsUrl}
                        target="_blank" rel="noreferrer"
                        className="btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "4px 10px", justifyContent: "center" }}
                      >
                        <ExternalLink size={12} /> View on Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
