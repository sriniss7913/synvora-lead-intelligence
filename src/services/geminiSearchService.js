/**
 * Gemini AI Live Web Search Lead Discovery Engine
 * Uses Gemini's built-in Google Search Grounding to fetch live, structured
 * real-world business listings in 3-5 seconds without third-party scrapers.
 *
 * Includes multi-model automatic fallback (gemini-2.0-flash -> gemini-1.5-flash -> gemini-2.0-flash-lite)
 * to handle free tier rate limits (RESOURCE_EXHAUSTED / 429).
 */

const MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite'
];

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

  let lastError = null;

  // Try models sequentially if one hits rate limits
  for (const modelName of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429 || response.status === 403) {
        const errorText = await response.text();
        console.warn(`Model ${modelName} rate limited (${response.status}), trying fallback model...`);
        lastError = errorText;
        continue; // Try next model
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errorText}`);
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
      if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        lastError = err.message;
        continue;
      }
      throw err;
    }
  }

  // If all models hit rate limit
  throw new Error('Gemini API free tier rate limit reached (RESOURCE_EXHAUSTED). Please wait ~10 seconds or switch to Apify Google Maps scraper.');
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
