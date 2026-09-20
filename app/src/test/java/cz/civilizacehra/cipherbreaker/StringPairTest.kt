package cz.civilizacehra.cipherbreaker

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class StringPairTest {

    @Test
    fun dictionaryLineIsSplitToKeyAndName() {
        val pair = StringPair.fromString("abakusovy:abakusový")
        assertEquals("abakusovy", pair.first)
        assertEquals("abakusový", pair.second)
    }

    @Test
    fun mapLineKeepsCoordinatesInName() {
        val pair = StringPair.fromString("petrin:Petřín;50.0833514;14.3950931")
        assertEquals("petrin", pair.first)
        assertEquals("Petřín;50.0833514;14.3950931", pair.second)
    }

    @Test
    fun onlyFirstColonSplits() {
        val pair = StringPair.fromString("bus741:Bus 741: Gmünd")
        assertEquals("bus741", pair.first)
        assertEquals("Bus 741: Gmünd", pair.second)
    }

    @Test
    fun lineWithoutKeyIsUsedAsBoth() {
        val noColon = StringPair.fromString("abakus")
        assertEquals("abakus", noColon.first)
        assertEquals("abakus", noColon.second)

        val leadingColon = StringPair.fromString(":abakus")
        assertEquals(":abakus", leadingColon.first)
        assertEquals(":abakus", leadingColon.second)
    }

    @Test
    fun pairsAreComparedByContent() {
        assertEquals(StringPair.fromString("a:b"), StringPair.fromString("a:b"))
        assertEquals(StringPair.fromString("a:b").hashCode(), StringPair.fromString("a:b").hashCode())
        assertNotEquals(StringPair.fromString("a:b"), StringPair.fromString("a:c"))
    }
}
