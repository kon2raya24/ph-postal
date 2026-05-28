# ph-postal data

## `postal-codes-2024.json`

Philippine ZIP/postal codes (2,048 entries), derived from the **GeoNames PH postal dump** (CC BY 4.0), joined to the **PSA Q4 2024 PSGC** cities/municipalities via [`@ph-dev-utils/core`](https://github.com/kon2raya24/ph-dev-utils), plus a hand-curated multi-ZIP top-up (`../scripts/topup-multizip.json`).

- Source: [GeoNames PH.zip](https://download.geonames.org/export/zip/PH.zip) — © GeoNames, CC BY 4.0 (see `../NOTICE`)
- Join: `cityMunCode` matched by place name + province context
- Verified: 2026-05-28
- Reproducible via `../scripts/build-data.mjs`

### Schema

```jsonc
{
  "zip": "1000",            // 4-digit PHLPost ZIP (NOT unique — multi-ZIP cities + shared codes exist)
  "cityMun": "Manila",      // city/municipality (or district/area) name as listed
  "cityMunCode": "133900",  // 6-digit PSGC parent — joins @ph-dev-utils/core CityMunicipality.code; null if unmatched
  "province": null,         // 4-digit province code, or null for NCR/HUC
  "region": "13",           // 2-digit region code
  "area": null              // district/locality detail for multi-ZIP cities, else null
}
```

### Caveats

- **Community-sourced, not official.** GeoNames data reconciled against the PHLPost locator — verify against [PHLPost](https://phlpost.gov.ph) for production-critical use.
- **NCR is district-level**; Manila districts (Binondo, Ermita, …) roll up to Manila city `133900` with the district name in `area`.
- **~6% of entries have `cityMunCode: null`** — barangay-level or spelling-variant places that don't resolve to a city/municipality. They still carry `region` (and usually `province`).
- **Some multi-ZIP cities are partial** (GeoNames lists fewer codes than PHLPost for e.g. Davao City) — top-up planned for v0.2.
- **Institutional/PO-box ZIPs excluded** (ADB, Camp Crame, SSS, etc. — not geographic localities).
