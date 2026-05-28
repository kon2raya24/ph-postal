# Changelog

## [Unreleased]

## [0.1.0] - 2026-05-28

Initial release. Philippine ZIP/postal codes for JS + PHP, joined to PSGC cities/municipalities.

### Added

- **Lookup helpers** — `listPostalCodes`, `findPostalCodesByZip`, `findPostalCodesByCity`, `countPostalCodes` (JS) and `PhDevUtils\Postal\PostalCodes::list / findByZip / findByCity / count` (PHP). Filter by `{ zip, cityMunCode, province, region }`.
- **Dataset** — 2,037 entries derived from the GeoNames PH postal dump (CC BY 4.0), with each ZIP joined to a 6-digit PSGC `cityMunCode` via `@ph-dev-utils/core` (94% matched; unmatched entries are barangay-level/spelling-variant places and still carry region + province). NCR district-level ZIPs are included (Manila districts roll up to city `133900`). Geography-less institutional/PO-box ZIPs are excluded.
- **Cross-package contract** — integration tests (JS + PHP) assert every non-null `cityMunCode` joins a real `@ph-dev-utils/core` city/municipality (0 orphans) and that each entry's region matches its parent.
- Reproducible build via `scripts/build-data.mjs` over `scripts/geonames-PH.txt`.

### Notes

- **ZIPs are not unique** — multi-ZIP cities (Metro Manila districts, Davao City, etc.) and shared codes exist, so `findPostalCodesByZip` returns an array.
- ZIP data is community-sourced (GeoNames) + PHLPost-reconciled, **not** an official PHLPost feed. See NOTICE for GeoNames attribution.
- Some provincial multi-ZIP cities (e.g. Davao City) are partial in GeoNames — a top-up pass against PHLPost is planned for v0.2.
