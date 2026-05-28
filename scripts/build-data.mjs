// Builds data/postal-codes-2024.json from the GeoNames PH postal dump (CC BY 4.0),
// joining each ZIP to a PSGC city/municipality code via @ph-dev-utils/core.
//
// Source : scripts/geonames-PH.txt  (https://download.geonames.org/export/zip/PH.zip)
// Join   : place name + province context -> core CityMunicipality.code (6-digit PSGC)
// Output : data/postal-codes-2024.json  (+ copy into packages/js/data/)
//
// Run from repo root: node scripts/build-data.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  listCitiesMunicipalities,
  listProvinces,
  listRegions,
} from '@ph-dev-utils/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(__dirname, 'geonames-PH.txt');

// ---- core reference data ----------------------------------------------------
const cities = listCitiesMunicipalities();
const provinces = listProvinces();
const regions = listRegions();

const VERIFIED_ON = '2026-05-28';

// Expand the common PH place-name abbreviations GeoNames uses but PSA spells out.
function expandAbbrev(tokens) {
  const map = { sta: 'santa', sto: 'santo', gen: 'general' };
  return tokens.map((t) => map[t] ?? t);
}

// Normalize a city/municipality name for matching: lowercase, strip the PSA
// "City of X" prefix and "X City" suffix, drop punctuation, collapse spaces,
// expand Sta./Sto./Gen. abbreviations.
// Mirrors @ph-dev-utils/core's findCityMunicipality normalization so both sides agree.
function normCity(name) {
  let s = (name ?? '').toLowerCase().trim();
  s = s.replace(/^city of\s+/, '').replace(/\s+city$/, '');
  s = s.replace(/[().,'’-]/g, ' ').replace(/\s+/g, ' ').trim();
  s = expandAbbrev(s.split(' ')).join(' ');
  return s;
}

// GeoNames admin1 (region) name -> PSGC region code, for rows whose province
// name fails to match core (keeps region populated even when cityMunCode is null).
const regionByGeoName = new Map([
  ['ilocos', '01'], ['cagayan valley', '02'], ['central luzon', '03'],
  ['calabarzon', '04'], ['mimaropa', '17'], ['bicol', '05'],
  ['western visayas', '06'], ['central visayas', '07'], ['eastern visayas', '08'],
  ['zamboanga peninsula', '09'], ['northern mindanao', '10'], ['davao', '11'],
  ['soccsksargen', '12'], ['caraga', '16'], ['metro manila', '13'],
  ['cordillera', '14'], ['autonomous region in muslim mindanao', '15'],
]);

function normProv(name) {
  return (name ?? '')
    .toLowerCase()
    .replace(/^province of\s+/, '')
    .replace(/[().,'’-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// province name -> { code, region }
const provByName = new Map();
for (const p of provinces) provByName.set(normProv(p.name), { code: p.code, region: p.region });

// code -> city entry (for the multi-ZIP top-up overlay)
const cityByCode = new Map(cities.map((c) => [c.code, c]));

// normalized city name -> [cityEntry...]
const cityByName = new Map();
for (const c of cities) {
  const k = normCity(c.name);
  if (!cityByName.has(k)) cityByName.set(k, []);
  cityByName.get(k).push(c);
}

// NCR cities (region 13) for name-prefix matching of "Quezon City CPO" etc.
const ncrCities = cities.filter((c) => c.region === '13');

// ---- parse GeoNames ---------------------------------------------------------
// TSV columns: country, postal, place, admin1name, admin1code, admin2name, admin2code, admin3name, admin3code, lat, lon, acc
const rows = readFileSync(SRC, 'utf-8')
  .split('\n')
  .map((l) => l.replace(/\r$/, ''))
  .filter((l) => l.trim() !== '')
  .map((l) => l.split('\t'));

// Strip GeoNames noise from a place name to expose the underlying city/mun name.
function cleanPlace(place) {
  let s = (place ?? '').trim();
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2'); // de-camelCase: "SantoTomas" -> "Santo Tomas"
  s = s.replace(/\([^)]*\)/g, ' '); // parentheticals
  s = s.replace(/\s+-\s+.*$/, ''); // " - Santa Elena - ..." trailing detail
  s = s.replace(/\bP\.?\s?O\.?\s?Boxes?\b/gi, ' ');
  s = s.replace(/\bC\.?P\.?O\.?\b/gi, ' '); // Central Post Office marker
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

const out = [];
const unmatched = [];
let manilaDistricts = 0;
let droppedInstitutional = 0;

for (const r of rows) {
  const [, zip, place, , admin1code, admin2name] = r;
  if (!zip) continue;

  // Drop geography-less institutional/PO-box ZIPs (empty region in GeoNames):
  // ADB, Camp Crame, SSS, bible schools, etc. — not city/municipality localities.
  if (!admin1code) {
    droppedInstitutional++;
    continue;
  }

  const isNCR = admin1code === 'NCR';
  const cleaned = cleanPlace(place);

  let cityMunCode = null;
  let province = null;
  let region = null;
  let area = null;

  if (isNCR) {
    region = '13';
    // Try to match an NCR city by name or name-prefix (handles "Quezon City CPO").
    const nk = normCity(cleaned);
    const match =
      ncrCities.find((c) => normCity(c.name) === nk) ||
      ncrCities.find((c) => nk.startsWith(normCity(c.name)) || normCity(c.name).startsWith(nk));
    if (match) {
      cityMunCode = match.code;
      province = match.province; // null for NCR
      // keep a sub-area note only when the place carried extra detail beyond the city name
      area = normCity(cleaned) === normCity(match.name) ? null : place;
    } else {
      // Manila district (Binondo, Ermita, Sampaloc, ...): roll up to Manila city 133900.
      cityMunCode = '133900';
      province = null;
      area = place;
      manilaDistricts++;
    }
  } else {
    const prov = provByName.get(normProv(admin2name));
    if (prov) {
      province = prov.code;
      region = prov.region;
    } else {
      // Province name didn't match core — fall back to region via GeoNames admin1 name.
      region = regionByGeoName.get((r[3] ?? '').toLowerCase()) ?? null;
    }
    const candidates = cityByName.get(normCity(cleaned)) ?? [];
    let match = null;
    if (prov) {
      match = candidates.find((c) => c.province === prov.code);
      if (!match && region) match = candidates.find((c) => c.region === region);
    }
    if (!match && candidates.length === 1) match = candidates[0];
    if (match) {
      cityMunCode = match.code;
      province = match.province;
      region = match.region;
    } else {
      unmatched.push({ zip, place, admin2name });
    }
  }

  out.push({
    zip,
    cityMun: cleaned || place,
    cityMunCode,
    province: province ?? null,
    region: region ?? null,
    area: area ?? null,
  });
}

// ---- merge hand-curated multi-ZIP top-up overlay -----------------------------
// GeoNames under-covers some multi-ZIP cities (e.g. Davao City). The overlay adds
// the missing ZIPs, keyed by exact PSGC cityMunCode; region/province come from core.
const TOPUP = join(__dirname, 'topup-multizip.json');
let toppedUp = 0;
let topupSource = null;
try {
  const topup = JSON.parse(readFileSync(TOPUP, 'utf-8'));
  topupSource = topup._meta?.sources ?? null;
  const seen = new Set(out.map((e) => `${e.zip}|${e.cityMunCode}`));
  for (const t of topup.entries) {
    const key = `${t.zip}|${t.cityMunCode}`;
    if (seen.has(key)) continue;
    const city = cityByCode.get(t.cityMunCode);
    if (!city) {
      console.warn(`topup skip: cityMunCode ${t.cityMunCode} not in core (zip ${t.zip})`);
      continue;
    }
    out.push({
      zip: t.zip,
      cityMun: t.cityMun ?? city.name,
      cityMunCode: t.cityMunCode,
      province: city.province ?? null,
      region: city.region,
      area: t.area ?? null,
    });
    seen.add(key);
    toppedUp++;
  }
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

// stable sort: zip, then city name
out.sort((a, b) => (a.zip < b.zip ? -1 : a.zip > b.zip ? 1 : a.cityMun.localeCompare(b.cityMun)));

const matched = out.filter((e) => e.cityMunCode !== null).length;
const payload = {
  _meta: {
    source: 'GeoNames Philippines postal-code dump (CC BY 4.0)',
    source_url: 'https://download.geonames.org/export/zip/PH.zip',
    license: 'CC BY 4.0 — © GeoNames (https://www.geonames.org)',
    join: 'cityMunCode joined to PSA Q4 2024 PSGC via @ph-dev-utils/core (name + province context)',
    multizip_topup: topupSource,
    verified_on: VERIFIED_ON,
    count: out.length,
    matched_to_psgc: matched,
    topup_entries: toppedUp,
    schema: {
      zip: '4-digit PHLPost ZIP code (not unique — multi-ZIP cities + shared codes exist)',
      cityMun: 'city/municipality (or district/area) name as listed by GeoNames',
      cityMunCode: '6-digit PSGC parent — joins @ph-dev-utils/core CityMunicipality.code; null when unmatched',
      province: '4-digit PSGC province code, or null for NCR/HUC',
      region: '2-digit PSGC region code',
      area: 'district/locality detail for multi-ZIP cities (NCR districts, etc.), else null',
    },
    notes: [
      'ZIP data is community-sourced (GeoNames) + PHLPost-reconciled, NOT an official PHLPost feed.',
      'NCR district-level ZIPs are included; Manila districts roll up to Manila city 133900.',
      'Some provincial multi-ZIP cities (e.g. Davao City) are partial in GeoNames — top-up planned for v0.2.',
      'Geography-less institutional/PO-box ZIPs (e.g. ADB, Camp Crame, SSS) are excluded — not city/municipality localities.',
      'Unmatched entries (cityMunCode null) are mostly barangay-level or spelling-variant places; region/province are still populated where known.',
    ],
  },
  postal_codes: out,
};

mkdirSync(join(ROOT, 'data'), { recursive: true });
mkdirSync(join(ROOT, 'packages/js/data'), { recursive: true });
const json = JSON.stringify(payload, null, 2) + '\n';
writeFileSync(join(ROOT, 'data/postal-codes-2024.json'), json);
writeFileSync(join(ROOT, 'packages/js/data/postal-codes-2024.json'), json);

console.log(`rows in           : ${rows.length}`);
console.log(`dropped (instit.) : ${droppedInstitutional}`);
console.log(`entries out       : ${out.length}`);
console.log(`matched to PSGC   : ${matched} (${((matched / out.length) * 100).toFixed(1)}%)`);
console.log(`  NCR Manila dist : ${manilaDistricts} -> 133900`);
console.log(`multi-ZIP top-up  : +${toppedUp} entries`);
console.log(`unmatched (null)  : ${unmatched.length}`);
console.log(`null region rows  : ${out.filter((e) => e.region === null).length}`);
console.log(`distinct regions  : ${[...new Set(out.map((e) => e.region))].filter(Boolean).sort().join(',')}`);
if (unmatched.length) {
  console.log('--- sample unmatched (expected: barangays / installations / spelling variants) ---');
  for (const u of unmatched.slice(0, 30)) console.log(`  ${u.zip}  ${u.place}  | prov="${u.admin2name}"`);
}
