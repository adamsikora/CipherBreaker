package cz.civilizacehra.cipherbreaker

import org.junit.Assert.assertEquals
import org.junit.Test

class StringUtilsTest {

    @Test
    fun levenshteinDistanceOfSameWordsIsZero() {
        assertEquals(0, levenshteinDistance("sifra", "sifra"))
        assertEquals(0, levenshteinDistance("", ""))
    }

    @Test
    fun levenshteinDistanceCountsEdits() {
        assertEquals(3, levenshteinDistance("kitten", "sitting"))
        assertEquals(2, levenshteinDistance("flaw", "lawn"))
        assertEquals(1, levenshteinDistance("sifra", "sifry"))
    }

    @Test
    fun levenshteinDistanceToEmptyWordIsLength() {
        assertEquals(5, levenshteinDistance("sifra", ""))
        assertEquals(5, levenshteinDistance("", "sifra"))
    }

    @Test
    fun levenshteinDistanceIgnoresCase() {
        assertEquals(0, levenshteinDistance("Sifra", "sIFRA"))
    }

    @Test
    fun limitedLevenshteinDistanceIsSameBelowLimit() {
        assertEquals(0, levenshteinDistance("sifra", "sifra", 6))
        assertEquals(3, levenshteinDistance("kitten", "sitting", 6))
        assertEquals(5, levenshteinDistance("sifra", "", 6))
        assertEquals(5, levenshteinDistance("", "sifra", 6))
    }

    @Test
    fun limitedLevenshteinDistanceIsLimitFromLimitUp() {
        assertEquals(3, levenshteinDistance("kitten", "sitting", 3))
        assertEquals(2, levenshteinDistance("kitten", "sitting", 2))
        // Lengths differ by the limit
        assertEquals(6, levenshteinDistance("sifra", "sifrovackou", 6))
        assertEquals(6, levenshteinDistance("abcdefgh", "stuvwxyz", 6))
    }

    @Test
    fun limitedLevenshteinDistanceMatchesUnlimitedOne() {
        val words = listOf("", "a", "kos", "kost", "kosti", "sako", "pesek", "sifra", "sifrovacka",
                "prekvapeni", "prekazka", "nejneobhospodarovavatelnejsi")
        for (a in words) {
            for (b in words) {
                for (limit in 1..8) {
                    assertEquals("$a $b $limit", minOf(levenshteinDistance(a, b), limit), levenshteinDistance(a, b, limit))
                }
            }
        }
    }

    @Test
    fun limitedLevenshteinDistanceDoesNotIgnoreCase() {
        assertEquals(5, levenshteinDistance("Sifra", "sIFRA", 6))
    }

    @Test
    fun levenshteinCostsCanBeReused() {
        val costs = IntArray(20)
        assertEquals(3, levenshteinDistance("kitten", "sitting", 6, costs))
        assertEquals(1, levenshteinDistance("sifra", "sifry", 6, costs))
        assertEquals(6, levenshteinDistance("abcdefgh", "stuvwxyz", 6, costs))
        assertEquals(2, levenshteinDistance("flaw", "lawn", 6, costs))
    }

    @Test
    fun hammingDistanceCountsDifferentPositions() {
        assertEquals(0, hammingDistance("sifra", "sifra"))
        assertEquals(3, hammingDistance("karolin", "kathrin"))
        assertEquals(5, hammingDistance("abcde", "vwxyz"))
    }

    @Test
    fun hammingDistanceIgnoresCase() {
        assertEquals(0, hammingDistance("Sifra", "sIFRA"))
    }
}
