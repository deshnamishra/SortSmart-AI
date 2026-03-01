// Persistence - scan history, eco-points, anti-misuse hashes
const STORAGE_KEY = 'ecoscan_records';
const HASH_KEY    = 'verdant_hashes';
const DAILY_KEY   = 'verdant_daily';

export const ECO_POINTS = {
  Recyclable:    5,
  Biodegradable: 7,
  Hazardous:     10,
  DailyBonus:    5,
};

// Green Credits formula: Credits = CO₂_saved × category_multiplier × 10
export const GREEN_CREDIT_MULTIPLIER = {
  Recyclable:    1.0,
  Biodegradable: 1.2,
  Hazardous:     2.0,
};

export function calcGreenCredits(co2Saved, category) {
  const mult = GREEN_CREDIT_MULTIPLIER[category] || 1.0;
  return Math.max(1, Math.round((co2Saved || 0) * mult * 10));
}

export function getRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function makeHash(file) { return file.name + '|' + file.size + '|' + file.lastModified; }
export function isDuplicate(file) {
  try { return (JSON.parse(localStorage.getItem(HASH_KEY)) || []).includes(makeHash(file)); }
  catch { return false; }
}
function storeHash(file) {
  try {
    const list = JSON.parse(localStorage.getItem(HASH_KEY)) || [];
    const h = makeHash(file);
    if (!list.includes(h)) localStorage.setItem(HASH_KEY, JSON.stringify([h, ...list].slice(0, 300)));
  } catch {}
}

export function claimDailyBonus() {
  const today = new Date().toDateString();
  try {
    if (localStorage.getItem(DAILY_KEY) === today) return false;
    localStorage.setItem(DAILY_KEY, today);
    return true;
  } catch { return false; }
}

export function addRecord(category, guidance, file, co2Saved = 0, objectDetected = null) {
  const records = getRecords();
  const points  = ECO_POINTS[category] || 5;
  const greenCredits = calcGreenCredits(co2Saved, category);
  const record  = {
    id: Date.now(),
    category,
    guidance,
    timestamp: new Date().toISOString(),
    ecoPoints: points,
    co2_saved: co2Saved || 0,
    green_credits: greenCredits,
    object_detected: objectDetected || null,
    zone: 'Zone A',          // scalable to GPS-based zone later
  };
  records.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 500)));
  if (file) storeHash(file);
  return record;
}

export function getTotalGreenCredits(records) {
  return records.reduce((sum, r) => sum + (r.green_credits || 0), 0);
}

export function getTotalCO2(records) {
  return records.reduce((sum, r) => sum + (r.co2_saved || 0), 0);
}

export function getTotalEcoPoints(records) {
  return records.reduce((sum, r) => sum + (r.ecoPoints != null ? r.ecoPoints : (ECO_POINTS[r.category] || 5)), 0);
}

export function clearRecords() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(HASH_KEY);
  localStorage.removeItem(DAILY_KEY);
}
