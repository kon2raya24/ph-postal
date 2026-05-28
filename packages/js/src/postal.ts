import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export interface PostalCode {
  /** 4-digit PHLPost ZIP code. Not unique — multi-ZIP cities and shared codes exist. */
  zip: string;
  /** City/municipality (or district/area) name as listed by the data source. */
  cityMun: string;
  /** 6-digit parent city/municipality code — joins `@ph-dev-utils/core`'s `CityMunicipality.code`. `null` when unmatched (barangay-level / spelling-variant places). */
  cityMunCode: string | null;
  /** 4-digit province code, or `null` for NCR/HUC. */
  province: string | null;
  /** 2-digit region code. */
  region: string;
  /** District/locality detail for multi-ZIP cities (NCR districts, etc.), else `null`. */
  area: string | null;
}

const dataPath = join(dirname(fileURLToPath(import.meta.url)), '../data/postal-codes-2024.json');
const postalCodes: PostalCode[] = (
  JSON.parse(readFileSync(dataPath, 'utf-8')) as { postal_codes: PostalCode[] }
).postal_codes;

export interface PostalFilter {
  /** 4-digit ZIP code. */
  zip?: string;
  /** 6-digit parent city/municipality code. */
  cityMunCode?: string;
  /** 4-digit province code (`null` matches NCR/HUC entries). */
  province?: string | null;
  /** 2-digit region code. */
  region?: string;
}

function matches(e: PostalCode, filter: PostalFilter): boolean {
  if (filter.zip !== undefined && e.zip !== filter.zip) return false;
  if (filter.cityMunCode !== undefined && e.cityMunCode !== filter.cityMunCode) return false;
  if (filter.province !== undefined && e.province !== filter.province) return false;
  if (filter.region !== undefined && e.region !== filter.region) return false;
  return true;
}

/**
 * List postal codes, optionally filtered. Source: GeoNames PH dump (CC BY 4.0),
 * joined to PSA Q4 2024 PSGC cities/municipalities.
 *
 * @example
 *   listPostalCodes({ region: '13' });        // all NCR ZIPs
 *   listPostalCodes({ cityMunCode: '072217' }); // all Cebu City ZIPs
 *   listPostalCodes({ zip: '1000' });           // entries for ZIP 1000
 */
export function listPostalCodes(filter: PostalFilter = {}): PostalCode[] {
  return postalCodes.filter((e) => matches(e, filter));
}

/**
 * Find all entries for a ZIP code. **Always returns an array** — PH ZIPs are not
 * unique (multi-ZIP cities, shared codes, and district-level NCR codes all exist).
 *
 * @example
 *   findPostalCodesByZip('1000'); // [{ zip: '1000', cityMun: 'Manila', cityMunCode: '133900', ... }]
 */
export function findPostalCodesByZip(zip: string): PostalCode[] {
  if (typeof zip !== 'string' || !zip.trim()) return [];
  const q = zip.trim();
  return postalCodes.filter((e) => e.zip === q);
}

/**
 * Find all postal codes whose city/municipality name matches (case-insensitive),
 * optionally scoped by filter. Returns an array (a city can have several ZIPs).
 *
 * @example
 *   findPostalCodesByCity('Davao City');      // Davao City's ZIPs
 *   findPostalCodesByCity('San Isidro', { region: '04' });
 */
export function findPostalCodesByCity(name: string, filter: PostalFilter = {}): PostalCode[] {
  if (typeof name !== 'string' || !name.trim()) return [];
  const q = name.trim().toLowerCase();
  return listPostalCodes(filter).filter((e) => e.cityMun.toLowerCase() === q);
}

/** Count postal codes matching a filter (or all of them). */
export function countPostalCodes(filter: PostalFilter = {}): number {
  if (Object.keys(filter).length === 0) return postalCodes.length;
  let n = 0;
  for (const e of postalCodes) if (matches(e, filter)) n++;
  return n;
}
