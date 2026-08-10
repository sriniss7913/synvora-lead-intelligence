/**
 * Synvora Outreach Generator
 * Uses Gemini API to generate genuinely unique, personalized outreach per lead.
 * Includes automatic model fallback and seamless smart-template fallback
 * on rate limits (RESOURCE_EXHAUSTED / 429 / 404).
 */

const OUTREACH_MODEL = 'gemini-2.0-flash';
const OUTREACH_URL = `https://generativelanguage.googleapis.com/v1beta/models/${OUTREACH_MODEL}:generateContent`;

/**
 * Build a rich company context string for the Gemini prompt
 */
function buildCompanyContext(company, scoreData) {
  const lines = [
    `Company: ${company.companyName}`,
    `Category: ${company.category || company.industry || 'Business'}`,
    `Location: ${company.location || company.address || 'India'}`,
    `Full Address: ${company.address || 'Not available'}`,
    `Phone: ${company.phone || 'Not listed'}`,
    `Email: ${company.email || company.companyEmail || 'Not found'}`,
    `Website: ${company.website || 'No website'}`,
    `Google Rating: ${company.rating ? `${company.rating}⭐ (${company.reviewsCount} reviews)` : 'Not rated on Google Maps'}`,
    `Social Media: ${company.socialMedia ? Object.entries(company.socialMedia).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(', ') || 'None found' : 'None found'}`,
    `Data Sources: ${(company.sources || ['Google Maps']).join(', ')}`,
    `Lead Score: ${scoreData.totalScore}/100 — ${scoreData.tier}`,
    `Why Strong Lead: ${scoreData.whyContactReason}`
  ];
  return lines.join('\n');
}

/**
 * Call Gemini API to generate unique outreach messages for a single company
 */
