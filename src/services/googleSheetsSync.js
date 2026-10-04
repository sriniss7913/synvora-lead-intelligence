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
    phone: lead.phone ? String(lead.phone).trim() : (lead.decisionMaker?.phone ? String(lead.decisionMaker.phone).trim() : ""),
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

  const jsonString = JSON.stringify(payload);

  // Google Apps Script requires text/plain body without custom headers to avoid CORS OPTIONS failure
  try {
    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain"
      },
      body: jsonString
    });
    return true;
  } catch (err) {
    console.warn("Google Sheet webhook sync failed:", err.message);
    return false;
  }
}

/**
 * Fetch all leads stored in Google Sheet via doGet
 */
export async function fetchLeadsFromGoogleSheet(webhookUrl = null) {
  const url = webhookUrl || getGoogleSheetsWebhookUrl();
  if (!url || !url.startsWith("http")) return null;

  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return null;
    const leads = await res.json();
    return Array.isArray(leads) ? leads : null;
  } catch (e) {
    console.warn("Could not read leads from Google Sheet via doGet:", e.message);
    return null;
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
  return `// ─── Synvora Lead Intelligence: Google Sheets Sync Backend ───
// Instructions:
// 1. In your Google Sheet, go to Extensions > Apps Script
// 2. Paste this entire code into Code.gs
// 3. Click Deploy > New deployment > Select 'Web app'
// 4. Set 'Execute as': 'Me'
// 5. Set 'Who has access': 'Anyone'  <-- CRITICAL!
// 6. Click Deploy, copy the Web App URL, and paste it into Synvora Settings!

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var leads = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[1]) continue; // Skip empty rows without company name
    leads.push({
      id: "sheet-lead-" + i,
      timestamp: row[0] || "",
      companyName: row[1] || "",
      category: row[2] || "",
      location: row[3] || "",
      phone: row[4] ? String(row[4]) : "",
      email: row[5] || "",
      companyEmail: row[5] || "",
      website: row[6] || "",
      rating: row[7] || null,
      reviewsCount: row[8] || 0,
      decisionMaker: {
        name: row[9] || "Business Owner",
        email: row[5] || "",
        phone: row[4] ? String(row[4]) : ""
      },
      score: row[10] || 70,
      tier: row[11] || "Warm lead",
      outreachStatus: row[12] || "New",
      outreachApprovedStatus: row[12] === "Sent" ? "Approved" : "Pending Review",
      outreach: {
        email: { subject: row[13] || "", body: "" },
        whatsapp: row[14] || ""
      },
      googleMapsUrl: row[15] || "",
      dataSource: "📊 Google Sheets Database",
      discoveredAt: row[0] || new Date().toISOString()
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify(leads))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rawContents = e.postData.contents;
  var data = {};
  try {
    data = JSON.parse(rawContents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
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
      var existingRow = findRowByCompanyName(sheet, lead.companyName);
      var rawPhone = lead.phone ? String(lead.phone).trim() : "";
      // Prefix with apostrophe if it starts with '+' to prevent Excel/Sheets formula parse error
      var safePhone = (rawPhone.indexOf("+") === 0) ? ("'" + rawPhone) : rawPhone;

      var rowData = [
        lead.timestamp || new Date().toISOString(),
        lead.companyName || "",
        lead.category || "",
        lead.location || "",
        safePhone,
        lead.email || lead.companyEmail || "",
        lead.website || "",
        lead.rating || "",
        lead.reviewsCount || 0,
        lead.decisionMakerName || "",
        lead.score || 0,
        lead.tier || "",
        lead.outreachStatus || "New",
        lead.emailSubject || "",
        lead.whatsappMessage || "",
        lead.googleMapsUrl || ""
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
    var rawPhone = lead.phone ? String(lead.phone).trim() : "";
    var safePhone = (rawPhone.indexOf("+") === 0) ? ("'" + rawPhone) : rawPhone;

    var rowData = [
      lead.timestamp || new Date().toISOString(),
      lead.companyName || "",
      lead.category || "",
      lead.location || "",
      safePhone,
      lead.email || lead.companyEmail || "",
      lead.website || "",
      lead.rating || "",
      lead.reviewsCount || 0,
      lead.decisionMakerName || "",
      lead.score || 0,
      lead.tier || "",
      lead.outreachStatus || "New",
      lead.emailSubject || "",
      lead.whatsappMessage || "",
      lead.googleMapsUrl || ""
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
