<?php

declare(strict_types=1);

namespace PhDevUtils\Postal\Tests;

use PhDevUtils\Address;
use PhDevUtils\Postal\PostalCodes;
use PHPUnit\Framework\TestCase;

/**
 * Cross-package integration test: every postal code with a non-null cityMunCode
 * must join a real city/municipality entry in phdevutils/core. Load-bearing contract.
 */
final class CrossPackageTest extends TestCase
{
    public function testEveryCityMunCodeJoinsRealCity(): void
    {
        $cityCodes = array_flip(array_column(Address::listCitiesMunicipalities(), 'code'));
        $orphans = [];
        foreach (PostalCodes::list() as $e) {
            if ($e['cityMunCode'] !== null && !isset($cityCodes[$e['cityMunCode']])) {
                $orphans[] = $e['zip'];
            }
        }
        $this->assertSame([], $orphans);
    }

    public function testRegionMatchesParentCity(): void
    {
        $byCode = [];
        foreach (Address::listCitiesMunicipalities() as $c) {
            $byCode[$c['code']] = $c;
        }
        $mismatches = [];
        foreach (PostalCodes::list() as $e) {
            if ($e['cityMunCode'] !== null && $byCode[$e['cityMunCode']]['region'] !== $e['region']) {
                $mismatches[] = $e['zip'];
            }
        }
        $this->assertSame([], $mismatches);
    }

    public function testManilaRollup(): void
    {
        $manila = Address::findCityMunicipality('Manila');
        $this->assertSame('133900', $manila['code']);
        $this->assertSame(342, PostalCodes::count(['cityMunCode' => '133900']));
    }

    public function testCebuCityJoin(): void
    {
        $cebu = Address::findCityMunicipality('Cebu City');
        $this->assertNotNull($cebu);
        $zips = PostalCodes::list(['cityMunCode' => $cebu['code']]);
        $this->assertGreaterThan(0, count($zips));
        foreach ($zips as $e) {
            $this->assertSame($cebu['code'], $e['cityMunCode']);
        }
    }
}
