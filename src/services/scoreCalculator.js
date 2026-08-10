/**
 * Synvora Real-Signal Lead Scoring Engine
 * Scores leads based on ACTUAL data returned by Apify Google Maps scraper.
 * No fake fields — only signals we genuinely have from real company data.
 *
 * 100-point scale across 5 real factors:
 *   1. Industry Fit        (25 pts) — category from Google Maps
 *   2. Business Activity   (25 pts) — review volume = market presence
 *   3. Pain / Opportunity  (20 pts) — rating score = gap Synvora can fill
 *   4. Reachability        (20 pts) — phone/email/website/social availability
 *   5. Data Confidence     (10 pts) — verified across how many sources
 */

// Industries Synvora targets for AI automation (highest priority first)
const INDUSTRY_TIERS = {
  hot: [
    'elevator', 'lift', 'escalator', 'hvac', 'fire', 'security system', 'cctv', 'atm',
    'vending', 'facility', 'building automation', 'electromechanical'
  ],
  warm: [
    'manufacturing', 'engineering', 'industrial', 'fabricat', 'automobile', 'automotive',
    'pharma', 'chemical', 'packaging', 'printing', 'metal', 'steel', 'foundry',
    'logistics', 'transport', 'warehouse', 'supply chain', 'courier'
  ],
  nurture: [
    'construction', 'real estate', 'builder', 'developer', 'contractor',
    'healthcare', 'hospital', 'clinic', 'diagnostic', 'education', 'school', 'college',
    'retail', 'wholesale', 'trading', 'distribution', 'import', 'export'
  ]
};

function getIndustryFitScore(category = '', industry = '') {
  const combined = `${category} ${industry}`.toLowerCase();

  for (const keyword of INDUSTRY_TIERS.hot) {
    if (combined.includes(keyword)) {
      return { score: 25, reason: `🎯 Perfect target: "${category}" directly aligns with Synvora's core automation solutions.` };
    }
  }
  for (const keyword of INDUSTRY_TIERS.warm) {
    if (combined.includes(keyword)) {
      return { score: 20, reason: `✅ Strong fit: "${category}" — high operational complexity, ideal for AI automation.` };
    }
  }
  for (const keyword of INDUSTRY_TIERS.nurture) {
    if (combined.includes(keyword)) {
      return { score: 14, reason: `🔄 Moderate fit: "${category}" — standard business processes with automation potential.` };
    }
  }
  return { score: 8, reason: `ℹ️ General business — requires qualification to assess automation fit.` };
}

function getBusinessActivityScore(reviewsCount = 0, hasWebsite = false) {
  // Review volume = proxy for business size, market presence, and customer base
  if (reviewsCount >= 200) return { score: 25, reason: `🏆 Highly active: ${reviewsCount} reviews — large customer base, established business with budget.` };
  if (reviewsCount >= 100) return { score: 22, reason: `💪 Very active: ${reviewsCount} reviews — established SME, likely has operational scale needs.` };
  if (reviewsCount >= 50)  return { score: 18, reason: `📈 Active business: ${reviewsCount} reviews — growing customer base, right size for Synvora.` };
  if (reviewsCount >= 20)  return { score: 14, reason: `🔧 Growing business: ${reviewsCount} reviews — early stage, some traction.` };
  if (reviewsCount >= 5)   return { score: 10, reason: `🌱 Early stage: ${reviewsCount} reviews — low Google presence, may need digital nurturing first.` };
  if (hasWebsite)          return { score: 12, reason: `🌐 Has a website but no Google reviews — active business operating offline/traditionally.` };
  return { score: 5, reason: `❓ No reviews, no website — minimal verifiable activity, lower priority.` };
}

function getPainOpportunityScore(rating, reviewsCount) {
  // No rating = no Google Maps optimization = digital gap Synvora can exploit
  if (!rating && !reviewsCount) {
    return { score: 18, reason: `🚀 Not on Google Maps actively — major digital gap, high opportunity for Synvora digital setup.` };
  }
  if (!rating) {
    return { score: 16, reason: `📍 Has reviews but no rating — irregular online management, weak digital presence.` };
  }

  // Low rating = unhappy customers = clear pain point, high urgency
  if (rating < 3.0) return { score: 20, reason: `🔴 Low rating (${rating}⭐) — unhappy customers signal operational issues Synvora can solve urgently.` };
  if (rating < 3.5) return { score: 18, reason: `🟠 Below-average rating (${rating}⭐) — customer experience gap, strong pain point.` };
  if (rating < 4.0) return { score: 14, reason: `🟡 Average rating (${rating}⭐) — room for improvement, moderate urgency.` };
  if (rating < 4.5) return { score: 10, reason: `🟢 Good rating (${rating}⭐) — reasonably well-run, lower urgency but open to growth tools.` };
  return { score: 7, reason: `✨ Excellent rating (${rating}⭐) — well-managed business, pitch as scale & efficiency tools.` };
}

