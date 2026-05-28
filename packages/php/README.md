# phdevutils/postal

[![Packagist version](https://img.shields.io/packagist/v/phdevutils/postal?label=Packagist&color=f28d1a&logo=packagist&logoColor=white)](https://packagist.org/packages/phdevutils/postal)
[![npm version](https://img.shields.io/npm/v/@ph-dev-utils/postal?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@ph-dev-utils/postal)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/kon2raya24/ph-postal/blob/main/LICENSE)

**Philippine ZIP / postal codes** with zero-dependency lookup helpers. Every ZIP joins to a PSGC city/municipality in [`phdevutils/core`](https://packagist.org/packages/phdevutils/core).

```bash
composer require phdevutils/postal
```

## Usage

```php
use PhDevUtils\Postal\PostalCodes;

// Find by ZIP — always returns a list (PH ZIPs are not unique)
PostalCodes::findByZip('1000');   // [['zip'=>'1000','cityMun'=>'Manila','cityMunCode'=>'133900','region'=>'13', ...]]
PostalCodes::findByZip('6000');   // Cebu City → cityMunCode '072217'

// Find by city name (case-insensitive), optional filter
PostalCodes::findByCity('Davao City');

// List / count, filter by { zip, cityMunCode, province, region }
PostalCodes::list(['region' => '13']);          // all NCR
PostalCodes::list(['cityMunCode' => '072217']);  // all Cebu City ZIPs
PostalCodes::count();                            // 2037
PostalCodes::count(['region' => '13']);          // 360
```

Each entry is an associative array:

```php
[
  'zip'         => '1000',
  'cityMun'     => 'Manila',
  'cityMunCode' => '133900', // 6-digit PSGC parent (joins phdevutils/core), or null if unmatched
  'province'    => null,     // 4-digit, or null for NCR/HUC
  'region'      => '13',     // 2-digit
  'area'        => null,     // district/locality detail, or null
]
```

## Joining to PSGC

```php
use PhDevUtils\Address;

$zip  = PostalCodes::findByZip('6000')[0];
$city = Address::findCityMunicipality($zip['cityMunCode']); // ['name' => 'City of Cebu', 'province' => '0722', ...]
```

## Notes

- ZIPs are not unique; Metro Manila is district-level and rolls up to Manila city `133900`.
- ~6% of entries have `cityMunCode` null (barangay-level / spelling-variant places); they still carry `region`.

## Data & attribution

Derived from **GeoNames** (CC BY 4.0) joined to **PSA Q4 2024 PSGC**, reconciled against the PHLPost locator. Community-sourced, not an official PHLPost feed — verify against [PHLPost](https://phlpost.gov.ph) for production-critical use.

## License

MIT (code). Bundled data © GeoNames, CC BY 4.0.
