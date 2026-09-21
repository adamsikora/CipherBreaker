package cz.civilizacehra.cipherbreaker

import org.junit.Assert.assertEquals
import org.junit.Test

class DictionaryKeyTest {

    @Test
    fun lettersAreMadeLowerCase() {
        assertEquals("abakus", DictionaryKey.fromName("abakus"))
        assertEquals("aachen", DictionaryKey.fromName("Aachen"))
        assertEquals("aacr", DictionaryKey.fromName("AACR"))
    }

    @Test
    fun diacriticsAreRemoved() {
        assertEquals("priliszlutouckykun", DictionaryKey.fromName("Příliš žluťoučký kůň"))
        assertEquals("upeldabelskeody", DictionaryKey.fromName("ÚPĚL ĎÁBELSKÉ ÓDY"))
        assertEquals("gmund", DictionaryKey.fromName("Gmünd"))
    }

    @Test
    fun onlyLettersAndDigitsAreKept() {
        assertEquals("bus741gmund", DictionaryKey.fromName("Bus 741: Gmünd"))
        assertEquals("1234mnmsnezka", DictionaryKey.fromName("1234mnm Sněžka"))
        assertEquals("", DictionaryKey.fromName("?! - _"))
        assertEquals("", DictionaryKey.fromName(""))
    }

    @Test
    fun lettersWithoutDecompositionAreReplaced() {
        assertEquals("lodz", DictionaryKey.fromName("Łódź"))
        assertEquals("strasse", DictionaryKey.fromName("Straße"))
        assertEquals("kobenhavn", DictionaryKey.fromName("København"))
    }

    @Test
    fun charactersOutsideOfTableAreNormalized() {
        // Roman numeral two is a single character
        assertEquals("karelii", DictionaryKey.fromName("Karel Ⅱ"))
        assertEquals("sofia", DictionaryKey.fromName("ṡofia"))
        // Other scripts are left out
        assertEquals("30", DictionaryKey.fromName("30 ОСТРАВА"))
    }
}
