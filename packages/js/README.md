# @ph-dev-utils/postal

[![npm version](https://img.shields.io/npm/v/@ph-dev-utils/postal?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@ph-dev-utils/postal)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

**Philippine ZIP / postal codes** with zero-dependency lookup helpers. Every ZIP joins to a PSGC city/municipality in [`@ph-dev-utils/core`](https://www.npmjs.com/package/@ph-dev-utils/core).

```bash
npm install @ph-dev-utils/postal
```

## API

```ts
import {
  listPostalCodes, findPostalCodesByZip, findPostalCodesByCity, countPostalCodes,
} from '@ph-dev-utils/postal';
```

### `PostalCode`

```ts
interface PostalCode {
  zip: string;              // 4-digit (NOT unique — multi-ZIP cities + shared codes exist)
  cityMun: string;          // city/municipality (or district) name
  cityMunCode: string | null; // 6-digit parent — joins @ph-dev-utils/core CityMunicipality.code; null if unmatched
  province: string | null;  // 4-digit, or null for NCR/HUC
  region: string;           // 2-digit
  area: string | null;      // district/locality detail for multi-ZIP cities, else null
}
```

### `findPostalCodesByZip(zip): PostalCode[]`

**Always returns an array** — PH ZIPs are not unique.

```ts
findPostalCodesByZip('1000'); // [{ zip:'1000', cityMun:'Manila', cityMunCode:'133900', region:'13', ... }]
findPostalCodesByZip('6000'); // Cebu City → cityMunCode '072217'
```

### `findPostalCodesByCity(name, filter?): PostalCode[]`

Case-insensitive name match, optionally scoped by `{ zip?, cityMunCode?, province?, region? }`.

```ts
findPostalCodesByCity('Davao City');
```

### `listPostalCodes(filter?): PostalCode[]`

```ts
listPostalCodes({ region: '13' });         // all NCR
listPostalCodes({ cityMunCode: '072217' }); // all Cebu City ZIPs
listPostalCodes({ province: '0722' });      // Cebu province
```

### `countPostalCodes(filter?): number`

```ts
countPostalCodes();                  // 2037
countPostalCodes({ region: '13' });  // 360
```

## Joining to PSGC

```ts
import { findCityMunicipality } from '@ph-dev-utils/core';
const zip = findPostalCodesByZip('6000')[0];
findCityMunicipality(zip.cityMunCode!); // { name: 'City of Cebu', province: '0722', region: '07', ... }
```

## Notes

- ZIPs are not unique; Metro Manila is district-level and rolls up to Manila city `133900`.
- ~6% of entries have `cityMunCode: null` (barangay-level / spelling-variant places); they still carry `region`.
- The dataset loads at runtime via `fs.readFileSync` (Node only).

## Data & attribution

Derived from **GeoNames** (CC BY 4.0) joined to **PSA Q4 2024 PSGC**, reconciled against the PHLPost locator. Community-sourced, not an official PHLPost feed — verify against [PHLPost](https://phlpost.gov.ph) for production-critical use.

## License

MIT (code). Bundled data © GeoNames, CC BY 4.0.
