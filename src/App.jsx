import React, { useState, useEffect, useRef } from "react";
import { Sliders } from "lucide-react";
import { getCurrentPosition, reverseGeocode } from "./services/apifyService";
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
  const [settings, setSettingsState] = useState({ apifyToken: "", hunterApiKey: "", geminiApiKey: "" });
  const [activeView, setActiveView] = useState("table"); // 'table' | 'kanban' | 'history'
  const [isSearching, setIsSearching] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]); // array of { msg, done }
  const progressIntervalRef = useRef(null);

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

  const PROGRESS_STEPS = [
    { msg: '🔗 Connecting to Apify (3 scrapers)...' },
    { msg: '🗺️ Scraper 1: Google Maps — finding local businesses...' },
    { msg: '📧 Scraper 2: Email Extractor — pulling contact details...' },
    { msg: '🔍 Scraper 3: Google Search — finding additional companies...' },
    { msg: '🔀 Merging & deduplicating results from all sources...' },
    { msg: '🦅 Hunter.io — enriching emails where available...' },
    { msg: '🧠 Scoring and ranking all leads...' },
    { msg: '✅ Packaging final results...' },
  ];

  const startProgressAnimation = () => {
    setProgressSteps([{ msg: PROGRESS_STEPS[0].msg, done: false }]);
    let stepIdx = 1;
    progressIntervalRef.current = setInterval(() => {
      if (stepIdx < PROGRESS_STEPS.length) {
        setProgressSteps(prev => [
          ...prev.map((s, i) => i === prev.length - 1 ? { ...s, done: true } : s),
          { msg: PROGRESS_STEPS[stepIdx].msg, done: false }
        ]);
        stepIdx++;
      }
    }, 3000);
  };

  const stopProgressAnimation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgressSteps([]);
  };

  const handleSearch = async (queryText, filters) => {
    if (!settings.apifyToken) {
      triggerToast("⚠️ Please add your Apify API token in Settings first!", true);
      setShowSettingsModal(true);
      return;
    }

    setIsSearching(true);
    startProgressAnimation();

    let enrichedFilters = { ...filters };

    // Handle Near Me GPS search
    if (filters.city === '📍 Near Me (GPS)') {
      try {
        setProgressSteps([{ msg: '📡 Getting your GPS location...', done: false }]);
        const coords = await getCurrentPosition();
        const cityName = await reverseGeocode(coords.lat, coords.lng);
        enrichedFilters = { ...filters, coords, nearMeCity: cityName };
        setProgressSteps([
          { msg: `📍 Location detected: ${cityName}`, done: true },
          { msg: '🔗 Connecting to Apify...', done: false }
        ]);
        // Resume normal animation after GPS step
        let stepIdx = 2;
        progressIntervalRef.current = setInterval(() => {
          if (stepIdx < PROGRESS_STEPS.length) {
            setProgressSteps(prev => [
              ...prev.map((s, i) => i === prev.length - 1 ? { ...s, done: true } : s),
              { msg: PROGRESS_STEPS[stepIdx].msg, done: false }
            ]);
            stepIdx++;
          }
        }, 3000);
      } catch (err) {
        stopProgressAnimation();
        setIsSearching(false);
        if (err.message === 'GPS_PERMISSION_DENIED') {
          triggerToast('⚠️ GPS permission denied. Please allow location access and try again.', true);
        } else {
          triggerToast('⚠️ Could not get GPS location. Try selecting a city manually.', true);
        }
        return;
      }
    }

    try {
      const newLeads = await executeLeadDiscovery(queryText, enrichedFilters, settings);

      if (newLeads.length === 0) {
        triggerToast('No new leads found — all results already in your history.');
        setLeads([]);
        return;
      }

      await bulkAddToHistory(newLeads);
      await refreshHistoryCount();
      setLeads(newLeads);

      const cityLabel = enrichedFilters.nearMeCity ? `near you (${enrichedFilters.nearMeCity})` : (enrichedFilters.city || 'this area');
      triggerToast(`✅ ${newLeads.length} real leads found ${cityLabel} and saved to history!`);
    } catch (err) {
      console.error('Discovery error:', err);
      if (err.message === 'APIFY_TOKEN_MISSING') {
        triggerToast('⚠️ Apify token not set. Please configure in Settings.', true);
        setShowSettingsModal(true);
      } else if (err.message?.startsWith('SCRAPE_FAILED')) {
        triggerToast(`Search failed: ${err.message.replace('SCRAPE_FAILED: ', '')}`, true);
      } else {
        triggerToast('Search failed. Please try again.', true);
      }
    } finally {
      stopProgressAnimation();
      setIsSearching(false);
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

            {/* Dynamic Step-by-Step Progress Tracker */}
            {isSearching && progressSteps.length > 0 && (
              <div className="glass-panel" style={{ margin: "12px 0", padding: "16px 20px", border: "1px solid rgba(6,182,212,0.25)" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  🔍 Live Search Progress
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {progressSteps.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, animation: i === progressSteps.length - 1 ? "fadeIn 0.4s ease" : "none" }}>
                      {step.done ? (
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#10b981", flexShrink: 0 }}>✓</span>
                      ) : (
                        <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--accent-cyan)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0, display: "inline-block" }} />
                      )}
                      <span style={{
                        fontSize: "0.88rem",
                        color: step.done ? "var(--text-muted)" : "var(--accent-cyan)",
                        fontWeight: step.done ? 400 : 600,
                        textDecoration: step.done ? "none" : "none"
                      }}>
                        {step.msg}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, height: 3, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-indigo))",
                    width: `${Math.min(95, (progressSteps.filter(s => s.done).length / PROGRESS_STEPS.length) * 100)}%`,
                    transition: "width 0.5s ease"
                  }} />
                </div>
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
