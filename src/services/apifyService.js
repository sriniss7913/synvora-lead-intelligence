/**
 * Apify Google Maps Scraper Integration
 * Real Indian business data — name, address, phone, website, Google rating
 * Actor: compass/crawler-google-places
 */

const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID = 'compass~crawler-google-places';

/**
 * Reverse geocode GPS coords to a human-readable city name (free, no key required)
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'SynvoraLeadIntelligence/1.0' } }
    );
    const data = await res.json();
    const addr = data?.address || {};
    return (
      addr.city ||
      addr.town ||
      addr.county ||
      addr.suburb ||
      addr.state_district ||
      addr.state ||
      'your location'
    );
  } catch {
    return 'your location';
  }
}

/**
 * Get device GPS coordinates via browser Geolocation API
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS_NOT_SUPPORTED'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new Error('GPS_PERMISSION_DENIED'));
        else reject(new Error('GPS_UNAVAILABLE'));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

/**
 * Scrape real business listings from Google Maps via Apify
 * @param {string} searchQuery - e.g. "elevator companies"
 * @param {string} city - e.g. "Chennai" OR null (use coords)
 * @param {number} count - max results
 * @param {string} apifyToken - Apify API token
 * @param {Object|null} coords - { lat, lng } for GPS-based search
 */
export async function scrapeGoogleMapsLeads(searchQuery, city, count = 10, apifyToken, coords = null) {
  if (!apifyToken) throw new Error('APIFY_TOKEN_MISSING');

  const isNearMe = city === '📍 Near Me (GPS)';
  const fullQuery = (!isNearMe && city && city !== 'All Locations')
    ? `${searchQuery} in ${city}`
    : searchQuery;

  // Build Apify input
  const input = {
    searchStringsArray: [fullQuery],
    maxCrawledPlacesPerSearch: count,
    language: 'en',
    countryCode: 'in',
    includeReviews: false,
    includeImages: false,
    skipClosedPlaces: true
  };

  // Add GPS coordinates for Near Me searches
  if (coords?.lat && coords?.lng) {
    input.lat = coords.lat;
    input.lng = coords.lng;
    input.zoom = 14; // ~5km radius at zoom 14
  }

  const runUrl = `${APIFY_BASE}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${apifyToken}&timeout=120&memory=256`;

  const response = await fetch(runUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apify error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return mapApifyResults(data, city);
}

function mapApifyResults(results, city) {
  if (!Array.isArray(results)) return [];

  return results
    .filter(r => r.title && (r.address || r.street))
    .map(r => ({
      companyName: r.title || '',
      address: r.address || [r.street, r.city, r.state, r.postalCode].filter(Boolean).join(', '),
      phone: r.phone || '',
      website: r.website || '',
      rating: r.totalScore || null,
      reviewsCount: r.reviewsCount || 0,
      category: r.categoryName || r.categories?.[0] || '',
      googleMapsUrl: r.url || '',
      location: r.city || city || '',
      state: r.state || '',
      postalCode: r.postalCode || '',
      permanentlyClosed: r.permanentlyClosed || false,
      dataSource: '📍 Google Maps — Apify Verified Live Data',
      isReal: true,
      plusCode: r.plusCode || ''
    }))
    .filter(r => !r.permanentlyClosed);
}
