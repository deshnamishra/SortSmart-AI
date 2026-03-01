// ─────────────────────────────────────────────
// API service – calls FastAPI backend at /predict
// ─────────────────────────────────────────────
// Default to relative URL so CRA proxy works in dev
// and so the integrated FastAPI server can serve the UI + API on one origin.
const API_BASE = process.env.REACT_APP_API_URL || '';

async function maybeConvertToJpeg(imageFile) {
  const name = (imageFile?.name || '').toLowerCase();
  const type = (imageFile?.type || '').toLowerCase();
  const isAvif = type === 'image/avif' || name.endsWith('.avif');
  if (!isAvif) return imageFile;

  // Roboflow hosted API rejects AVIF uploads; convert to JPEG in-browser.
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(imageFile);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Your browser cannot decode this AVIF image'));
    i.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Failed to convert AVIF to JPEG');

  return new File([blob], imageFile.name.replace(/\.avif$/i, '.jpg') || 'upload.jpg', { type: 'image/jpeg' });
}

/**
 * Send an image File to the backend and receive a prediction.
 * @param {File} imageFile
 * @returns {Promise<{prediction: string, confidence: number}>}
 */
export async function classifyWaste(imageFile) {
  const fileToSend = await maybeConvertToJpeg(imageFile);
  const formData = new FormData();
  formData.append('file', fileToSend, fileToSend.name);

  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Prediction failed');
  }

  return response.json();
}

// ─────────────────────────────────────────────
// Per-material real-world impact values (per item)
// ─────────────────────────────────────────────
export const OBJECT_IMPACT = {
  // ── Recyclable ──
  plastic: {
    co2Saved: 0.27, energySaved: 0.10, landfillSaved: 0.50, treeDays: 0.2,
    bin: '🔵 Blue Recycling Bin',
    guidance: 'Rinse the plastic item and remove any food residue. Flatten bottles to save space. Remove the cap separately — it may go in a different stream. Place in the blue recycling bin.',
  },
  glass: {
    co2Saved: 0.30, energySaved: 0.08, landfillSaved: 0.40, treeDays: 0.2,
    bin: '🔵 Blue Recycling Bin',
    guidance: 'Rinse the glass container thoroughly. Do NOT wrap in plastic or paper. Remove metal lids. Place carefully in the blue recycling bin — broken glass should be wrapped in newspaper first.',
  },
  metal: {
    co2Saved: 0.90, energySaved: 3.50, landfillSaved: 0.30, treeDays: 0.6,
    bin: '🔵 Blue Recycling Bin',
    guidance: 'Rinse the metal can or foil. Crush cans to save space. Aluminium foil should be scrunched into a ball before recycling. Place in the blue recycling bin — metal recycling saves up to 95% energy.',
  },
  cardboard: {
    co2Saved: 0.70, energySaved: 0.50, landfillSaved: 0.60, treeDays: 0.4,
    bin: '🔵 Blue Recycling Bin',
    guidance: 'Flatten all cardboard boxes to save space. Remove any plastic tape, bubble wrap, or polystyrene inserts. If the cardboard is wet or soiled with food, dispose it in the green compost bin instead.',
  },
  cloth: {
    co2Saved: 2.00, energySaved: 1.20, landfillSaved: 0.80, treeDays: 1.0,
    bin: '🟡 Textile Donation / Recycling Bank',
    guidance: 'If still wearable, donate to a charity or textile bank. For worn-out cloth, drop at a fabric recycling point. Never throw textiles in general waste — synthetic fibres take 200+ years to decompose.',
  },
  // ── Biodegradable ──
  paper: {
    co2Saved: 0.50, energySaved: 0.30, landfillSaved: 0.70, treeDays: 0.5,
    bin: '🔵 Blue Recycling Bin',
    guidance: 'Keep paper dry and free of food grease. Newspapers, office paper and envelopes go in the blue recycling bin. Soiled paper (e.g. used tissues or greasy pizza boxes) should go in the green compost bin.',
  },
  biodegradable: {
    co2Saved: 0.40, energySaved: 0.00, landfillSaved: 0.90, treeDays: 0.6,
    bin: '🟢 Green Compost Bin',
    guidance: 'Place food scraps, fruit peels, vegetable waste and plant matter in the green compost bin or a home compost pit. Do NOT mix with plastics or metals. Composting produces rich fertiliser and prevents harmful landfill methane.',
  },
  // ── Hazardous ──
  battery: {
    co2Saved: 0.05, energySaved: 0.00, landfillSaved: 0.15, treeDays: 0.0,
    bin: '🔴 Battery Collection Point',
    guidance: 'NEVER throw batteries in regular bins — they contain lead, mercury and cadmium that leach into soil and water. Take to a designated battery drop-off point (most supermarkets and electronics stores have one).',
  },
  charger: {
    co2Saved: 0.15, energySaved: 0.20, landfillSaved: 0.20, treeDays: 0.1,
    bin: '🔴 E-Waste Collection Centre',
    guidance: 'Chargers contain copper wiring and circuit boards that are recyclable. Do NOT bin them. Drop at an e-waste collection centre or a manufacturer take-back programme. Some retailers offer exchange schemes.',
  },
  electronic: {
    co2Saved: 0.80, energySaved: 0.60, landfillSaved: 0.50, treeDays: 0.3,
    bin: '🔴 E-Waste Collection Centre',
    guidance: 'Electronic devices contain rare metals (gold, palladium, lithium) and toxic substances. Take to a certified e-waste recycler or manufacturer take-back point. Wipe personal data before disposal. Never incinerate.',
  },
};

