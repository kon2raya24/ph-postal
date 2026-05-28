<?php

declare(strict_types=1);

namespace PhDevUtils\Postal\Tests;

use PhDevUtils\Postal\PostalCodes;
use PHPUnit\Framework\TestCase;

final class PostalCodesTest extends TestCase
{
    public function testCountAll(): void
    {
        $this->assertSame(2048, PostalCodes::count());
    }

    public function testDavaoMultiZipTopup(): void
    {
        $this->assertSame(12, PostalCodes::count(['cityMunCode' => '112402'])); // 8000 + 8016–8026
    }

    public function testCountByRegion(): void
    {
        $this->assertSame(360, PostalCodes::count(['region' => '13'])); // NCR
    }

    public function testCountByCityMunCode(): void
    {
        $this->assertSame(342, PostalCodes::count(['cityMunCode' => '133900'])); // Manila districts
    }

    public function testCountByProvince(): void
    {
        $this->assertSame(54, PostalCodes::count(['province' => '0722'])); // Cebu province
    }

    public function testFindByZipManila(): void
    {
        $r = PostalCodes::findByZip('1000');
        $this->assertCount(1, $r);
        $this->assertSame('133900', $r[0]['cityMunCode']);
        $this->assertSame('13', $r[0]['region']);
    }

    public function testFindByZipCebu(): void
    {
        $this->assertSame('072217', PostalCodes::findByZip('6000')[0]['cityMunCode']);
    }

    public function testFindByZipBlankOrUnknown(): void
    {
        $this->assertSame([], PostalCodes::findByZip(''));
        $this->assertSame([], PostalCodes::findByZip('0000'));
    }

    public function testZipsAreNotUnique(): void
    {
        $distinct = count(array_unique(array_column(PostalCodes::list(), 'zip')));
        $this->assertLessThan(PostalCodes::count(), $distinct);
    }

    public function testFindByCityCaseInsensitive(): void
    {
        $r = PostalCodes::findByCity('cebu city');
        $this->assertGreaterThan(0, count($r));
        foreach ($r as $e) {
            $this->assertSame('cebu city', mb_strtolower($e['cityMun']));
        }
    }

    public function testListByRegionShape(): void
    {
        $ncr = PostalCodes::list(['region' => '13']);
        $this->assertCount(360, $ncr);
        foreach ($ncr as $e) {
            $this->assertMatchesRegularExpression('/^\d{2}$/', $e['region']);
            $this->assertMatchesRegularExpression('/^\d{4}$/', $e['zip']);
        }
    }
}
