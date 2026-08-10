/**
 * Apify Multi-Source Lead Scraping — Async Polling Architecture
 *
 * Instead of run-sync-get-dataset-items (which times out and crashes),
 * we use: POST /runs → poll until SUCCEEDED → GET /dataset/items
 * This is reliable for 60–180 second actor runs.
 *
 * Actors used:
 *   1. compass~crawler-google-places        (Google Maps — primary, required)
 *   2. lukaskrivka~google-maps-with-contact-details (Email extractor — optional)
 *   3. apify~google-search-scraper          (Google Search — optional)
 */

const APIFY_BASE = 'https://api.apify.com/v2';

const ACTORS = {
  MAPS: 'compass~crawler-google-places',
  MAPS_EMAIL: 'lukaskrivka~google-maps-with-contact-details',
  SEARCH: 'apify~google-search-scraper'
};

// ─── GPS Utilities ────────────────────────────────────────────────────────────

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
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(new Error(err.code === 1 ? 'GPS_PERMISSION_DENIED' : 'GPS_UNAVAILABLE')),
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

// ─── Async Run + Polling Engine ───────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Start an actor run and return immediately with the run metadata */
async function startRun(actorId, inputBody, token) {
  const url = `${APIFY_BASE}/acts/${actorId}/runs?token=${token}&memory=256`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputBody)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Start failed (${res.status}): ${txt}`);
  }
  const json = await res.json();
  return json.data; // { id, defaultDatasetId, status, ... }
}

/** Poll a run until SUCCEEDED / FAILED / ABORTED. Returns run data on success. */
async function pollRunUntilDone(runId, token, timeoutMs = 180000, onPoll = null) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(4000); // poll every 4 seconds
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
    if (!res.ok) continue; // network blip — keep polling

    const json = await res.json();
    const run = json?.data;
    const status = run?.status;

    if (onPoll) onPoll(status);

    if (status === 'SUCCEEDED') return run;
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Run ${status}`);
    }
  }
  throw new Error('CLIENT_TIMEOUT');
}

