/**
 * Apify Multi-Source Lead Scraping
 * Combines 3 scrapers in parallel for maximum real lead coverage:
 *   1. Google Maps Scraper     → compass~crawler-google-places
 *   2. Google Maps Email Ext   → lukaskrivka~google-maps-with-contact-details
 *   3. Google Search Scraper   → apify~google-search-scraper
 */

const APIFY_BASE = 'https://api.apify.com/v2';

const ACTORS = {
  MAPS: 'compass~crawler-google-places',
  MAPS_EMAIL: 'lukaskrivka~google-maps-with-contact-details',
  SEARCH: 'apify~google-search-scraper'
};

// ─── GPS Utilities ───────────────────────────────────────────────────────────

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'SynvoraLeadIntelligence/1.0' } }
    );
    const data = await res.json();
    const addr = data?.address || {};
    return addr.city || addr.town || addr.county || addr.suburb || addr.state_district || addr.state || 'your location';
  } catch {
    return 'your location';
  }
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('GPS_NOT_SUPPORTED')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1 ? 'GPS_PERMISSION_DENIED' : 'GPS_UNAVAILABLE')),
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

// ─── Individual Actor Runners ─────────────────────────────────────────────────

async function runActor(actorId, inputBody, apifyToken, timeoutSec = 120) {
  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=${timeoutSec}&memory=256`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputBody)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Actor ${actorId} failed (${res.status}): ${txt}`);
  }
  return res.json();
}

// 1. Google Maps Scraper ─────────────────────────────────────────────────────
async function runMapsSearch(query, city, count, apifyToken, coords) {
  const fullQuery = (city && city !== 'All Locations' && city !== '📍 Near Me (GPS)')
    ? `${query} in ${city}` : query;

  const input = {
    searchStringsArray: [fullQuery],
    maxCrawledPlacesPerSearch: count,
    language: 'en',
    countryCode: 'in',
    includeReviews: false,
    includeImages: false,
    skipClosedPlaces: true
  };
  if (coords?.lat) { input.lat = coords.lat; input.lng = coords.lng; input.zoom = 14; }

  const results = await runActor(ACTORS.MAPS, input, apifyToken, 120);

  return (results || [])
    .filter(r => r.title && (r.address || r.street))
    .filter(r => !r.permanentlyClosed)
    .map(r => ({
      companyName: r.title || '',
      address: r.address || [r.street, r.city, r.state, r.postalCode].filter(Boolean).join(', '),
      phone: r.phone || '',
      website: r.website || '',
      email: '',
      rating: r.totalScore || null,
      reviewsCount: r.reviewsCount || 0,
      category: r.categoryName || r.categories?.[0] || '',
      googleMapsUrl: r.url || '',
      location: r.city || city || '',
      state: r.state || '',
      sources: ['Google Maps'],
      dataSource: '📍 Google Maps — Live'
    }));
}

// 2. Google Maps Email Extractor ─────────────────────────────────────────────
async function runMapsEmailExtractor(query, city, count, apifyToken, coords) {
  const fullQuery = (city && city !== 'All Locations' && city !== '📍 Near Me (GPS)')
    ? `${query} in ${city}` : query;

  const input = {
    searchStringsArray: [fullQuery],
    maxCrawledPlacesPerSearch: Math.ceil(count * 0.7), // fetch fewer since it's slower
    language: 'en',
    countryCode: 'in',
    includeReviews: false,
    skipClosedPlaces: true,
    scrapeContacts: true
  };
  if (coords?.lat) { input.lat = coords.lat; input.lng = coords.lng; input.zoom = 14; }

  try {
    const results = await runActor(ACTORS.MAPS_EMAIL, input, apifyToken, 150);
    return (results || [])
      .filter(r => r.title)
      .map(r => ({
        companyName: r.title || '',
        address: r.address || r.street || '',
        phone: r.phone || '',
        website: r.website || '',
        email: r.email || r.emails?.[0] || '',
        socialMedia: {
          facebook: r.facebook || '',
          instagram: r.instagram || '',
          linkedin: r.linkedIn || ''
        },
        rating: r.totalScore || null,
        reviewsCount: r.reviewsCount || 0,
        category: r.categoryName || '',
        googleMapsUrl: r.url || '',
        location: r.city || city || '',
        sources: ['Google Maps Email'],
        dataSource: '📧 Google Maps + Email Extractor'
      }));
  } catch (err) {
    console.warn('Email extractor failed (non-fatal):', err.message);
    return [];
  }
}

