/**
 * Gemini AI Live Web Search Lead Discovery Engine
 * Uses Gemini's built-in Google Search Grounding to fetch live, structured
 * real-world business listings in 3-5 seconds without third-party scrapers.
 */

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Search real business leads using Gemini 2.0 with Google Search Grounding
 * @param {string} queryText - e.g. "Elevator companies in Chennai"
 * @param {string} city - e.g. "Chennai"
 * @param {number} count - number of leads requested
 * @param {string} geminiApiKey - User's Gemini API Key
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

  const response = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Search API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract JSON array string
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
    console.warn('Could not parse JSON directly, trying substring extraction:', e.message);
    const match = rawText.match(/\[\s*\{.*\}\s*\]/s);
    if (match) {
      try { parsedResults = JSON.parse(match[0]); } catch {}
    }
  }

  return mapGeminiResults(parsedResults, city);
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
