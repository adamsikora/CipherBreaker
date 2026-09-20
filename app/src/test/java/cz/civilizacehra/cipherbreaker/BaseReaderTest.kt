package cz.civilizacehra.cipherbreaker

import org.junit.Assert.assertEquals
import org.junit.Test

class BaseReaderTest {

    @Test
    fun lettersAreNumberedFromOne() {
        assertEquals("A", BaseReader.getLetter(1))
        assertEquals("I", BaseReader.getLetter(9))
        assertEquals("Z", BaseReader.getLetter(26))
    }

    @Test
    fun numbersOutsideOfAlphabetAreBlank() {
        assertEquals(" ", BaseReader.getLetter(0))
        assertEquals(" ", BaseReader.getLetter(27))
        assertEquals(" ", BaseReader.getLetter(-1))
        assertEquals(" ", BaseReader.getChLetter(0))
        assertEquals(" ", BaseReader.getChLetter(28))
    }

    @Test
    fun chFollowsH() {
        assertEquals("H", BaseReader.getChLetter(8))
        assertEquals("CH", BaseReader.getChLetter(9))
        assertEquals("I", BaseReader.getChLetter(10))
        assertEquals("Z", BaseReader.getChLetter(27))
    }

    @Test
    fun binaryIsReadInBothDirectionsAndInverted() {
        // 00001 is 16 from the right and 1 from the left
        assertEquals(listOf("P", "O", "A", " "), BaseReader.binaryLetters(intArrayOf(0, 0, 0, 0, 1), 0))
        assertEquals(listOf("M", "R", "V", "I"), BaseReader.binaryLetters(intArrayOf(1, 0, 1, 1, 0), 0))
        assertEquals(listOf(" ", " ", " ", " "), BaseReader.binaryLetters(intArrayOf(1, 1, 1, 1, 1), 0))
    }

    @Test
    fun binaryAlphabetCanStartAtZero() {
        assertEquals(listOf("A", " ", "A", " "), BaseReader.binaryLetters(intArrayOf(0, 0, 0, 0, 0), 1))
        assertEquals(listOf(" ", "F", "L", "U"), BaseReader.binaryLetters(intArrayOf(0, 1, 0, 1, 1), 1))
    }

    @Test
    fun ternaryValuesAreAssignedInAllWays() {
        assertEquals(listOf("E", "G", "K", "O", "S", "U"),
                BaseReader.ternaryLetters(intArrayOf(0, 1, 2), readOrder = false, significantOnRight = false, offset = 0, ch = false))
        assertEquals(listOf("U", "O", "S", "G", "K", "E"),
                BaseReader.ternaryLetters(intArrayOf(0, 1, 2), readOrder = false, significantOnRight = true, offset = 0, ch = false))
        assertEquals(listOf("Z", "M", "Z", " ", "M", " "),
                BaseReader.ternaryLetters(intArrayOf(2, 2, 2), readOrder = false, significantOnRight = false, offset = 0, ch = false))
    }

    @Test
    fun ternaryDigitsAreTakenInAllOrders() {
        assertEquals(listOf("U", "S", "O", "K", "G", "E"),
                BaseReader.ternaryLetters(intArrayOf(0, 1, 2), readOrder = true, significantOnRight = false, offset = 0, ch = false))
        // Direction does not matter when reading order
        assertEquals(listOf("U", "S", "O", "K", "G", "E"),
                BaseReader.ternaryLetters(intArrayOf(0, 1, 2), readOrder = true, significantOnRight = true, offset = 0, ch = false))
    }

    @Test
    fun ternaryAlphabetCanStartAtZeroAndContainCh() {
        assertEquals(listOf("J", "S", "E", "W", "I", "R"),
                BaseReader.ternaryLetters(intArrayOf(1, 0, 0), readOrder = false, significantOnRight = false, offset = 1, ch = false))
        assertEquals(listOf("CH", "Q", "D", "U", "H", "P"),
                BaseReader.ternaryLetters(intArrayOf(1, 0, 0), readOrder = false, significantOnRight = false, offset = 0, ch = true))
        assertEquals(listOf("Y", "L", "Y", " ", "L", " "),
                BaseReader.ternaryLetters(intArrayOf(2, 2, 2), readOrder = false, significantOnRight = false, offset = 0, ch = true))
    }
}