// 3. Google Search Results Scraper ───────────────────────────────────────────
async function runGoogleSearch(query, city, count, apifyToken) {
  const searchQuery = (city && city !== 'All Locations' && city !== '📍 Near Me (GPS)')
    ? `${query} ${city} contact phone` : `${query} India contact phone`;

  const input = {
    queries: searchQuery,
    maxPagesPerQuery: 2,
    resultsPerPage: Math.min(count, 10),
    countryCode: 'in',
    languageCode: 'en',
    mobileResults: false
  };

  try {
    const results = await runActor(ACTORS.SEARCH, input, apifyToken, 60);
    const organicResults = (results || []).flatMap(r => r.organicResults || []);

    return organicResults
      .filter(r => r.title && r.url && !r.url.includes('google.com') && !r.url.includes('facebook.com') && !r.url.includes('justdial'))
      .map(r => ({
        companyName: r.title?.replace(/\s*[-|].*$/, '').trim() || '',
        address: '',
        phone: extractPhoneFromText(r.description || ''),
        website: r.url || '',
        email: extractEmailFromText(r.description || ''),
        rating: null,
        reviewsCount: 0,
        category: '',
        googleMapsUrl: '',
        location: city && city !== 'All Locations' ? city : '',
        snippet: r.description || '',
        sources: ['Google Search'],
        dataSource: '🔍 Google Search Results'
      }))
      .filter(r => r.companyName.length > 3);
  } catch (err) {
    console.warn('Search scraper failed (non-fatal):', err.message);
    return [];
  }
}

function extractPhoneFromText(text) {
  const match = text.match(/(\+91[-\s]?)?[6-9]\d{9}|0\d{2,4}[-\s]?\d{6,8}/);
  return match ? match[0].trim() : '';
}

function extractEmailFromText(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

// ─── Merger: Deduplicate & Combine All Sources ────────────────────────────────

function mergeResults(mapsResults, emailResults, searchResults) {
  const merged = new Map(); // key: normalized company name

  const normalizeKey = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  // Priority: Maps data is most reliable → add first
  for (const r of mapsResults) {
    const key = normalizeKey(r.companyName);
    if (key.length < 3) continue;
    merged.set(key, { ...r });
  }

  // Email extractor: enrich existing or add new
  for (const r of emailResults) {
    const key = normalizeKey(r.companyName);
    if (key.length < 3) continue;
    if (merged.has(key)) {
      const existing = merged.get(key);
      merged.set(key, {
        ...existing,
        email: r.email || existing.email,
        socialMedia: r.socialMedia || existing.socialMedia,
        sources: [...new Set([...(existing.sources || []), ...r.sources])]
      });
    } else {
      merged.set(key, { ...r });
    }
  }

  // Google Search: only add if company not already found via Maps
  for (const r of searchResults) {
    const key = normalizeKey(r.companyName);
    if (key.length < 3 || merged.has(key)) continue;
    merged.set(key, { ...r });
  }

  return Array.from(merged.values());
}

// ─── Main Export: Run All 3 in Parallel ──────────────────────────────────────

/**
 * Run all 3 Apify scrapers in parallel and merge deduplicated results
 */
export async function scrapeAllSources(query, city, count, apifyToken, coords, onSourceUpdate) {
  if (!apifyToken) throw new Error('APIFY_TOKEN_MISSING');

  // Run all 3 in parallel — failures in email/search are non-fatal
  const [mapsResults, emailResults, searchResults] = await Promise.allSettled([
    runMapsSearch(query, city, count, apifyToken, coords),
    runMapsEmailExtractor(query, city, Math.ceil(count * 0.6), apifyToken, coords),
    runGoogleSearch(query, city, Math.ceil(count * 0.5), apifyToken)
  ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

  if (onSourceUpdate) {
    onSourceUpdate({
      maps: mapsResults.length,
      email: emailResults.length,
      search: searchResults.length
    });
  }

  return mergeResults(mapsResults, emailResults, searchResults);
}
