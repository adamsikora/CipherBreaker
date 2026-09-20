package cz.civilizacehra.cipherbreaker

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NumberAnalysisTest {

    private fun factors(vararg factors: Long): List<ULong> {
        return factors.map { it.toULong() }
    }

    @Test
    fun numbersBelowTwoHaveNoFactors() {
        assertEquals(factors(), NumberAnalysis.factorNumber(0u))
        assertEquals(factors(), NumberAnalysis.factorNumber(1u))
    }

    @Test
    fun primesAreTheirOnlyFactor() {
        assertEquals(factors(2), NumberAnalysis.factorNumber(2u))
        assertEquals(factors(3), NumberAnalysis.factorNumber(3u))
        assertEquals(factors(97), NumberAnalysis.factorNumber(97u))
        assertEquals(factors(1000000007), NumberAnalysis.factorNumber(1000000007u))
    }

    @Test
    fun factorsAreSortedAndRepeated() {
        assertEquals(factors(2, 2, 2, 3, 3, 5), NumberAnalysis.factorNumber(360u))
        assertEquals(factors(7, 7), NumberAnalysis.factorNumber(49u))
        assertEquals(factors(2, 3, 5, 7, 11, 13), NumberAnalysis.factorNumber(30030u))
        assertEquals(List(40) { 2.toULong() }, NumberAnalysis.factorNumber(1099511627776u))
    }

    @Test
    fun largeNumbersAreFactored() {
        assertEquals(factors(71, 839, 1471, 6857), NumberAnalysis.factorNumber(600851475143u))
        // Square of a prime, which is found only when the search goes all the way to the square root
        assertEquals(factors(999983, 999983), NumberAnalysis.factorNumber(999966000289u))
        assertEquals(factors(3, 5, 17, 257, 641, 65537, 6700417),
                NumberAnalysis.factorNumber(ULong.MAX_VALUE))
    }

    @Test
    fun romanNumeralsAreFormatted() {
        assertEquals("I", NumberAnalysis.formatRomanNumeral(1u))
        assertEquals("IV", NumberAnalysis.formatRomanNumeral(4u))
        assertEquals("IX", NumberAnalysis.formatRomanNumeral(9u))
        assertEquals("XIV", NumberAnalysis.formatRomanNumeral(14u))
        assertEquals("XL", NumberAnalysis.formatRomanNumeral(40u))
        assertEquals("XC", NumberAnalysis.formatRomanNumeral(90u))
        assertEquals("CD", NumberAnalysis.formatRomanNumeral(400u))
        assertEquals("MCMXCIV", NumberAnalysis.formatRomanNumeral(1994u))
        assertEquals("MMMCMXCIX", NumberAnalysis.formatRomanNumeral(3999u))
        assertEquals("MMMM", NumberAnalysis.formatRomanNumeral(4000u))
    }

    @Test
    fun romanNumeralsHaveLimits() {
        assertNull(NumberAnalysis.formatRomanNumeral(0u))
        assertEquals("M".repeat(100), NumberAnalysis.formatRomanNumeral(100000u))
        assertNull(NumberAnalysis.formatRomanNumeral(100001u))
    }

    @Test
    fun romanNumeralsAreParsed() {
        assertEquals(1994.toULong(), NumberAnalysis.parseRomanNumeral("MCMXCIV"))
        assertEquals(1994.toULong(), NumberAnalysis.parseRomanNumeral("mcmxciv"))
        assertEquals(4000.toULong(), NumberAnalysis.parseRomanNumeral("MMMM"))
    }

    @Test
    fun nonCanonicalRomanNumeralsAreRejected() {
        assertNull(NumberAnalysis.parseRomanNumeral(""))
        assertNull(NumberAnalysis.parseRomanNumeral("IIII"))
        assertNull(NumberAnalysis.parseRomanNumeral("IC"))
        assertNull(NumberAnalysis.parseRomanNumeral("VX"))
        assertNull(NumberAnalysis.parseRomanNumeral("XIVI"))
        assertNull(NumberAnalysis.parseRomanNumeral("ABC"))
        assertNull(NumberAnalysis.parseRomanNumeral("12"))
    }

    @Test
    fun romanNumeralsRoundTrip() {
        for (i in 1..5000) {
            val numeral = NumberAnalysis.formatRomanNumeral(i.toULong())!!
            assertEquals(numeral, i.toULong(), NumberAnalysis.parseRomanNumeral(numeral))
        }
    }

    @Test
    fun numbersAreParsedInGivenBase() {
        assertEquals(255.toULong(), NumberAnalysis.parseNumber("255", "base-10"))
        assertEquals(255.toULong(), NumberAnalysis.parseNumber("ff", "base-16"))
        assertEquals(255.toULong(), NumberAnalysis.parseNumber("FF", "base-16"))
        assertEquals(5.toULong(), NumberAnalysis.parseNumber("101", "base-2"))
        assertEquals(14.toULong(), NumberAnalysis.parseNumber("XIV", "roman numerals"))
        assertEquals(ULong.MAX_VALUE, NumberAnalysis.parseNumber("18446744073709551615", "base-10"))
    }

    @Test
    fun invalidNumbersAreNotParsed() {
        assertNull(NumberAnalysis.parseNumber("12", "base-2"))
        assertNull(NumberAnalysis.parseNumber("-1", "base-10"))
        assertNull(NumberAnalysis.parseNumber("1.5", "base-10"))
        assertNull(NumberAnalysis.parseNumber("18446744073709551616", "base-10"))
        assertNull(NumberAnalysis.parseNumber("XIV", "base-10"))
        assertNull(NumberAnalysis.parseNumber("14", "roman numerals"))
        assertNull(NumberAnalysis.parseNumber("5", "prime factors"))
    }

    @Test
    fun numbersAreFormattedInGivenBase() {
        assertEquals("255", NumberAnalysis.formatInBase(255u, 10))
        assertEquals("11111111", NumberAnalysis.formatInBase(255u, 2))
        assertEquals("FF", NumberAnalysis.formatInBase(255u, 16))
        assertEquals("FFFFFFFFFFFFFFFF", NumberAnalysis.formatInBase(ULong.MAX_VALUE, 16))
    }
}
