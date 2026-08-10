import { scrapeGoogleMapsLeads } from "./apifyService";
import { findCompanyEmail } from "./hunterService";
import { calculateLeadScore } from "./scoreCalculator";
import { generatePersonalizedOutreach } from "./outreachGenerator";
import { isInHistory } from "./historyDB";

const SETTINGS_KEY = "synvora_lead_intelligence_settings_v2";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    providerId: "heuristic",
    apiKey: "",
    apifyToken: "",
    hunterApiKey: ""
  };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

/** Enrich a real company record with scoring and outreach copy */
export function enrichRealCompany(rawCompany) {
  // Map real data into the shape scoreCalculator expects
  const company = {
    ...rawCompany,
    industry: rawCompany.category || rawCompany.industry || "General Business",
    companySize: rawCompany.companySize || "10-100 employees",
    techSignals: rawCompany.techSignals || [
      rawCompany.website ? "Has online presence" : "Limited digital footprint",
      rawCompany.rating ? `Google Rating: ${rawCompany.rating} ⭐ (${rawCompany.reviewsCount} reviews)` : "No Google reviews",
      "Operational business with public listings"
    ],
    expansionSignals: rawCompany.expansionSignals || [
      `Active business in ${rawCompany.location || "local market"}`,
      "Listed on Google Maps with contact details"
    ],
    potentialProblems: rawCompany.potentialProblems || [
      "Manual customer enquiry handling",
      "No automated digital lead capture system"
    ],
    triggers: rawCompany.triggers || `Active ${rawCompany.category || "business"} in ${rawCompany.location} — potential for digital transformation`
  };

  const scoreData = calculateLeadScore(company);
  const outreach = generatePersonalizedOutreach(company, scoreData);

  return {
    ...company,
    score: scoreData.totalScore,
    tier: scoreData.tier,
    tierBadgeClass: scoreData.tierBadgeClass,
    scoreBreakdown: scoreData.breakdown,
    whyContactReason: scoreData.whyContactReason,
    outreach,
    outreachApprovedStatus: "Pending Review",
    discoveredAt: new Date().toISOString(),
    hasWhatsapp: !!rawCompany.phone && !rawCompany.phone.startsWith('0'),
    whatsappStatus: rawCompany.phone && !rawCompany.phone.startsWith('0') ? "Verified WhatsApp 💬" : "Landline / Unverified 📞"
  };
}

/**
 * Execute real lead discovery using Apify Google Maps Scraper.
 * Falls back with clear error if API token not set.
 */
export async function executeLeadDiscovery(queryText, filters = {}, settings = {}, onProgress = null) {
  const { apifyToken, hunterApiKey } = settings;

  // Require Apify token
  if (!apifyToken) {
    throw new Error("APIFY_TOKEN_MISSING");
  }

  const city = filters.city && filters.city !== "All Locations" ? filters.city : "";
  const count = parseInt(filters.leadCount || 10, 10);

  if (onProgress) onProgress("🔍 Searching Google Maps via Apify...", 10);

  // 1. Scrape real businesses from Google Maps
  let rawResults;
  try {
    rawResults = await scrapeGoogleMapsLeads(queryText, city, count, apifyToken);
  } catch (err) {
    if (err.message === 'APIFY_TOKEN_MISSING') throw err;
    throw new Error(`SCRAPE_FAILED: ${err.message}`);
  }

  if (onProgress) onProgress(`✅ Found ${rawResults.length} real businesses. Filtering history...`, 40);

  // 2. Filter out companies already in IndexedDB history
  const freshResults = [];
  for (const r of rawResults) {
    const alreadySeen = await isInHistory(r.companyName, r.location || city);
    if (!alreadySeen) freshResults.push(r);
  }

  if (onProgress) onProgress(`🔗 Enriching ${freshResults.length} new leads with email data...`, 60);

  // 3. Hunter.io email enrichment (if key provided, in parallel batches)
  const enrichedWithEmail = await Promise.all(
    freshResults.map(async (company) => {
      if (hunterApiKey && company.website) {
        const emailData = await findCompanyEmail(company.website, hunterApiKey);
        if (emailData) {
          return {
            ...company,
            companyEmail: emailData.email,
            decisionMaker: {
              name: [emailData.firstName, emailData.lastName].filter(Boolean).join(' ') || "Contact Person",
              title: emailData.position || "Business Owner",
              email: emailData.email,
              phone: company.phone || '',
              linkedin: '',
              persona: "Business Owner / Decision Maker"
            }
          };
        }
      }
      return {
        ...company,
        companyEmail: company.website ? `info@${company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}` : '',
        decisionMaker: {
          name: "Business Owner",
          title: "Proprietor / Manager",
          email: '',
          phone: company.phone || '',
          linkedin: '',
          persona: "Business Owner"
        }
      };
    })
  );

  if (onProgress) onProgress("🧠 Scoring and personalizing outreach...", 80);

  // 4. Score and enrich each lead
  const finalLeads = enrichedWithEmail.map((company, i) =>
    enrichRealCompany({
      ...company,
      id: `lead-real-${Date.now()}-${i}`
    })
  );

  if (onProgress) onProgress(`🎉 ${finalLeads.length} fresh leads ready!`, 100);

  return finalLeads;
}
