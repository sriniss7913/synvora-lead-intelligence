/**
 * Gemini AI Live Web Search Lead Discovery Engine
 * Uses Gemini's built-in Google Search Grounding to fetch live, structured
 * real-world business listings in 3-5 seconds without third-party scrapers.
 *
 * Includes multi-model automatic fallback (gemini-2.0-flash -> gemini-2.0-flash-lite -> gemini-1.5-flash-latest)
 * to handle rate limits and endpoint variations.
 */

// Only gemini-2.0-flash supports Google Search Grounding in v1beta
const SEARCH_MODEL = 'gemini-2.0-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${SEARCH_MODEL}:generateContent`;

/**
 * Search real business leads using Gemini with Google Search Grounding
 */
export async function searchLeadsWithGemini(queryText, city, count = 10, geminiApiKey) {
  if (!geminiApiKey) throw new Error('GEMINI_TOKEN_MISSING');

  const locationContext = (city && city !== 'All Locations' && city !== '📍 Near Me (GPS)')
    ? `in ${city}, India`
    : 'in India';

  const prompt = `Perform a live web search to find ${count} REAL, real-world active companies matching: "${queryText}" ${locationContext}.

Extract accurate data from public Google listings and web search results.
Return a STRICT JSON array of ${count} company objects with these exact keys:
- "companyName": Full official business name
- "address": Full street address with area and pincode
- "phone": Valid contact phone or mobile number (Indian format e.g. +91 98765 43210 or 044 2819 1234)
- "website": Official website URL or empty string
- "email": Contact email if public or empty string
- "rating": Numeric Google rating (e.g. 4.5) or null
- "reviewsCount": Integer number of Google reviews or 0
- "category": Primary business category (e.g. Elevator Manufacturer, Industrial Equipment)
- "location": City name (e.g. ${city || 'Chennai'})

IMPORTANT:
1. Only return real, verifiable active businesses.
2. Output STRICT valid JSON array ONLY. No markdown formatting, no explanation text outside the JSON.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ googleSearch: {} }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048
    }
  };

  let lastError = 'Unknown error';
  const MAX_RETRIES = 3;

  // Retry with exponential backoff on the same model (rate limits are per-minute, not permanent)
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        const waitSec = attempt * 8; // 8s, 16s, 24s
        console.warn(`Rate limited (429) on attempt ${attempt}/${MAX_RETRIES}. Waiting ${waitSec}s...`);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, waitSec * 1000));
          continue;
        }
        throw new Error(`RATE_LIMIT`);
      }

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          errorDetail = errData?.error?.message || errorDetail;
        } catch (_) {}
        lastError = errorDetail;
        throw new Error(lastError);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let parsedResults = [];
      try {
        parsedResults = JSON.parse(cleanJson);
        if (!Array.isArray(parsedResults)) {
          if (parsedResults.companies && Array.isArray(parsedResults.companies)) {
            parsedResults = parsedResults.companies;
          } else {
            parsedResults = [];
          }
        }
      } catch (e) {
        const match = rawText.match(/\[\s*\{.*\}\s*\]/s);
        if (match) {
          try { parsedResults = JSON.parse(match[0]); } catch {}
        }
      }

      return mapGeminiResults(parsedResults, city);

    } catch (err) {
      if (err.message === 'RATE_LIMIT') break;
      console.warn(`Gemini Search attempt ${attempt} failed:`, err.message);
      lastError = err.message;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  if (lastError === 'RATE_LIMIT') {
    throw new Error('Gemini free tier rate limit reached. Please wait ~1 minute and try again, or switch to Apify Google Maps scraper.');
  }
  throw new Error(`Gemini search failed after ${MAX_RETRIES} attempts. Please try again or switch to Apify.`);
}

function mapGeminiResults(results, city) {
  if (!Array.isArray(results)) return [];

  return results
    .filter(r => r && (r.companyName || r.name))
    .map(r => ({
      companyName: String(r.companyName || r.name || '').trim(),
      address: r.address || `${r.location || city || 'India'}`,
      phone: r.phone || '',
      website: r.website || '',
      email: r.email || '',
      rating: r.rating ? parseFloat(r.rating) : null,
      reviewsCount: r.reviewsCount ? parseInt(r.reviewsCount, 10) : 0,
      category: r.category || 'Business Services',
      googleMapsUrl: r.website || `https://www.google.com/search?q=${encodeURIComponent((r.companyName || '') + ' ' + (r.address || ''))}`,
      location: r.location || city || 'India',
      sources: ['✨ Gemini AI Web Search Grounding'],
      dataSource: '✨ Gemini AI Live Search',
      isReal: true
    }));
}

/**
 * Fallback: Search leads using Grok xAI when Gemini is rate-limited or token expired
 */
export async function searchLeadsWithGrok(queryText, city, count = 10, grokApiKey) {
  if (!grokApiKey) throw new Error('GROK_TOKEN_MISSING');

  const locationContext = (city && city !== 'All Locations' && city !== '📍 Near Me (GPS)')
    ? `in ${city}, India`
    : 'in India';

  const prompt = `Find ${count} REAL, currently operating companies matching: "${queryText}" ${locationContext}.

Return a STRICT JSON array of ${count} company objects with these exact keys:
- "companyName": Full official business name
- "address": Full street address with area and pincode
- "phone": Valid contact phone or mobile number (Indian format e.g. +91 98765 43210)
- "website": Official website URL or empty string
- "email": Contact email if public or empty string
- "rating": Numeric Google rating (e.g. 4.5) or null
- "reviewsCount": Integer number of Google reviews or 0
- "category": Primary business category
- "location": City name (e.g. ${city || 'Chennai'})

IMPORTANT:
1. Only return real, verifiable active businesses.
2. Output STRICT valid JSON array ONLY. No markdown formatting, no explanation text outside the JSON.`;

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${grokApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      messages: [
        { role: 'system', content: 'You are a business data extraction assistant. Return only valid JSON arrays.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!res.ok) throw new Error(`Grok HTTP ${res.status}`);

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsedResults = [];
  try {
    parsedResults = JSON.parse(cleanJson);
    if (!Array.isArray(parsedResults)) {
      if (parsedResults.companies && Array.isArray(parsedResults.companies)) {
        parsedResults = parsedResults.companies;
      } else {
        parsedResults = [];
      }
    }
  } catch (e) {
    const match = rawText.match(/\[\s*\{.*\}\s*\]/s);
    if (match) {
      try { parsedResults = JSON.parse(match[0]); } catch {}
    }
  }

  return mapGrokResults(parsedResults, city);
}

function mapGrokResults(results, city) {
  if (!Array.isArray(results)) return [];

  return results
    .filter(r => r && (r.companyName || r.name))
    .map(r => ({
      companyName: String(r.companyName || r.name || '').trim(),
      address: r.address || `${r.location || city || 'India'}`,
      phone: r.phone || '',
      website: r.website || '',
      email: r.email || '',
      rating: r.rating ? parseFloat(r.rating) : null,
      reviewsCount: r.reviewsCount ? parseInt(r.reviewsCount, 10) : 0,
      category: r.category || 'Business Services',
      googleMapsUrl: r.website || `https://www.google.com/search?q=${encodeURIComponent((r.companyName || '') + ' ' + (r.address || ''))}`,
      location: r.location || city || 'India',
      sources: ['🤖 Grok xAI Search'],
      dataSource: '🤖 Grok xAI Fallback Search',
      isReal: true
    }));
}
