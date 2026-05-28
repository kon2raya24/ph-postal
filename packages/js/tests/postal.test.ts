import { describe, it, expect } from 'vitest';
import {
  listPostalCodes,
  findPostalCodesByZip,
  findPostalCodesByCity,
  countPostalCodes,
} from '../src/postal';

describe('countPostalCodes', () => {
  it('counts all entries', () => {
    expect(countPostalCodes()).toBe(2037);
  });
  it('counts by region (NCR = 13)', () => {
    expect(countPostalCodes({ region: '13' })).toBe(360);
  });
  it('counts by parent city/municipality code', () => {
    expect(countPostalCodes({ cityMunCode: '133900' })).toBe(342); // Manila districts
  });
  it('counts by province', () => {
    expect(countPostalCodes({ province: '0722' })).toBe(54); // Cebu province
  });
});

describe('findPostalCodesByZip', () => {
  it('ZIP 1000 → Manila', () => {
    const r = findPostalCodesByZip('1000');
    expect(r.length).toBe(1);
    expect(r[0].cityMunCode).toBe('133900');
    expect(r[0].region).toBe('13');
  });
  it('ZIP 6000 → Cebu City', () => {
    expect(findPostalCodesByZip('6000')[0].cityMunCode).toBe('072217');
  });
  it('returns [] for blank/unknown', () => {
    expect(findPostalCodesByZip('')).toEqual([]);
    expect(findPostalCodesByZip('0000')).toEqual([]);
  });
});

describe('ZIPs are not unique', () => {
  it('there are more entries than distinct ZIP codes', () => {
    const distinct = new Set(listPostalCodes().map((e) => e.zip)).size;
    expect(distinct).toBeLessThan(countPostalCodes()); // multi-ZIP cities + shared codes
  });
});

describe('findPostalCodesByCity', () => {
  it('matches by city name (case-insensitive)', () => {
    const r = findPostalCodesByCity('cebu city');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((e) => e.cityMun.toLowerCase() === 'cebu city')).toBe(true);
  });
  it('can be scoped by filter', () => {
    expect(findPostalCodesByCity('Cebu City', { region: '99' })).toEqual([]);
  });
});

describe('listPostalCodes', () => {
  it('filters and returns a fresh array', () => {
    const ncr = listPostalCodes({ region: '13' });
    expect(ncr.length).toBe(360);
    expect(ncr.every((e) => e.region === '13')).toBe(true);
    ncr.pop();
    expect(listPostalCodes({ region: '13' }).length).toBe(360); // mutation-safe
  });
  it('every entry has a 2-digit region and a 4-digit zip', () => {
    for (const e of listPostalCodes()) {
      expect(e.region).toMatch(/^\d{2}$/);
      expect(e.zip).toMatch(/^\d{4}$/);
    }
  });
});