/** Fetch items from a completed dataset */
async function fetchDatasetItems(datasetId, token, limit = 50) {
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&limit=${limit}&clean=true`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.items || []);
}

// ─── Actor-Specific Input Builders & Result Mappers ─────────────────────────

function buildMapsInput(query, city, count, coords) {
  const fullQuery = (city && city !== 'All Locations' && city !== '📍 Near Me (GPS)')
    ? `${query} in ${city}` : query;
  const input = {
    searchStringsArray: [fullQuery],
    maxCrawledPlacesPerSearch: count,
    language: 'en', countryCode: 'in',
    includeReviews: false, includeImages: false, skipClosedPlaces: true
  };
  if (coords?.lat) { input.lat = coords.lat; input.lng = coords.lng; input.zoom = 14; }
  return input;
}

function mapMapsResults(results, city) {
  if (!Array.isArray(results)) return [];
  return results
    .filter(r => r && r.title && (r.address || r.street))
    .filter(r => !r.permanentlyClosed)
    .map(r => ({
      companyName: String(r.title || '').trim(),
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
      dataSource: '📍 Google Maps'
    }));
}

function buildEmailExtractorInput(query, city, count, coords) {
  const fullQuery = (city && city !== 'All Locations' && city !== '📍 Near Me (GPS)')
    ? `${query} in ${city}` : query;
  const input = {
    searchStringsArray: [fullQuery],
    maxCrawledPlacesPerSearch: Math.ceil(count * 0.6),
    language: 'en', countryCode: 'in',
    includeReviews: false, skipClosedPlaces: true,
    scrapeContacts: true
  };
  if (coords?.lat) { input.lat = coords.lat; input.lng = coords.lng; input.zoom = 14; }
  return input;
}

function mapEmailResults(results, city) {
  if (!Array.isArray(results)) return [];
  return results
    .filter(r => r && r.title)
    .map(r => ({
      companyName: String(r.title || '').trim(),
      address: r.address || r.street || '',
      phone: r.phone || '',
      website: r.website || '',
      email: r.email || r.emails?.[0] || '',
      socialMedia: {
        facebook: r.facebook || '',
        instagram: r.instagram || '',
        linkedin: r.linkedIn || r.linkedin || ''
      },
      rating: r.totalScore || null,
      reviewsCount: r.reviewsCount || 0,
      category: r.categoryName || '',
      googleMapsUrl: r.url || '',
      location: r.city || city || '',
      sources: ['Google Maps Email'],
      dataSource: '📧 Email Extractor'
    }));
}

function buildSearchInput(query, city, count) {
  const q = (city && city !== 'All Locations' && city !== '📍 Near Me (GPS)')
    ? `${query} ${city} India contact number` : `${query} India contact number`;
  return {
    queries: q,
    maxPagesPerQuery: 1,
    resultsPerPage: Math.min(count, 10),
    countryCode: 'in', languageCode: 'en'
  };
}

function mapSearchResults(results, city) {
  if (!Array.isArray(results)) return [];
  const organicResults = results.flatMap(r =>
    Array.isArray(r.organicResults) ? r.organicResults : []
  );
  const blocked = ['google.com', 'facebook.com', 'justdial', 'indiamart', 'wikipedia', 'youtube'];
  return organicResults
    .filter(r => r?.title && r?.url && !blocked.some(b => r.url.includes(b)))
    .map(r => ({
      companyName: String(r.title || '').replace(/\s*[-|].*$/, '').trim(),
      address: '',
      phone: extractPhone(r.description || ''),
      website: r.url || '',
      email: extractEmail(r.description || ''),
      rating: null,
      reviewsCount: 0,
      category: '',
      googleMapsUrl: '',
      location: (city && city !== 'All Locations') ? city : '',
      snippet: r.description || '',
      sources: ['Google Search'],
      dataSource: '🔍 Google Search'
    }))
    .filter(r => r.companyName.length > 3);
}

function extractPhone(text) {
  const m = text.match(/(\+91[\s-]?)?[6-9]\d{9}|0\d{2,4}[\s-]?\d{6,8}/);
  return m ? m[0].trim() : '';
}
function extractEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : '';
}

// ─── Deduplication & Merge ────────────────────────────────────────────────────

function normalizeKey(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function mergeAllResults(mapsResults, emailResults, searchResults) {
  const merged = new Map();

  // Priority 1: Google Maps (most reliable)
  for (const r of (Array.isArray(mapsResults) ? mapsResults : [])) {
    const key = normalizeKey(r.companyName);
    if (key.length < 3) continue;
    merged.set(key, { ...r });
  }

  // Priority 2: Email Extractor — enrich or add
  for (const r of (Array.isArray(emailResults) ? emailResults : [])) {
    const key = normalizeKey(r.companyName);
    if (key.length < 3) continue;
    if (merged.has(key)) {
      const ex = merged.get(key);
      merged.set(key, {
        ...ex,
        email: r.email || ex.email,
        socialMedia: r.socialMedia || ex.socialMedia,
        sources: [...new Set([...(ex.sources || []), ...(r.sources || [])])]
      });
    } else {
      merged.set(key, { ...r });
    }
  }

  // Priority 3: Google Search — only add if new
  for (const r of (Array.isArray(searchResults) ? searchResults : [])) {
    const key = normalizeKey(r.companyName);
    if (key.length < 3 || merged.has(key)) continue;
    merged.set(key, { ...r });
  }

  return Array.from(merged.values());
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Run selected Apify actors using async start + polling (no HTTP timeouts).
 * Google Maps is ALWAYS run as the default listing provider.
 * Optional website email extractor runs in parallel if requested.
 * Optional search backup runs only if Maps results fall short of the requested count.
 */
export async function scrapeAllSources(
  query, city, count, apifyToken, coords = null, onProgress = null,
  useEmails = false, useSearchBackup = false
) {
  if (!apifyToken) throw new Error('APIFY_TOKEN_MISSING');

  const notify = msg => { if (onProgress) onProgress(msg); };

  // ── Step 1: Start Maps (and Email Extractor if selected) ──
  const mapsInput = buildMapsInput(query, city, count, coords);
  let mapsRun = null, emailRun = null;

  notify('🚀 Starting Google Maps scraper...');
  mapsRun = await startRun(ACTORS.MAPS, mapsInput, apifyToken);

  if (useEmails) {
    notify('📧 Starting website email extractor (in parallel)...');
    try {
      const emailInput = buildEmailExtractorInput(query, city, count, coords);
      emailRun = await startRun(ACTORS.MAPS_EMAIL, emailInput, apifyToken);
    } catch (e) {
      console.warn('Email extractor start failed:', e.message);
    }
  }

  // ── Step 2: Poll primary scraper runs ──
  notify('⏳ Scraping in progress — polling Google Maps...');

  const mapsStatus  = { done: false, label: 'Google Maps' };
  const emailStatus = { done: false, label: 'Email Extractor' };

  const makePoller = (run, status) => {
    if (!run) return Promise.resolve([]);
    return pollRunUntilDone(run.id, apifyToken, 180000, () => {
      if (!status.done) {
        status.done = true;
        notify(`✅ ${status.label} complete!`);
      }
    }).then(completed => fetchDatasetItems(completed.defaultDatasetId, apifyToken, count + 10))
      .catch(err => {
        console.warn(`${status.label} failed:`, err.message);
        return [];
      });
  };

  const [mapsRaw, emailRaw] = await Promise.all([
    makePoller(mapsRun, mapsStatus),
    makePoller(emailRun, emailStatus)
  ]);

  const mapsResults  = mapMapsResults(mapsRaw, city);
  const emailResults = mapEmailResults(emailRaw, city);

  let mergedLeads = mergeAllResults(mapsResults, emailResults, []);
  notify(`🔀 Merged primary sources. Found ${mergedLeads.length} unique businesses.`);

  // ── Step 3: Conditional Web Search fallback ──
  let searchResults = [];
  if (useSearchBackup && mergedLeads.length < count) {
    const deficit = count - mergedLeads.length;
    notify(`🔍 Maps found fewer leads than requested (${mergedLeads.length}/${count}). Activating Google Search Backup to find ${deficit} more...`);
    try {
      const searchInput = buildSearchInput(query, city, count);
      const searchRun = await startRun(ACTORS.SEARCH, searchInput, apifyToken);
      const searchRaw = await pollRunUntilDone(searchRun.id, apifyToken, 120000, () => {});
      const searchItems = await fetchDatasetItems(searchRaw.defaultDatasetId, apifyToken, deficit + 5);
      searchResults = mapSearchResults(searchItems, city);
      notify(`✅ Google Search Backup finished. Merging additional listings.`);
    } catch (e) {
      console.warn('Search backup failed:', e.message);
    }
  } else if (useSearchBackup) {
    notify('✅ Maps scraper returned enough results. Skipping Google Search backup to save time & API quota.');
  }

  return mergeAllResults(mapsResults, emailResults, searchResults);
}
