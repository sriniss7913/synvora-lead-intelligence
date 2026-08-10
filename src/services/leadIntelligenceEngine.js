import { scrapeAllSources } from "./apifyService";
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
  return { apifyToken: "", hunterApiKey: "" };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

/** Enrich a real company record with scoring and outreach copy */
export function enrichRealCompany(rawCompany) {
  const hasSocialMedia = !!(rawCompany.socialMedia?.facebook || rawCompany.socialMedia?.instagram || rawCompany.socialMedia?.linkedin);
  const sourceCount = rawCompany.sources?.length || 1;

  const company = {
    ...rawCompany,
    industry: rawCompany.category || rawCompany.industry || "General Business",
    companySize: rawCompany.companySize || "10-100 employees",
    techSignals: rawCompany.techSignals || [
      rawCompany.website ? "Has online presence" : "Limited digital footprint",
      rawCompany.rating ? `Google Rating: ${rawCompany.rating} ⭐ (${rawCompany.reviewsCount} reviews)` : "No Google reviews",
      hasSocialMedia ? "Active on social media" : "No social media found",
      sourceCount > 1 ? `Verified across ${sourceCount} data sources` : "Single source verified"
    ],
    expansionSignals: rawCompany.expansionSignals || [
      `Active business in ${rawCompany.location || "local market"}`,
      rawCompany.email ? "Has a discoverable email address" : "No public email found",
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
    whatsappStatus: rawCompany.phone && !rawCompany.phone.startsWith('0')
      ? "Mobile — Likely WhatsApp 💬"
      : "Landline / Unverified 📞"
  };
}

/**
 * Execute real lead discovery using ALL 3 Apify scrapers in parallel.
 * Merges and deduplicates results from Google Maps, Email Extractor, and Google Search.
 */
export async function executeLeadDiscovery(queryText, filters = {}, settings = {}) {
  const { apifyToken, hunterApiKey } = settings;

  if (!apifyToken) throw new Error("APIFY_TOKEN_MISSING");

  const city = filters.city || '';
  const count = parseInt(filters.leadCount || 10, 10);
  const coords = filters.coords || null;

  // 1. Run all 3 scrapers in parallel
  let rawResults;
  try {
    rawResults = await scrapeAllSources(queryText, city, count, apifyToken, coords);
  } catch (err) {
    if (err.message === 'APIFY_TOKEN_MISSING') throw err;
    throw new Error(`SCRAPE_FAILED: ${err.message}`);
  }

  // 2. Filter out companies already in history (dedup against IndexedDB)
  const freshResults = [];
  for (const r of rawResults) {
    const alreadySeen = await isInHistory(r.companyName, r.location || city);
    if (!alreadySeen) freshResults.push(r);
  }

  // 3. Hunter.io email enrichment as last resort if Email Extractor didn't find one
  const enrichedWithEmail = await Promise.all(
    freshResults.map(async (company) => {
      // Skip Hunter.io call if email already found by email extractor
      if (company.email) {
        return {
          ...company,
          companyEmail: company.email,
          decisionMaker: {
            name: "Business Owner",
            title: "Proprietor / Manager",
            email: company.email,
            phone: company.phone || '',
            linkedin: company.socialMedia?.linkedin || '',
            persona: "Business Owner"
          }
        };
      }

      // Try Hunter.io if key is set and company has a website
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
              linkedin: company.socialMedia?.linkedin || '',
              persona: "Business Owner / Decision Maker"
            }
          };
        }
      }

      return {
        ...company,
        companyEmail: '',
        decisionMaker: {
          name: "Business Owner",
          title: "Proprietor / Manager",
          email: '',
          phone: company.phone || '',
          linkedin: company.socialMedia?.linkedin || '',
          persona: "Business Owner"
        }
      };
    })
  );

  // 4. Score, enrich, and return
  return enrichedWithEmail.map((company, i) =>
    enrichRealCompany({ ...company, id: `lead-real-${Date.now()}-${i}` })
  );
}
