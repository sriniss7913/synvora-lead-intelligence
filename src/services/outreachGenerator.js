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

Based ONLY on the real data above, write personalized outreach. Do NOT invent facts.

Respond in this exact JSON format (no markdown, no explanation, just the JSON):
{
  "emailSubject": "Free Workflow Assessment for [Company Name]",
  "emailBody": "Hello [Company Name] Team,\n\nWe came across [Company Name] in [Location], operating as a [Category]. For a [Category], managing customer enquiries, [insert 2-3 specific workflows based on category], and communication through online channels can involve several recurring workflows.\n\nAt Synvora Technologies, we help businesses explore practical improvements through AI, CRM and workflow automation, inventory and order automation, customer support automation, data analytics, and digital transformation.\n\nRather than simply suggesting a solution, we would first like to understand how your current workflows and processes are managed and identify whether there are any areas where technology could genuinely help.\n\nWe would be happy to offer a free consultation and workflow assessment, with no obligation. If we identify any useful opportunities, we can then discuss possible solutions.\n\nWould you be open to a brief conversation at your convenience?\n\nBest regards,\nSynvora Technologies\n7812876220\n[synvoratech.in](http://synvoratech.in/)\nInstagram: https://www.instagram.com/technologiessynvora/",
  "whatsapp": "Hello [Company Name] Team 👋\n\nWe came across your business in the [Category] segment. Managing customer enquiries, [insert 1-2 specific workflows], follow-ups, customer information and reporting can involve several day-to-day activities.\n\nAt Synvora Technologies, we help businesses improve such processes through AI, workflow automation, business software, data analytics, reporting dashboards, Website solutions and Cybersecurity.\n\nRather than suggesting a solution immediately, we would first like to understand your current workflow and identify whether technology could genuinely make any part of your operations easier.\n\nWould you be available for a brief conversation? 😊\n\n📞 7812876220\n🌐 synvoratech.in\n📸 Instagram: https://www.instagram.com/technologiessynvora/",
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
 * Fallback: Call Grok xAI API when Gemini fails
 */
async function generateWithGrok(company, scoreData, grokApiKey) {
  const context = buildCompanyContext(company, scoreData);

  const prompt = `You are a B2B sales outreach specialist for Synvora Technologies, an Indian AI automation company that helps SMEs and industrial businesses automate manual workflows, improve customer response times, and gain real-time operational visibility.

Here is the real data for the lead company you must write outreach for:

${context}

Based ONLY on the real data above, write personalized outreach. Do NOT invent facts.

Respond in this exact JSON format (no markdown, no explanation, just the JSON):
{
  "emailSubject": "Free Workflow Assessment for [Company Name]",
  "emailBody": "Hello [Company Name] Team,\n\nWe came across [Company Name] in [Location], operating as a [Category]. For a [Category], managing customer enquiries, [insert 2-3 specific workflows based on category], and communication through online channels can involve several recurring workflows.\n\nAt Synvora Technologies, we help businesses explore practical improvements through AI, CRM and workflow automation, inventory and order automation, customer support automation, data analytics, and digital transformation.\n\nRather than simply suggesting a solution, we would first like to understand how your current workflows and processes are managed and identify whether there are any areas where technology could genuinely help.\n\nWe would be happy to offer a free consultation and workflow assessment, with no obligation. If we identify any useful opportunities, we can then discuss possible solutions.\n\nWould you be open to a brief conversation at your convenience?\n\nBest regards,\nSynvora Technologies\n7812876220\n[synvoratech.in](http://synvoratech.in/)\nInstagram: https://www.instagram.com/technologiessynvora/",
  "whatsapp": "Hello [Company Name] Team 👋\n\nWe came across your business in the [Category] segment. Managing customer enquiries, [insert 1-2 specific workflows], follow-ups, customer information and reporting can involve several day-to-day activities.\n\nAt Synvora Technologies, we help businesses improve such processes through AI, workflow automation, business software, data analytics, reporting dashboards, Website solutions and Cybersecurity.\n\nRather than suggesting a solution immediately, we would first like to understand your current workflow and identify whether technology could genuinely make any part of your operations easier.\n\nWould you be available for a brief conversation? 😊\n\n📞 7812876220\n🌐 synvoratech.in\n📸 Instagram: https://www.instagram.com/technologiessynvora/",
  "callScript": "30-second cold call opening line referencing their real company name and category",
  "reasoning": "1 sentence explaining what specific real signal made this outreach angle unique"
}`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${grokApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      messages: [
        { role: 'system', content: 'You are Synvora AI Lead Intelligence Engine.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!res.ok) throw new Error(`Grok HTTP ${res.status}`);

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  const jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  return {
    email: { subject: parsed.emailSubject, body: parsed.emailBody },
    whatsapp: parsed.whatsapp,
    callScript: parsed.callScript,
    linkedin: `Hi, I came across ${company.companyName} on Google Maps and noticed your ${company.category || 'business'} in ${company.location}. At Synvora, we help similar businesses automate workflows and reduce manual overhead. Would love to connect!`,
    reasoning: parsed.reasoning,
    generatedBy: 'grok'
  };
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

  const emailBody = `Hello ${name} Team,

We came across ${name} in ${location}, operating as a ${category}. For a ${category}, managing customer enquiries, repeat customer interactions, inventory/service coordination, and communication through online channels can involve several recurring workflows.

At Synvora Technologies, we help businesses explore practical improvements through AI, CRM and workflow automation, inventory and order automation, customer support automation, data analytics, and digital transformation.

Rather than simply suggesting a solution, we would first like to understand how your current workflows and processes are managed and identify whether there are any areas where technology could genuinely help.

We would be happy to offer a free consultation and workflow assessment, with no obligation. If we identify any useful opportunities, we can then discuss possible solutions.

Would you be open to a brief conversation at your convenience?

Best regards,
Synvora Technologies
7812876220
http://synvoratech.in/
Instagram: https://www.instagram.com/technologiessynvora/`;

  const whatsappMsg = `Hello ${name} Team 👋

We came across your business in the ${category} segment. Managing customer enquiries, service/order coordination, follow-ups, customer information and reporting can involve several day-to-day activities.

At Synvora Technologies, we help businesses improve such processes through AI, workflow automation, business software, data analytics, reporting dashboards, Website solutions and Cybersecurity.

Rather than suggesting a solution immediately, we would first like to understand your current workflow and identify whether technology could genuinely make any part of your operations easier.

Would you be available for a brief conversation? 😊

📞 7812876220
🌐 synvoratech.in
📸 Instagram: https://www.instagram.com/technologiessynvora/`;

  return {
    email: {
      subject: `Free Workflow Assessment for ${name}`,
      body: emailBody
    },
    whatsapp: whatsappMsg,
    callScript: `"Hi, this is [Your Name] from Synvora Technologies. I'm calling specifically about ${name} — we work with ${category} businesses in ${location} to help explore workflow and customer communication improvements. Rather than pitching a solution, we're offering a free workflow assessment. Would you be open to a brief 2-minute chat at your convenience?"`,
    linkedin: `Hi, came across ${name} in ${location}. At Synvora, we help ${category} businesses explore practical workflow automation & technology solutions. Would love to connect and offer a brief workflow assessment!`,
    reasoning: `Angle: Consultative assessment for ${category} in ${location} — based on real signals: rating=${rating || 'N/A'}, reviews=${reviews}, website=${hasWebsite}`,
    generatedBy: 'template'
  };
}

/**
 * Main export — tries Gemini first, gracefully falls back to template on rate limits
 */
export async function generatePersonalizedOutreach(company, scoreData, geminiApiKey = '', grokApiKey = '') {
  // Try Gemini first (primary AI)
  if (geminiApiKey) {
    try {
      return await generateWithGemini(company, scoreData, geminiApiKey);
    } catch (err) {
      console.warn('Gemini outreach failed, attempting Grok fallback:', err.message);
    }
  }

  // Fallback to Grok xAI if Gemini failed or unavailable
  if (grokApiKey) {
    try {
      return await generateWithGrok(company, scoreData, grokApiKey);
    } catch (err) {
      console.warn('Grok outreach also failed, using smart template fallback:', err.message);
    }
  }

  return generateTemplateFallback(company, scoreData);
}
