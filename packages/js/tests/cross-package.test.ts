/**
 * Cross-package integration test: every postal code with a non-null cityMunCode
 * must join a real cities/municipalities entry in @ph-dev-utils/core. This is the
 * load-bearing contract — a future PSGC release on either side must keep them in sync.
 */
import { describe, it, expect } from 'vitest';
import { listCitiesMunicipalities, findCityMunicipality } from '@ph-dev-utils/core';
import { listPostalCodes, countPostalCodes } from '../src/postal';

describe('cross-package join with @ph-dev-utils/core', () => {
  it('every non-null cityMunCode joins a real city/municipality (0 orphans)', () => {
    const cityCodes = new Set(listCitiesMunicipalities().map((c) => c.code));
    const orphans = listPostalCodes()
      .filter((e) => e.cityMunCode !== null)
      .filter((e) => !cityCodes.has(e.cityMunCode as string));
    expect(orphans).toEqual([]);
  });

  it("each entry's region matches its parent city/municipality region", () => {
    const byCode = new Map(listCitiesMunicipalities().map((c) => [c.code, c]));
    const mismatches = listPostalCodes()
      .filter((e) => e.cityMunCode !== null)
      .filter((e) => byCode.get(e.cityMunCode as string)!.region !== e.region);
    expect(mismatches).toEqual([]);
  });

  it('Manila: ZIP 1000 + all districts roll up to city 133900', () => {
    const manila = findCityMunicipality('Manila');
    expect(manila?.code).toBe('133900');
    expect(countPostalCodes({ cityMunCode: '133900' })).toBe(342);
  });

  it('Cebu City: ZIPs join via core lookup', () => {
    const cebu = findCityMunicipality('Cebu City');
    expect(cebu).not.toBeNull();
    const zips = listPostalCodes({ cityMunCode: cebu!.code });
    expect(zips.length).toBeGreaterThan(0);
    expect(zips.every((e) => e.cityMunCode === cebu!.code)).toBe(true);
  });
});
