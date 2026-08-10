/**
 * IndexedDB Lead History Database
 * Persistent, structured storage for all discovered leads with full outreach tracking.
 * Completely separate from fresh search results.
 */

const DB_NAME = 'synvora_lead_history';
const LEADS_STORE = 'leads';
const DB_VERSION = 1;

let _db = null;

async function getDB() {
  if (_db) return _db;

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(LEADS_STORE)) {
        const store = db.createObjectStore(LEADS_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('companyKey', 'companyKey', { unique: true });
        store.createIndex('discoveredAt', 'discoveredAt', { unique: false });
        store.createIndex('outreachStatus', 'outreachStatus', { unique: false });
        store.createIndex('city', 'city', { unique: false });
      }
    };

    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = (e) => reject(e.target.error);
  });
}

function makeCompanyKey(companyName, location) {
  return `${(companyName || '').toLowerCase().trim()}_${(location || '').toLowerCase().trim()}`;
}

/** Add a new lead to history. Silently ignores duplicates. */
export async function addLeadToHistory(lead) {
  const db = await getDB();
  const companyKey = makeCompanyKey(lead.companyName, lead.location);

  return new Promise((resolve) => {
    const tx = db.transaction(LEADS_STORE, 'readwrite');
    const store = tx.objectStore(LEADS_STORE);
    const addReq = store.add({
      ...lead,
      companyKey,
      outreachStatus: 'New',
      discoveredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      notes: ''
    });
    addReq.onsuccess = () => resolve(true);
    addReq.onerror = () => resolve(false); // silently skip duplicates
  });
}

/** Add multiple leads to history in bulk */
export async function bulkAddToHistory(leads) {
  for (const lead of leads) {
    await addLeadToHistory(lead);
  }
}

/** Get all leads from history */
export async function getAllHistoryLeads() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEADS_STORE, 'readonly');
    const store = tx.objectStore(LEADS_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt)));
    req.onerror = () => reject(req.error);
  });
}

/** Update a lead's outreach status and notes */
export async function updateLeadInHistory(id, outreachStatus, notes) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEADS_STORE, 'readwrite');
    const store = tx.objectStore(LEADS_STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const lead = getReq.result;
      if (!lead) return reject(new Error('Lead not found'));
      const updated = {
        ...lead,
        outreachStatus: outreachStatus || lead.outreachStatus,
        notes: notes !== undefined ? notes : lead.notes,
        lastUpdated: new Date().toISOString()
      };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/** Check if a company already exists in history */
export async function isInHistory(companyName, location) {
  const db = await getDB();
  const companyKey = makeCompanyKey(companyName, location);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEADS_STORE, 'readonly');
    const store = tx.objectStore(LEADS_STORE);
    const index = store.index('companyKey');
    const req = index.get(companyKey);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Get count of leads in each status */
export async function getHistoryStats() {
  const all = await getAllHistoryLeads();
  const stats = { total: all.length };
  const statuses = ['New', 'Email Sent', 'WhatsApp Sent', 'Interested', 'Meeting Scheduled', 'Closed Won', 'Closed Lost', 'Not Interested'];
  statuses.forEach(s => {
    stats[s] = all.filter(l => l.outreachStatus === s).length;
  });
  return stats;
}

/** Clear all history */
export async function clearAllHistory() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEADS_STORE, 'readwrite');
    const store = tx.objectStore(LEADS_STORE);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
