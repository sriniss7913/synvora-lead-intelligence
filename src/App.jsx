import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import QueryHeader from "./components/QueryHeader";
import LeadStatsOverview from "./components/LeadStatsOverview";
import LeadTable from "./components/LeadTable";
import PipelineKanban from "./components/PipelineKanban";
import ScoreBreakdownModal from "./components/ScoreBreakdownModal";
import LeadDetailModal from "./components/LeadDetailModal";
import OutreachDrawer from "./components/OutreachDrawer";
import SettingsModal from "./components/SettingsModal";

import {
  loadStoredLeads,
  saveLeadsToStorage,
  loadSettings,
  saveSettings,
  executeLeadDiscovery,
  enrichCompanyDossier
} from "./services/leadIntelligenceEngine";
import { INITIAL_COMPANIES } from "./data/sampleCompanies";

export default function App() {
  const [leads, setLeads] = useState([]);
  const [settings, setSettingsState] = useState({ providerId: "heuristic", apiKey: "" });
  const [activeView, setActiveView] = useState("table"); // 'table' | 'kanban'
  const [isSearching, setIsSearching] = useState(false);

  // Modals state
  const [selectedLeadForScore, setSelectedLeadForScore] = useState(null);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);
  const [selectedLeadForOutreach, setSelectedLeadForOutreach] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const storedLeads = loadStoredLeads();
    setLeads(storedLeads);
    const storedSettings = loadSettings();
    setSettingsState(storedSettings);
  }, []);

  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSearch = async (queryText, filters) => {
    setIsSearching(true);
    try {
      const newDiscoveredLeads = await executeLeadDiscovery(queryText, filters, settings, leads);
      
      // Combine new leads with existing leads, preserving lead history
      const existingNames = new Set(leads.map(l => l.companyName.toLowerCase().trim()));
      const filteredNew = newDiscoveredLeads.filter(l => !existingNames.has(l.companyName.toLowerCase().trim()));

      const updatedList = [...filteredNew, ...leads];
      setLeads(updatedList);
      saveLeadsToStorage(updatedList);
      triggerToast(`Discovered ${filteredNew.length} new enriched leads!`);
    } catch (err) {
      console.error("Discovery error:", err);
      triggerToast("Error running lead discovery. Check settings.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateLeadStatus = (leadId, newStatus) => {
    const updated = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
    setLeads(updated);
    saveLeadsToStorage(updated);
    triggerToast(`Updated pipeline stage to "${newStatus}"`);
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
    saveLeadsToStorage(updated);
    triggerToast(`Outreach status set to "${approvalStatus}"`);
  };

  const handleSaveSettings = (newSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
    triggerToast("AI Provider configuration saved.");
  };

  const handleResetData = () => {
    if (window.confirm("Reset lead pipeline back to initial seed data?")) {
      const initialEnriched = INITIAL_COMPANIES.map(company => enrichCompanyDossier(company));
      setLeads(initialEnriched);
      saveLeadsToStorage(initialEnriched);
      triggerToast("Leads reset to default intelligence dataset.");
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    
    const headers = [
      "Company Name", "Industry", "Location", "Physical Address", "Company Size", "Score", "Tier",
      "Decision Maker Name", "Decision Maker Role", "Contact Email", "Phone Number", "Triggers", "Why Contact Reason", "Outreach Status"
    ];

    const rows = leads.map(l => [
      `"${l.companyName || ''}"`,
      `"${l.industry || ''}"`,
      `"${l.location || ''}"`,
      `"${(l.address || l.location || '').replace(/"/g, '""')}"`,
      `"${l.companySize || ''}"`,
      l.score || 0,
      `"${l.tier || ''}"`,
      `"${l.decisionMaker?.name || ''}"`,
      `"${l.decisionMaker?.title || ''}"`,
      `"${l.decisionMaker?.email || l.companyEmail || ''}"`,
      `"${l.decisionMaker?.phone || ''}"`,
      `"${(l.triggers || '').replace(/"/g, '""')}"`,
      `"${(l.whyContactReason || '').replace(/"/g, '""')}"`,
      `"${l.outreachApprovedStatus || 'Pending'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Synvora_Lead_Intelligence_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Exported lead intelligence CSV!");
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--accent-cyan)", color: "#0f172a", padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(6, 182, 212, 0.4)", zIndex: 9999, animation: "fadeIn 0.2s ease" }}>
          {notification}
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        settings={settings}
        onOpenSettings={() => setShowSettingsModal(true)}
        onResetData={handleResetData}
        onExportCSV={handleExportCSV}
        totalLeadsCount={leads.length}
      />

      {/* Main Content Area */}
      <main style={{ padding: "0 16px" }}>
        
        {/* Dynamic Query Bar */}
        <QueryHeader
          onSearch={handleSearch}
          isSearching={isSearching}
        />

        {/* Stats Summary Bar */}
        <LeadStatsOverview leads={leads} />

        {/* View Switcher: Table View or Kanban View */}
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

      </main>

      {/* Modals & Drawers */}
      {selectedLeadForScore && (
        <ScoreBreakdownModal
          company={selectedLeadForScore}
          onClose={() => setSelectedLeadForScore(null)}
          onOpenOutreach={(comp) => setSelectedLeadForOutreach(comp)}
        />
      )}

      {selectedLeadForDetail && (
        <LeadDetailModal
          company={selectedLeadForDetail}
          onClose={() => setSelectedLeadForDetail(null)}
          onOpenOutreach={(comp) => setSelectedLeadForOutreach(comp)}
        />
      )}

      {selectedLeadForOutreach && (
        <OutreachDrawer
          company={selectedLeadForOutreach}
          onClose={() => setSelectedLeadForOutreach(null)}
          onUpdateStatus={handleOutreachApprovalStatus}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSaveSettings={handleSaveSettings}
        />
      )}

    </div>
  );
}
