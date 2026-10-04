/**
 * Google Sheets / Excel Webhook Sync Service
 * 
 * Supports syncing discovered leads and outreach activity directly to:
 * - Google Sheets (via Google Apps Script Web App URL, Make.com, or Zapier Webhook)
 * - Microsoft Excel / Power Automate webhook
 * 
 * Flow:
 * 1. User pastes their Google Sheets Web App URL (or webhook URL) into Settings.
 * 2. When new leads are discovered, `syncLeadsToGoogleSheet` sends new leads to be appended/updated.
 * 3. When outreach is prepared, sent, or approved, `syncOutreachUpdateToGoogleSheet` updates the lead row.
 */

const SETTINGS_KEY = "synvora_lead_intelligence_settings_v2";

export function getGoogleSheetsWebhookUrl() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.googleSheetWebhookUrl || "";
    }
  } catch (e) {
    console.error("Error reading googleSheetWebhookUrl:", e);
  }
  return "";
}

/**
 * Format a lead object into clean flat sheet columns
 */
export function formatLeadForSheet(lead, eventType = "LEAD_DISCOVERED") {
  return {
    eventType, // "LEAD_DISCOVERED" | "OUTREACH_UPDATED" | "STATUS_CHANGED"
    timestamp: new Date().toISOString(),
    id: lead.id || "",
    companyName: lead.companyName || "",
    category: lead.category || lead.industry || "",
    location: lead.location || "",
    address: lead.address || "",
    phone: lead.phone || lead.decisionMaker?.phone || "",
    email: lead.companyEmail || lead.email || lead.decisionMaker?.email || "",
    website: lead.website || "",
    rating: lead.rating || "",
    reviewsCount: lead.reviewsCount || 0,
    googleMapsUrl: lead.googleMapsUrl || "",
    decisionMakerName: lead.decisionMaker?.name || "",
    decisionMakerTitle: lead.decisionMaker?.title || "",
    score: lead.score || 0,
    tier: lead.tier || "Standard",
    outreachStatus: lead.outreachStatus || lead.status || "New",
    outreachApprovedStatus: lead.outreachApprovedStatus || "Pending Review",
    dataSource: lead.dataSource || (lead.sources ? lead.sources.join(", ") : ""),
    notes: lead.notes || "",
    // Outreach content if present
    emailSubject: lead.outreach?.email?.subject || "",
    emailBody: lead.outreach?.email?.body || "",
    whatsappMessage: lead.outreach?.whatsapp || "",
    callScript: lead.outreach?.callScript || "",
    aiReasoning: lead.outreach?.reasoning || lead.whyContactReason || ""
  };
}

/**
 * Send payload to Google Sheets webhook
 */
async function sendToWebhook(webhookUrl, payload) {
  if (!webhookUrl || !webhookUrl.startsWith("http")) return false;

  try {
    // Send as POST JSON. Mode 'no-cors' fallback handled for Google Apps Script redirects.
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (err) {
    // Google Apps Script Web Apps often trigger CORS on 302 redirects even if the row was saved.
    // In such cases, attempt sendBeacon or text/plain to avoid CORS preflight blocks.
    try {
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (fallbackErr) {
      console.warn("Google Sheet webhook sync failed:", fallbackErr.message);
      return false;
    }
  }
}

/**
 * Sync batch of newly discovered leads to Google Sheet
 */
export async function syncLeadsToGoogleSheet(leads, webhookUrl = null) {
  const url = webhookUrl || getGoogleSheetsWebhookUrl();
  if (!url || !leads || leads.length === 0) return false;

  const rows = leads.map(l => formatLeadForSheet(l, "LEAD_DISCOVERED"));
  return sendToWebhook(url, {
    action: "sync_leads",
    leads: rows
  });
}

/**
 * Sync single lead outreach/status update to Google Sheet
 */
export async function syncOutreachUpdateToGoogleSheet(lead, webhookUrl = null) {
  const url = webhookUrl || getGoogleSheetsWebhookUrl();
  if (!url || !lead) return false;

  const row = formatLeadForSheet(lead, "OUTREACH_UPDATED");
  return sendToWebhook(url, {
    action: "update_lead",
    lead: row
  });
}

/**
 * Generate a ready-to-paste Google Apps Script snippet for users
 */
export function getGoogleAppsScriptTemplate() {
  return `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // Create headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp", "Company Name", "Category", "Location", "Phone", 
      "Email", "Website", "Rating", "Reviews", "Decision Maker", 
      "Score", "Tier", "Outreach Status", "Email Subject", "WhatsApp Message", "Google Maps URL"
    ]);
  }
  
  if (data.action === "sync_leads" && data.leads) {
    data.leads.forEach(function(lead) {
      // Check if lead already exists by Company Name or Phone
      var existingRow = findRowByCompanyName(sheet, lead.companyName);
      var rowData = [
        lead.timestamp, lead.companyName, lead.category, lead.location, lead.phone,
        lead.email, lead.website, lead.rating, lead.reviewsCount, lead.decisionMakerName,
        lead.score, lead.tier, lead.outreachStatus, lead.emailSubject, lead.whatsappMessage, lead.googleMapsUrl
      ];
      
      if (existingRow > 0) {
        sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
    });
  } else if (data.action === "update_lead" && data.lead) {
    var lead = data.lead;
    var existingRow = findRowByCompanyName(sheet, lead.companyName);
    var rowData = [
      lead.timestamp, lead.companyName, lead.category, lead.location, lead.phone,
      lead.email, lead.website, lead.rating, lead.reviewsCount, lead.decisionMakerName,
      lead.score, lead.tier, lead.outreachStatus, lead.emailSubject, lead.whatsappMessage, lead.googleMapsUrl
    ];
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function findRowByCompanyName(sheet, name) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().toLowerCase() === name.toString().toLowerCase()) {
      return i + 1;
    }
  }
  return -1;
}`;
}
