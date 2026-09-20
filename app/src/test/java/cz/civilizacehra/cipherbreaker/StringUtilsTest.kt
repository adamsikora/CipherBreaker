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
