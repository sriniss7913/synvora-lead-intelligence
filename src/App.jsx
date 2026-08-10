import React, { useState, useEffect } from "react";
import { Sliders } from "lucide-react";
import Navbar from "./components/Navbar";
import QueryHeader from "./components/QueryHeader";
import LeadStatsOverview from "./components/LeadStatsOverview";
import LeadTable from "./components/LeadTable";
import PipelineKanban from "./components/PipelineKanban";
import ScoreBreakdownModal from "./components/ScoreBreakdownModal";
import LeadDetailModal from "./components/LeadDetailModal";
import OutreachDrawer from "./components/OutreachDrawer";
import SettingsModal from "./components/SettingsModal";
import HistoryPanel from "./components/HistoryPanel";

import {
  loadSettings,
  saveSettings,
  executeLeadDiscovery
} from "./services/leadIntelligenceEngine";
import { bulkAddToHistory, getAllHistoryLeads } from "./services/historyDB";

const SETTINGS_KEY = "synvora_lead_intelligence_settings_v2";

export default function App() {
  const [leads, setLeads] = useState([]);           // Current session fresh search results
  const [historyCount, setHistoryCount] = useState(0);
  const [settings, setSettingsState] = useState({ apifyToken: "", hunterApiKey: "" });
  const [activeView, setActiveView] = useState("table"); // 'table' | 'kanban' | 'history'
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(null);

  // Modals
  const [selectedLeadForScore, setSelectedLeadForScore] = useState(null);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);
  const [selectedLeadForOutreach, setSelectedLeadForOutreach] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Load settings
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettingsState(JSON.parse(raw));
    } catch (e) {}

    // Load history count for badge
    getAllHistoryLeads().then(all => setHistoryCount(all.length)).catch(() => {});
  }, []);

  const triggerToast = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  const refreshHistoryCount = async () => {
    try {
      const all = await getAllHistoryLeads();
      setHistoryCount(all.length);
    } catch (e) {}
  };

  const handleSearch = async (queryText, filters) => {
    if (!settings.apifyToken) {
      triggerToast("⚠️ Please add your Apify API token in Settings first!", true);
      setShowSettingsModal(true);
      return;
    }

    setIsSearching(true);
    setSearchProgress("🔍 Starting search...");

    try {
      const onProgress = (msg, pct) => setSearchProgress(`${msg}`);

      const newLeads = await executeLeadDiscovery(queryText, filters, settings, onProgress);

      if (newLeads.length === 0) {
        triggerToast("No new leads found — all results already in your history.");
        setLeads([]);
        return;
      }

      // Save freshly discovered leads to IndexedDB history
      await bulkAddToHistory(newLeads);
      await refreshHistoryCount();

      // Show in current session
      setLeads(newLeads);
      triggerToast(`✅ ${newLeads.length} real leads discovered and saved to history!`);
    } catch (err) {
      console.error("Discovery error:", err);
      if (err.message === "APIFY_TOKEN_MISSING") {
        triggerToast("⚠️ Apify token not set. Please configure in Settings.", true);
        setShowSettingsModal(true);
      } else if (err.message?.startsWith("SCRAPE_FAILED")) {
        triggerToast(`Search failed: ${err.message.replace("SCRAPE_FAILED: ", "")}`, true);
      } else {
        triggerToast("Search failed. Please try again.", true);
      }
    } finally {
      setIsSearching(false);
      setSearchProgress(null);
    }
  };

  const handleOutreachApprovalStatus = (leadId, approvalStatus, updatedOutreachCopy) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          outreachApprovedStatus: approvalStatus,
          status: approvalStatus === "Approved" ? "Outreach Prepared" : l.status,
          outreach: updatedOutreachCopy ? { ...l.outreach, ...updatedOutreachCopy } : l.outreach
        };
      }
      return l;
    });
    setLeads(updated);
    triggerToast(`Outreach status set to "${approvalStatus}"`);
  };

  const handleSaveSettings = (newSettings) => {
    setSettingsState(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {}
    triggerToast("✅ API configuration saved!");
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Company Name", "Category", "Address", "Phone", "Website", "Email", "Rating", "Reviews", "Google Maps URL", "Data Source"];
    const rows = leads.map(l => [
      `"${l.companyName || ''}"`,
      `"${l.category || l.industry || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.website || ''}"`,
      `"${l.companyEmail || l.decisionMaker?.email || ''}"`,
      l.rating || '',
      l.reviewsCount || 0,
      `"${l.googleMapsUrl || ''}"`,
      `"${l.dataSource || ''}"`
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Synvora_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Exported CSV!");
  };

  const handleUpdateLeadStatus = (leadId, newStatus) => {
    const updated = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
    setLeads(updated);
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>

      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: notification.isError ? "rgba(239,68,68,0.95)" : "var(--accent-cyan)",
          color: notification.isError ? "#fff" : "#0f172a",
          padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: "0.9rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 9999, animation: "fadeIn 0.2s ease",
          maxWidth: 340
        }}>
          {notification.msg}
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        settings={settings}
        onOpenSettings={() => setShowSettingsModal(true)}
        onExportCSV={handleExportCSV}
        totalLeadsCount={leads.length}
        historyCount={historyCount}
      />

      {/* Main Content */}
      <main style={{ padding: "0 16px" }}>

        {/* History Tab — Full Separate View */}
        {activeView === "history" ? (
          <HistoryPanel />
        ) : (
          <>
            {/* Fresh Search UI */}
            <QueryHeader onSearch={handleSearch} isSearching={isSearching} />

            {/* Search Progress */}
            {isSearching && searchProgress && (
              <div className="glass-panel" style={{ margin: "0 0 12px 0", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 16, height: 16, border: "2px solid var(--accent-cyan)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: "0.9rem", color: "var(--accent-cyan)", fontWeight: 600 }}>{searchProgress}</span>
              </div>
            )}

            {/* No API key prompt */}
            {!settings.apifyToken && !isSearching && (
              <div className="glass-panel" style={{ padding: 32, textAlign: "center", marginBottom: 16, border: "1px solid rgba(245,158,11,0.3)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔑</div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fbbf24", marginBottom: 8 }}>
                  Apify API Token Required
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: 20, maxWidth: 480, margin: "0 auto 20px" }}>
                  Connect your free Apify account to start discovering real Indian businesses from Google Maps. Takes 2 minutes to set up.
                </div>
                <button onClick={() => setShowSettingsModal(true)} className="btn-primary">
                  <Sliders size={16} /> Configure API Keys
                </button>
              </div>
            )}

            {/* Results */}
            {leads.length > 0 && (
              <>
                <LeadStatsOverview leads={leads} />
                {activeView === "table" ? (
                  <LeadTable
                    leads={leads}
                    onSelectLead={(comp) => setSelectedLeadForDetail(comp)}
                    onOpenScoreModal={(comp) => setSelectedLeadForScore(comp)}
                    onOpenOutreach={(comp) => setSelectedLeadForOutreach(comp)}
                  />
                ) : (
                  <PipelineKanban
                    leads={leads}
                    onOpenScoreModal={(comp) => setSelectedLeadForScore(comp)}
                    onOpenOutreach={(comp) => setSelectedLeadForOutreach(comp)}
                    onSelectLead={(comp) => setSelectedLeadForDetail(comp)}
                    onUpdateLeadStatus={handleUpdateLeadStatus}
                  />
                )}
              </>
            )}

            {/* Empty state when key is set but no search yet */}
            {settings.apifyToken && leads.length === 0 && !isSearching && (
              <div className="glass-panel" style={{ padding: 60, textAlign: "center", border: "1px dashed var(--border-light)" }}>
                <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗺️</div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", marginBottom: 8 }}>Ready to Find Real Leads</div>
                <div style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  Search for any industry + city above. Real businesses will appear from Google Maps.
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals & Drawers */}
      {selectedLeadForScore && (
        <ScoreBreakdownModal company={selectedLeadForScore} onClose={() => setSelectedLeadForScore(null)} onOpenOutreach={(comp) => setSelectedLeadForOutreach(comp)} />
      )}
      {selectedLeadForDetail && (
        <LeadDetailModal company={selectedLeadForDetail} onClose={() => setSelectedLeadForDetail(null)} onOpenOutreach={(comp) => setSelectedLeadForOutreach(comp)} />
      )}
      {selectedLeadForOutreach && (
        <OutreachDrawer company={selectedLeadForOutreach} onClose={() => setSelectedLeadForOutreach(null)} onUpdateStatus={handleOutreachApprovalStatus} />
      )}
      {showSettingsModal && (
        <SettingsModal settings={settings} onClose={() => setShowSettingsModal(false)} onSaveSettings={handleSaveSettings} />
      )}
    </div>
  );
}