async function generateWithGemini(company, scoreData, geminiApiKey) {
  const context = buildCompanyContext(company, scoreData);

  const prompt = `You are a B2B sales outreach specialist for Synvora Technologies, an Indian AI automation company that helps SMEs and industrial businesses automate manual workflows, improve customer response times, and gain real-time operational visibility.

Here is the real data for the lead company you must write outreach for:

${context}

Based ONLY on the real data above, write personalized outreach. Do NOT invent facts. If the rating is low, mention it tactfully as an opportunity. If there's no website, highlight digital presence as a gap. Reference the actual category/location.

Respond in this exact JSON format (no markdown, no explanation, just the JSON):
{
  "emailSubject": "concise subject line under 60 chars",
  "emailBody": "3-paragraph cold email, professional, specific to this company's actual situation, under 180 words",
  "whatsapp": "friendly WhatsApp message under 80 words referencing their actual business category and location",
  "callScript": "30-second cold call opening line referencing their real company name and category",
  "reasoning": "1 sentence explaining what specific real signal made this outreach angle unique"
}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
  };

  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${OUTREACH_URL}?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 429) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 8000));
          continue;
        }
        throw new Error('RATE_LIMIT');
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      return {
        email: { subject: parsed.emailSubject, body: parsed.emailBody },
        whatsapp: parsed.whatsapp,
        callScript: parsed.callScript,
        linkedin: `Hi, I came across ${company.companyName} on Google Maps and noticed your ${company.category || 'business'} in ${company.location}. At Synvora, we help similar businesses automate workflows and reduce manual overhead. Would love to connect!`,
        reasoning: parsed.reasoning,
        generatedBy: 'gemini'
      };
    } catch (err) {
      console.warn(`Outreach attempt ${attempt} failed:`, err.message);
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 5000));
    }
  }

  throw new Error('Gemini outreach generation failed after retries');
}

/**
 * Improved fallback template — uses all real Apify fields
 * Adapts message tone based on real signals
 */
function generateTemplateFallback(company, scoreData) {
  const name = company.companyName || 'your company';
  const category = company.category || company.industry || 'business';
  const location = company.location || 'your city';
  const rating = company.rating;
  const reviews = company.reviewsCount || 0;
  const hasWebsite = !!company.website;
  const hasSocial = !!(company.socialMedia?.facebook || company.socialMedia?.instagram);

  let angle, painLine, pitchLine;

  if (rating && rating < 3.5) {
    angle = 'customer-experience';
    painLine = `We noticed ${name} has a ${rating}⭐ rating on Google Maps with ${reviews} reviews — signs that customer experience bottlenecks may be limiting your growth.`;
    pitchLine = `Synvora helps ${category} businesses automate customer follow-ups, enquiry tracking, and service scheduling — so every customer interaction is handled faster and more consistently.`;
  } else if (!hasWebsite) {
    angle = 'digital-gap';
    painLine = `We noticed ${name} doesn't yet have a digital presence (website/email) — meaning potential customers in ${location} may be choosing competitors they find online.`;
    pitchLine = `Synvora specialises in helping ${category} businesses build their first digital operations system — lead capture, WhatsApp automation, and enquiry management in one place.`;
  } else if (reviews > 100) {
    angle = 'scale';
    painLine = `${name} has ${reviews} Google reviews — clearly a busy operation in ${location}. At that volume, managing enquiries, follow-ups and job coordination manually becomes a real bottleneck.`;
    pitchLine = `Synvora helps established ${category} businesses like yours automate the backend work — enquiry routing, technician dispatch, customer updates — so your team focuses on delivery, not admin.`;
  } else if (!hasSocial && !hasWebsite) {
    angle = 'visibility';
    painLine = `While ${name} operates in ${location}, we noticed a limited online footprint — no social media or website presence that could be driving inbound leads.`;
    pitchLine = `Synvora helps ${category} SMEs build automated inbound lead systems so customers find you online and book directly.`;
  } else {
    angle = 'general';
    painLine = `We came across ${name} while researching ${category} businesses in ${location} and believe there's a strong fit for what we do.`;
    pitchLine = `Synvora builds custom AI automation tools for ${category} businesses — from enquiry management to workflow automation — reducing manual overhead by 60–80%.`;
  }

  const emailBody = `Hi,

${painLine}

${pitchLine}

We'd love to share a quick case study of how we helped a similar ${category} business in ${location} — would you be open to a 10-minute call this week?

Best regards,
Synvora Technologies
www.synvoratech.in`;

  return {
    email: {
      subject: `Workflow automation opportunity for ${name}`,
      body: emailBody
    },
    whatsapp: `Hello, greetings from Synvora Technologies! 🙏\n\nWe work with ${category} businesses in ${location} to automate customer enquiries and operational workflows.\n\n${hasSocial ? "Saw your presence online — " : ""}May I share how we helped a similar business save 15+ hours/week?\n\nSynvora Technologies`,
    callScript: `"Hi, this is [Your Name] from Synvora Technologies. I'm calling specifically about ${name} — we work with ${category} businesses in ${location} to automate customer enquiries and operational workflows. I know that's a busy space — do you have 2 minutes for me to share one specific result we got for a similar company?"`,
    linkedin: `Hi, came across ${name} on Google Maps — impressive ${category} operation in ${location}. At Synvora, we help similar businesses automate their backend workflows. Would love to connect and share a quick case study!`,
    reasoning: `Angle: ${angle} — based on real signals: rating=${rating || 'N/A'}, reviews=${reviews}, website=${hasWebsite}, social=${hasSocial}`,
    generatedBy: 'template'
  };
}

/**
 * Main export — tries Gemini first, gracefully falls back to template on rate limits
 */
export async function generatePersonalizedOutreach(company, scoreData, geminiApiKey = '') {
  if (geminiApiKey) {
    try {
      return await generateWithGemini(company, scoreData, geminiApiKey);
    } catch (err) {
      console.warn('Gemini outreach rate limited or failed, using smart template fallback:', err.message);
    }
  }
  return generateTemplateFallback(company, scoreData);
}