function getReachabilityScore(phone, email, website, socialMedia) {
  let score = 0;
  const details = [];

  if (phone) { score += 8; details.push('📞 phone'); }
  if (email) { score += 6; details.push('📧 email'); }
  if (website) { score += 4; details.push('🌐 website'); }
  if (socialMedia?.facebook || socialMedia?.instagram || socialMedia?.linkedin) {
    score += 2;
    details.push('📱 social media');
  }

  const maxScore = 20;
  const actualScore = Math.min(score, maxScore);

  if (details.length === 0) return { score: 0, reason: `❌ No contact info found — cannot reach this lead.` };
  return { score: actualScore, reason: `✅ Reachable via: ${details.join(', ')}.` };
}

function getDataConfidenceScore(sources = []) {
  const count = Array.isArray(sources) ? sources.length : 1;
  if (count >= 3) return { score: 10, reason: `🔒 Verified across 3 data sources — highest confidence in data accuracy.` };
  if (count === 2) return { score: 7, reason: `✅ Cross-verified across 2 data sources.` };
  return { score: 4, reason: `ℹ️ Single source data — lower confidence, needs manual verification.` };
}

export function calculateLeadScore(company) {
  const industryFit    = getIndustryFitScore(company.category, company.industry);
  const bizActivity    = getBusinessActivityScore(company.reviewsCount, !!company.website);
  const painOppty      = getPainOpportunityScore(company.rating, company.reviewsCount);
  const reachability   = getReachabilityScore(company.phone, company.email || company.companyEmail, company.website, company.socialMedia);
  const dataConfidence = getDataConfidenceScore(company.sources);

  const totalScore =
    industryFit.score +
    bizActivity.score +
    painOppty.score +
    reachability.score +
    dataConfidence.score;

  let tier, tierBadgeClass;
  if      (totalScore >= 75) { tier = 'Hot Lead';   tierBadgeClass = 'badge-hot'; }
  else if (totalScore >= 55) { tier = 'Warm Lead';  tierBadgeClass = 'badge-warm'; }
  else if (totalScore >= 35) { tier = 'Nurture';    tierBadgeClass = 'badge-nurture'; }
  else                       { tier = 'Ignore';     tierBadgeClass = 'badge-ignore'; }

  // Build a dynamic "why contact" reason using actual data
  const contactReasons = [];
  if (company.rating && company.rating < 3.5) contactReasons.push(`${company.rating}⭐ rating signals customer pain`);
  if (!company.rating) contactReasons.push('no Google Maps optimization yet');
  if (company.reviewsCount > 50) contactReasons.push(`${company.reviewsCount} reviews = established business`);
  if (company.phone && company.email) contactReasons.push('multiple contact channels available');
  if (company.sources?.length > 1) contactReasons.push(`verified across ${company.sources.length} sources`);

  const whyContactReason = contactReasons.length > 0
    ? `${company.companyName} is a strong Synvora prospect because: ${contactReasons.join('; ')}.`
    : `${company.companyName} matches Synvora's target profile in the ${company.category || 'business'} sector in ${company.location || 'the region'}.`;

  return {
    totalScore,
    tier,
    tierBadgeClass,
    breakdown: {
      industryFit:      { score: industryFit.score,    max: 25, reason: industryFit.reason },
      businessActivity: { score: bizActivity.score,    max: 25, reason: bizActivity.reason },
      painOpportunity:  { score: painOppty.score,      max: 20, reason: painOppty.reason },
      reachability:     { score: reachability.score,   max: 20, reason: reachability.reason },
      dataConfidence:   { score: dataConfidence.score, max: 10, reason: dataConfidence.reason }
    },
    whyContactReason
  };
}
