<?php

declare(strict_types=1);

namespace PhDevUtils\Postal;

/**
 * Lookup helpers over Philippine ZIP/postal codes (GeoNames CC BY 4.0, joined to
 * PSA Q4 2024 PSGC cities/municipalities via phdevutils/core).
 *
 * Each entry is an associative array:
 *   [
 *     'zip'         => string,  // 4-digit (not unique)
 *     'cityMun'     => string,
 *     'cityMunCode' => ?string, // 6-digit parent (joins phdevutils/core cities), or null if unmatched
 *     'province'    => ?string, // 4-digit, or null for NCR/HUC
 *     'region'      => string,  // 2-digit
 *     'area'        => ?string, // district/locality detail, or null
 *   ]
 */
final class PostalCodes
{
    /** @var list<array{zip:string,cityMun:string,cityMunCode:?string,province:?string,region:string,area:?string}>|null */
    private static ?array $all = null;

    private static function all(): array
    {
        if (self::$all === null) {
            $data = DataLoader::load('postal-codes-2024');
            self::$all = $data['postal_codes'];
        }
        return self::$all;
    }

    private static function passes(array $e, array $filter): bool
    {
        if (array_key_exists('zip', $filter) && $e['zip'] !== $filter['zip']) {
            return false;
        }
        if (array_key_exists('cityMunCode', $filter) && $e['cityMunCode'] !== $filter['cityMunCode']) {
            return false;
        }
        if (array_key_exists('province', $filter) && $e['province'] !== $filter['province']) {
            return false;
        }
        if (array_key_exists('region', $filter) && $e['region'] !== $filter['region']) {
            return false;
        }
        return true;
    }

    /**
     * List postal codes, optionally filtered.
     *
     * @param array{zip?:string, cityMunCode?:string, province?:?string, region?:string} $filter
     */
    public static function list(array $filter = []): array
    {
        if ($filter === []) {
            return self::all();
        }
        return array_values(array_filter(self::all(), static fn ($e) => self::passes($e, $filter)));
    }

    /**
     * Find all entries for a ZIP code. Always returns a list — PH ZIPs are not unique.
     *
     * @return list<array{zip:string,cityMun:string,cityMunCode:?string,province:?string,region:string,area:?string}>
     */
    public static function findByZip(string $zip): array
    {
        $q = trim($zip);
        if ($q === '') {
            return [];
        }
        return array_values(array_filter(self::all(), static fn ($e) => $e['zip'] === $q));
    }

    /**
     * Find all postal codes whose city/municipality name matches (case-insensitive),
     * optionally scoped by filter.
     *
     * @param array{zip?:string, cityMunCode?:string, province?:?string, region?:string} $filter
     */
    public static function findByCity(string $name, array $filter = []): array
    {
        $q = trim($name);
        if ($q === '') {
            return [];
        }
        $ql = mb_strtolower($q);
        return array_values(array_filter(
            self::list($filter),
            static fn ($e) => mb_strtolower($e['cityMun']) === $ql,
        ));
    }

    /**
     * Count postal codes matching a filter (or all of them).
     *
     * @param array{zip?:string, cityMunCode?:string, province?:?string, region?:string} $filter
     */
    public static function count(array $filter = []): int
    {
        if ($filter === []) {
            return count(self::all());
        }
        return count(self::list($filter));
    }
}
