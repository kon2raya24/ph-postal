# ph-postal

[![npm version](https://img.shields.io/npm/v/@ph-dev-utils/postal?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@ph-dev-utils/postal)
[![Packagist version](https://img.shields.io/packagist/v/phdevutils/postal?label=Packagist&color=f28d1a&logo=packagist&logoColor=white)](https://packagist.org/packages/phdevutils/postal)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made in PH](https://img.shields.io/badge/made%20in-🇵🇭%20Philippines-0038A8)](https://github.com/kon2raya24)

**Philippine ZIP / postal codes for JS + PHP**, with zero-dependency lookup helpers. Every ZIP joins to a PSGC city/municipality in [`@ph-dev-utils/core`](https://github.com/kon2raya24/ph-dev-utils), so you can walk `zip → city → province → region` (and on to barangays via [`@ph-dev-utils/psgc-barangays`](https://github.com/kon2raya24/ph-psgc-barangays)).

```bash
npm install @ph-dev-utils/postal       # JS
composer require phdevutils/postal      # PHP
```

## Packages

| Language | Package | Install |
|----------|---------|---------|
| JavaScript / TypeScript | `@ph-dev-utils/postal` | `npm i @ph-dev-utils/postal` |
| PHP | `phdevutils/postal` | `composer require phdevutils/postal` |

## JS usage

```ts
import {
  listPostalCodes, findPostalCodesByZip, findPostalCodesByCity, countPostalCodes,
} from '@ph-dev-utils/postal';

findPostalCodesByZip('1000');   // [{ zip:'1000', cityMun:'Manila', cityMunCode:'133900', region:'13', ... }]
findPostalCodesByCity('Davao City');
listPostalCodes({ region: '13' });        // all NCR ZIPs
listPostalCodes({ cityMunCode: '072217' }); // all Cebu City ZIPs
countPostalCodes();                        // 2048
```

## PHP usage

```php
use PhDevUtils\Postal\PostalCodes;

PostalCodes::findByZip('1000');                  // [['zip'=>'1000','cityMunCode'=>'133900', ...]]
PostalCodes::findByCity('Davao City');
PostalCodes::list(['region' => '13']);
PostalCodes::count();                            // 2048
```

## Joining to PSGC (the point)

Every entry's `cityMunCode` is a 6-digit PSGC code that matches `@ph-dev-utils/core`'s `CityMunicipality.code`:

```ts
import { findCityMunicipality } from '@ph-dev-utils/core';
import { findPostalCodesByZip } from '@ph-dev-utils/postal';

const zip = findPostalCodesByZip('6000')[0];     // Cebu City
const city = findCityMunicipality(zip.cityMunCode!); // { name: 'City of Cebu', province: '0722', region: '07', ... }
```

A CI integration test asserts **0 orphans** — every non-null `cityMunCode` joins a real core city/municipality.

## Important notes

- **ZIPs are not unique.** Metro Manila is district-level (many codes per city), Davao City has several, and some codes are shared — so `findPostalCodesByZip` returns an **array**.
- **NCR districts** (Binondo, Ermita, …) roll up to Manila city `133900`, with the district name in `area`.
- **~6% of entries have `cityMunCode: null`** — barangay-level or spelling-variant places; they still carry `region` (and usually `province`).
- Some multi-ZIP cities are partial in the source; institutional/PO-box ZIPs are excluded. See [`data/README.md`](data/README.md).

## Data & attribution

Dataset derived from **GeoNames** (CC BY 4.0) and joined to **PSA Q4 2024 PSGC**, reconciled against the PHLPost locator. **Community-sourced, not an official PHLPost feed** — verify against [PHLPost](https://phlpost.gov.ph) for production-critical use. See [`NOTICE`](NOTICE).

## Family

Part of `@ph-dev-utils` for Filipino devs:

- [`@ph-dev-utils/core`](https://github.com/kon2raya24/ph-dev-utils) — peso, govt IDs, phone, regions/provinces/**cities** (this package's join target), holidays
- [`@ph-dev-utils/psgc-barangays`](https://github.com/kon2raya24/ph-psgc-barangays) — full 42k PSGC barangay dataset
- [`@ph-dev-utils/payroll`](https://github.com/kon2raya24/ph-payroll) · [`@ph-dev-utils/bir`](https://github.com/kon2raya24/ph-bir) · [`@ph-dev-utils/dates`](https://github.com/kon2raya24/ph-dates) · [`@ph-dev-utils/faker`](https://github.com/kon2raya24/ph-faker)
- **`@ph-dev-utils/postal`** — this one

## License

MIT (code). Bundled data © GeoNames, CC BY 4.0 — see [`NOTICE`](NOTICE).
