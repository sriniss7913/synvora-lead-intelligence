/**
 * Synvora 6-Factor AI Lead Scoring Engine
 * Evaluates business fit, pain points, digital opportunity, company size, decision maker, and triggers.
 */

export function calculateLeadScore(company) {
  let scoreBreakdown = {
    businessFit: { score: 0, max: 25, reason: "" },
    likelyPainPoint: { score: 0, max: 25, reason: "" },
    digitalOpportunity: { score: 0, max: 20, reason: "" },
    companySize: { score: 0, max: 10, reason: "" },
    decisionMakerIdentified: { score: 0, max: 10, reason: "" },
    recentTrigger: { score: 0, max: 10, reason: "" }
  };

  const industry = (company.industry || "").toLowerCase();
  const techSignals = company.techSignals || [];
  const expansionSignals = company.expansionSignals || [];
  const potentialProblems = company.potentialProblems || [];
  const sizeStr = (company.companySize || company.sizeCategory || "").toLowerCase();
  const dm = company.decisionMaker || {};
  const triggers = company.triggers || "";

  // 1. Business Fit (25 pts max)
  // Target industries: Manufacturing, Engineering, Healthcare, EdTech, SMEs, Logistics, Services
  if (industry.includes("manufacturing") || industry.includes("engineering")) {
    scoreBreakdown.businessFit.score = 25;
    scoreBreakdown.businessFit.reason = "High target match: Capital-intensive operations ripe for workflow automation & AI.";
  } else if (industry.includes("healthcare") || industry.includes("logistics") || industry.includes("education") || industry.includes("sme")) {
    scoreBreakdown.businessFit.score = 22;
    scoreBreakdown.businessFit.reason = "Strong target match: High volume client interactions & operational processes.";
  } else if (industry.includes("tech") || industry.includes("saas") || industry.includes("startup")) {
    scoreBreakdown.businessFit.score = 20;
    scoreBreakdown.businessFit.reason = "Good fit: High tech receptivity looking for AI speed multipliers.";
  } else {
    scoreBreakdown.businessFit.score = 14;
    scoreBreakdown.businessFit.reason = "Moderate business fit based on industry profile.";
  }

  // 2. Likely Pain Point (25 pts max)
  // Evaluates operational bottlenecks, manual processes, delayed RFQs, dispatch issues
  const totalProblems = potentialProblems.length;
  if (totalProblems >= 3 || triggers.toLowerCase().includes("manual") || triggers.toLowerCase().includes("bottleneck") || triggers.toLowerCase().includes("delay")) {
    scoreBreakdown.likelyPainPoint.score = 25;
    scoreBreakdown.likelyPainPoint.reason = "Severe pain point detected: Critical operational delay, manual quotation, or dispatch bottleneck.";
  } else if (totalProblems >= 2 || techSignals.some(s => s.toLowerCase().includes("manual") || s.toLowerCase().includes("legacy"))) {
    scoreBreakdown.likelyPainPoint.score = 20;
    scoreBreakdown.likelyPainPoint.reason = "Clear pain point identified: Multi-step manual handoffs and fragmented tools.";
  } else if (totalProblems >= 1) {
    scoreBreakdown.likelyPainPoint.score = 15;
    scoreBreakdown.likelyPainPoint.reason = "Moderate pain point detected from digital audit.";
  } else {
    scoreBreakdown.likelyPainPoint.score = 10;
    scoreBreakdown.likelyPainPoint.reason = "Potential standard operational friction.";
  }

  // 3. Digital / AI Opportunity (20 pts max)
  // Assesses digital maturity & AI gap
  const mat = (company.digitalMaturity || "").toLowerCase();
  if (mat.includes("low") || mat.includes("legacy") || techSignals.some(s => s.toLowerCase().includes("no automated") || s.toLowerCase().includes("excel"))) {
    scoreBreakdown.digitalOpportunity.score = 20;
    scoreBreakdown.digitalOpportunity.reason = "High AI opportunity: Operating on legacy ERP / manual sheets with immense ROI from Synvora AI.";
  } else if (mat.includes("moderate")) {
    scoreBreakdown.digitalOpportunity.score = 17;
    scoreBreakdown.digitalOpportunity.reason = "Strong opportunity: Core digital setup exists; ready for AI automation layer.";
  } else {
    scoreBreakdown.digitalOpportunity.score = 12;
    scoreBreakdown.digitalOpportunity.reason = "Moderate opportunity: Cloud tools active, ready for niche AI agents.";
  }

  // 4. Company Size (10 pts max)
  // Ideal size: 20 - 200 employees
  if (sizeStr.includes("20-50") || sizeStr.includes("51-200") || sizeStr.includes("85") || sizeStr.includes("140") || sizeStr.includes("60") || sizeStr.includes("75") || sizeStr.includes("110")) {
    scoreBreakdown.companySize.score = 10;
    scoreBreakdown.companySize.reason = "Sweet spot (20-200 emp): Fast decision-making with sufficient budget scale.";
  } else if (sizeStr.includes("201-500") || sizeStr.includes("10-19") || sizeStr.includes("45")) {
    scoreBreakdown.companySize.score = 8;
    scoreBreakdown.companySize.reason = "Good company size tier for Synvora engagements.";
  } else {
    scoreBreakdown.companySize.score = 5;
    scoreBreakdown.companySize.reason = "Acceptable company size.";
  }

  // 5. Decision-Maker Identified (10 pts max)
  // Key roles: Founder, Owner, CEO, COO, Operations Head, VP Tech, IT Manager
  const title = (dm.title || dm.persona || "").toLowerCase();
  if (dm.name && (title.includes("founder") || title.includes("owner") || title.includes("ceo") || title.includes("coo") || title.includes("managing director") || title.includes("operations") || title.includes("vp") || title.includes("head"))) {
    scoreBreakdown.decisionMakerIdentified.score = 10;
    scoreBreakdown.decisionMakerIdentified.reason = `Verified executive lead identified: ${dm.name} (${dm.title || 'Decision Maker'}).`;
  } else if (dm.name) {
    scoreBreakdown.decisionMakerIdentified.score = 7;
    scoreBreakdown.decisionMakerIdentified.reason = `Contact identified: ${dm.name}.`;
  } else {
    scoreBreakdown.decisionMakerIdentified.score = 2;
    scoreBreakdown.decisionMakerIdentified.reason = "Generic company contact only.";
  }

  // 6. Recent Business Trigger (10 pts max)
  // Expansion, new plant, contract win, hiring blitz
  if (triggers.length > 5 || expansionSignals.length > 0) {
    scoreBreakdown.recentTrigger.score = 10;
    scoreBreakdown.recentTrigger.reason = `Active growth trigger: "${triggers || expansionSignals[0]}".`;
  } else {
    scoreBreakdown.recentTrigger.score = 4;
    scoreBreakdown.recentTrigger.reason = "Standard baseline business activity.";
  }

  const totalScore = 
    scoreBreakdown.businessFit.score +
    scoreBreakdown.likelyPainPoint.score +
    scoreBreakdown.digitalOpportunity.score +
    scoreBreakdown.companySize.score +
    scoreBreakdown.decisionMakerIdentified.score +
    scoreBreakdown.recentTrigger.score;

  let tier = "Ignore";
  let tierBadgeClass = "badge-ignore";

  if (totalScore >= 80) {
    tier = "Hot lead";
    tierBadgeClass = "badge-hot";
  } else if (totalScore >= 60) {
    tier = "Warm lead";
    tierBadgeClass = "badge-warm";
  } else if (totalScore >= 40) {
    tier = "Nurture";
    tierBadgeClass = "badge-nurture";
  } else {
    tier = "Ignore";
    tierBadgeClass = "badge-ignore";
  }

  return {
    totalScore,
    tier,
    tierBadgeClass,
    breakdown: scoreBreakdown,
    whyContactReason: `Synvora should contact ${company.companyName} because they are ${triggers.toLowerCase().includes('expand') ? 'rapidly expanding' : 'facing operational bottlenecks'} with ${potentialProblems[0] || 'manual workflow challenges'}, making their decision-maker (${dm.name || 'Executive team'}) highly receptive to Synvora's AI automation.`
  };
}
