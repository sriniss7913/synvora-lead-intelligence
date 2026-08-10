/**
 * Apify Google Maps Scraper Integration
 * Real Indian business data — name, address, phone, website, Google rating
 * Actor: compass/google-maps-scraper
 */

const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID = 'compass~crawler-google-places';

/**
 * Scrape real business listings from Google Maps via Apify
 * @param {string} searchQuery - e.g. "elevator companies" 
 * @param {string} city - e.g. "Chennai"
 * @param {number} count - max results requested
 * @param {string} apifyToken - Apify API token
 * @returns {Array} real business records
 */
export async function scrapeGoogleMapsLeads(searchQuery, city, count = 10, apifyToken) {
  if (!apifyToken) throw new Error('APIFY_TOKEN_MISSING');

  const fullQuery = city ? `${searchQuery} in ${city}` : searchQuery;
  const runUrl = `${APIFY_BASE}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${apifyToken}&timeout=120&memory=256`;

  const response = await fetch(runUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchStringsArray: [fullQuery],
      maxCrawledPlacesPerSearch: count,
      language: 'en',
      countryCode: 'in',
      includeReviews: false,
      includeImages: false,
      skipClosedPlaces: true
    })
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
