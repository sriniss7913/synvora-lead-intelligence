/**
 * Hunter.io Email Discovery Integration
 * Finds publicly listed email addresses for company domains
 * Free tier: 25 domain searches / month
 */

const HUNTER_BASE = 'https://api.hunter.io/v2';

/**
 * Find email addresses for a company domain
 * @param {string} website - e.g. "https://suraselevators.com"
 * @param {string} hunterApiKey - Hunter.io API key
 * @returns {Object|null} best matching contact or null
 */
export async function findCompanyEmail(website, hunterApiKey) {
  if (!hunterApiKey || !website) return null;

  // Extract clean domain
  let domain = website
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/.*$/, '')
    .trim();

  if (!domain || domain.length < 4) return null;

  try {
    const res = await fetch(
      `${HUNTER_BASE}/domain-search?domain=${encodeURIComponent(domain)}&api_key=${hunterApiKey}&limit=5`
    );

    if (!res.ok) return null;
    const data = await res.json();

    const emails = data?.data?.emails || [];
    if (emails.length === 0) {
      // Try pattern guessing if Hunter has the pattern but no emails
      const pattern = data?.data?.pattern;
      const orgName = data?.data?.organization;
      if (pattern) {
        return {
          email: `info@${domain}`,
          firstName: '',
          lastName: '',
          position: '',
          confidence: 30,
          source: 'pattern_guess'
        };
      }
      return null;
    }

    // Prioritize decision-maker roles
    const priorityRoles = ['ceo', 'founder', 'owner', 'director', 'managing', 'proprietor', 'md', 'president'];
    const best = emails.find(e =>
      priorityRoles.some(role =>
        (e.position || '').toLowerCase().includes(role)
      )
    ) || emails.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];

    return {
      email: best.value || '',
      firstName: best.first_name || '',
      lastName: best.last_name || '',
      position: best.position || '',
      confidence: best.confidence || 0,
      source: 'hunter_verified'
    };
  } catch (err) {
    console.warn('Hunter.io lookup failed:', err.message);
    return null;
  }
}
