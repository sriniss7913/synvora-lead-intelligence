import { INITIAL_COMPANIES } from "../data/sampleCompanies";
import { generateHeuristicCompanyIntelligence } from "./heuristicEngine";
import { calculateLeadScore } from "./scoreCalculator";
import { generatePersonalizedOutreach } from "./outreachGenerator";
import { callAIProvider } from "./aiProviderService";

const STORAGE_KEY = "synvora_lead_intelligence_leads_v3";
const SETTINGS_KEY = "synvora_lead_intelligence_settings_v1";

export function loadStoredLeads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load stored leads:", e);
  }
  // Initialize with seed data enriched with score & outreach
  const enrichedSeeds = INITIAL_COMPANIES.map(company => enrichCompanyDossier(company));
  saveLeadsToStorage(enrichedSeeds);
  return enrichedSeeds;
}

export function saveLeadsToStorage(leads) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error("Failed to save leads to storage:", e);
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    providerId: "heuristic",
    apiKey: ""
  };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

export function enrichCompanyDossier(company) {
  const scoreData = calculateLeadScore(company);
  const outreach = generatePersonalizedOutreach(company, scoreData);

  return {
    ...company,
    score: scoreData.totalScore,
    tier: scoreData.tier,
    tierBadgeClass: scoreData.tierBadgeClass,
    scoreBreakdown: scoreData.breakdown,
    whyContactReason: scoreData.whyContactReason,
    outreach: outreach,
    outreachApprovedStatus: company.outreachApprovedStatus || "Pending Review" // Pending Review, Approved, Rejected, Edited
  };
}

/**
 * Execute dynamic discovery for any user query across cities and industries
 */
export async function executeLeadDiscovery(queryText, filters = {}, settings = {}) {
  const qLower = (queryText || "").toLowerCase();
  
  // Extract keywords
  let targetCity = filters.city && filters.city !== "All Locations" ? filters.city : "Chennai";
  let targetIndustry = filters.industry && filters.industry !== "All Industries" ? filters.industry : "Manufacturing";
  let targetSize = filters.companySize && filters.companySize !== "Any Size" ? filters.companySize : "20-200 employees";

  if (qLower.includes("mumbai")) targetCity = "Mumbai";
  else if (qLower.includes("bangalore") || qLower.includes("bengaluru")) targetCity = "Bangalore";
  else if (qLower.includes("hyderabad")) targetCity = "Hyderabad";
  else if (qLower.includes("pune")) targetCity = "Pune";
  else if (qLower.includes("delhi") || qLower.includes("gurgaon") || qLower.includes("noida")) targetCity = "Delhi NCR";
  else if (qLower.includes("coimbatore")) targetCity = "Coimbatore";

  if (qLower.includes("health") || qLower.includes("clinic") || qLower.includes("pharma")) targetIndustry = "Healthcare & Pharma";
  else if (qLower.includes("eng") || qLower.includes("epc")) targetIndustry = "Engineering";
  else if (qLower.includes("edu") || qLower.includes("school") || qLower.includes("bootcamp")) targetIndustry = "Education & EdTech";
  else if (qLower.includes("logis") || qLower.includes("truck") || qLower.includes("warehous")) targetIndustry = "Logistics";
  else if (qLower.includes("startup") || qLower.includes("saas")) targetIndustry = "Technology & Startups";

  const requestedCount = parseInt(filters.leadCount || 10, 10);
  const companyNames = generateDynamicCompanyNames(targetIndustry, targetCity, requestedCount);

  // Generate requested number of dynamic realistic companies matching query
  const generatedCompanies = [];

  for (let i = 0; i < companyNames.length; i++) {
    const compName = companyNames[i];
    
    // Heuristic base dossier
    let rawCompany = generateHeuristicCompanyIntelligence(compName, targetIndustry, targetCity, targetSize);

    // If external AI provider is enabled and key provided, call AI provider for deep signal enrichment
    if (settings.providerId && settings.providerId !== "heuristic" && settings.apiKey) {
      try {
        const aiPrompt = `Analyze potential business intelligence for "${compName}" (${targetIndustry} in ${targetCity}, ${targetSize}).
Provide a JSON object with fields:
- techSignals (array of 3 strings)
- expansionSignals (array of 2 strings)
- potentialProblems (array of 2 strings)
- triggers (string)
Respond ONLY with valid JSON.`;

        const aiResponseText = await callAIProvider(settings.providerId, settings.apiKey, aiPrompt);
        const match = aiResponseText.match(/\{[\s\S]*\}/);
        if (match) {
          const aiData = JSON.parse(match[0]);
          if (aiData.techSignals) rawCompany.techSignals = aiData.techSignals;
          if (aiData.expansionSignals) rawCompany.expansionSignals = aiData.expansionSignals;
          if (aiData.potentialProblems) rawCompany.potentialProblems = aiData.potentialProblems;
          if (aiData.triggers) rawCompany.triggers = aiData.triggers;
        }
      } catch (err) {
        console.warn("AI Provider call fallback to Heuristic:", err);
      }
    }

    const enriched = enrichCompanyDossier({
      ...rawCompany,
      id: `lead-dyn-${Date.now()}-${i}`
    });
    generatedCompanies.push(enriched);
  }

  return generatedCompanies;
}

function generateDynamicCompanyNames(industry, city, count) {
  const ind = (industry || "").toLowerCase();
  const cityStem = (city || "Chennai").split(" ")[0];

  let prefixes = ["TechnoCraft", "Titanium", "Apex", "Precision", "Matrix", "Omni", "Vanguard", "Genesis", "Synergy", "Vertex", "Astra", "Zenith", "Quantum", "Nexus", "Pinnacle"];
  let roots = ["Industrial", "Automation", "Engineering", "Dynamics", "Systems", "Technologies", "Solutions", "Components", "Works", "Enterprise"];
  let suffixes = ["Pvt Ltd", "Corporation", "India Ltd", "Global", "Tech Labs"];

  if (ind.includes("health")) {
    prefixes = ["CarePlus", "Zenith", "MedVanguard", "OmniCare", "BioHealth", "ApexMed", "PulseCare", "Vitalis", "Apollo", "Lifeline", "DiagTech"];
    roots = ["Diagnostics", "Healthcare", "Laboratories", "Medical Systems", "Pharma Tech", "Life Sciences", "Health Network"];
  } else if (ind.includes("edu")) {
    prefixes = ["ProSkill", "FutureTech", "EduVantage", "OmniLearn", "Academia", "SkillEdge", "TalentCore", "ApexLearn", "MindCraft"];
    roots = ["Learning", "Institute", "Academics", "EdTech Solutions", "Skill Labs", "Education Global"];
  } else if (ind.includes("logis")) {
    prefixes = ["RapidFreight", "TransExpress", "ColdChain", "MetroWay", "LogiTrans", "OmniRoute", "ApexLogistics", "Velocity", "SwiftCargo"];
    roots = ["Supply Chain", "Logistics", "Freight", "Express", "Transport Solutions", "Warehousing"];
  }

  const names = new Set();
  let attempt = 0;
  while (names.size < count && attempt < 200) {
    attempt++;
    const p = prefixes[attempt % prefixes.length];
    const r = roots[(attempt * 3) % roots.length];
    const s = suffixes[attempt % suffixes.length];
    const name = `${p} ${r} (${cityStem}) ${s}`;
    names.add(name);
  }

  return Array.from(names);
}