// ─────────────────────────────────────────────
// Environmental impact constants (per category — fallback)
// ─────────────────────────────────────────────
export const IMPACT = {
  Recyclable: {
    co2Saved: 0.85,      // kg CO₂ per item
    energySaved: 1.4,    // kWh
    landfillSaved: 0.5,  // kg
    treeDays: 0.3,       // tree-days equivalent
    bin: '🔵 Blue Recycling Bin',
    guidance: 'Clean the item, flatten cardboard, remove lids. Place in the recycling bin.',
    color: '#3a86ff',
    bg: '#e0ecff',
    icon: '♻️',
  },
  Biodegradable: {
    co2Saved: 0.45,
    energySaved: 0.0,
    landfillSaved: 0.8,
    treeDays: 0.5,
    bin: '🟢 Green Compost Bin',
    guidance: 'Ideal for composting. Dispose in the green bin or compost pit. Do not mix with plastics.',
    color: '#40916c',
    bg: '#d8f3dc',
    icon: '🌿',
  },
  Hazardous: {
    co2Saved: 0.1,
    energySaved: 0.0,
    landfillSaved: 0.2,
    treeDays: 0.1,
    bin: '🔴 Red Hazardous Waste Collection Point',
    guidance: 'Do NOT dispose in regular bins. Take to the nearest hazardous waste facility or collection drive.',
    color: '#e63946',
    bg: '#fde8ea',
    icon: '⚠️',
  },
};

/**
 * Calculate cumulative environmental impact from a list of scan records.
 * @param {Array<{category:string}>} records
 */
export function calcImpact(records) {
  return records.reduce(
    (acc, r) => {
      const imp = IMPACT[r.category] || {};
      acc.co2 += imp.co2Saved || 0;
      acc.energy += imp.energySaved || 0;
      acc.landfill += imp.landfillSaved || 0;
      acc.trees += imp.treeDays || 0;
      return acc;
    },
    { co2: 0, energy: 0, landfill: 0, trees: 0 }
  );
}

/**
 * Calculate sustainability score (0–100).
 */
export function calcEcoScore(records) {
  if (!records.length) return 0;
  const recyclable   = records.filter(r => r.category === 'Recyclable').length;
  const biodegradable= records.filter(r => r.category === 'Biodegradable').length;
  const hazardous    = records.filter(r => r.category === 'Hazardous').length;
  const total = records.length;

  const recyclingRate    = (recyclable / total) * 40;
  const disposalRate     = ((recyclable + biodegradable) / total) * 40;
  const hazardousCompliance = hazardous === 0 ? 20 : Math.max(0, 20 - (hazardous / total) * 40);

  return Math.round(recyclingRate + disposalRate + hazardousCompliance);
}

/**
 * Generate AI-style insight strings from records.
 */
export function generateInsights(records) {
  if (records.length < 3) return ['Scan more items to unlock AI insights.'];

  const insights = [];
  const recyclable   = records.filter(r => r.category === 'Recyclable').length;
  const biodegradable= records.filter(r => r.category === 'Biodegradable').length;
  const hazardous    = records.filter(r => r.category === 'Hazardous').length;
  const total = records.length;

  const recyclingRate = ((recyclable / total) * 100).toFixed(0);
  insights.push(`♻️  ${recyclingRate}% of your waste is recyclable — great effort!`);

  if (hazardous > 0) {
    insights.push(`⚠️  ${hazardous} hazardous item(s) detected. Always use designated collection points.`);
  }
  if (biodegradable > recyclable) {
    insights.push('🌿  Most of your waste is organic — consider starting a compost pit!');
  }

  // Peak time
  const hours = records.map(r => new Date(r.timestamp).getHours());
  const peakHour = hours.sort((a,b) =>
    hours.filter(v=>v===b).length - hours.filter(v=>v===a).length
  )[0];
  if (peakHour !== undefined) {
    insights.push(`🕐  Peak scanning time: ${peakHour}:00 – ${peakHour+1}:00.`);
  }

  insights.push('🌍  You are contributing to a cleaner, greener city. Keep it up!');
  return insights;
}
