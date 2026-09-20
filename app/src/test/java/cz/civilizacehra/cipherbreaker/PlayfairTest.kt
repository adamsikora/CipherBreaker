package cz.civilizacehra.cipherbreaker

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PlayfairTest {

    private fun grid(vararg rows: String): List<List<String>> {
        return rows.map { row -> row.map { it.toString() } }
    }

    // The textbook example with key "playfair example"
    private val classicGrid = grid("PLAYF", "IREXM", "BCDGH", "KNOQS", "TUVWZ")
    private val smallGrid = grid("ABC", "DEF")

    @Test
    fun classicExampleIsEncrypted() {
        assertNull(Playfair.findProblem(classicGrid, "HIDETHEGOLDINTHETREXESTUMP"))
        assertEquals("BMODZBXDNABEKUDMUIXMMOUVIF",
                Playfair.crypt(classicGrid, "HIDETHEGOLDINTHETREXESTUMP", decrypt = false))
    }

    @Test
    fun classicExampleIsDecrypted() {
        assertEquals("HIDETHEGOLDINTHETREXESTUMP",
                Playfair.crypt(classicGrid, "BMODZBXDNABEKUDMUIXMMOUVIF", decrypt = true))
    }

    @Test
    fun rowsAndColumnsWrapAround() {
        // AB shares a row, AD a column and CF the last column
        assertEquals("BCDAFC", Playfair.crypt(smallGrid, "ABADCF", decrypt = false))
        assertEquals("CADAFC", Playfair.crypt(smallGrid, "ABADCF", decrypt = true))
    }

    @Test
    fun rectangleSwapsColumns() {
        assertEquals("BD", Playfair.crypt(smallGrid, "AE", decrypt = false))
        assertEquals("BD", Playfair.crypt(smallGrid, "AE", decrypt = true))
    }

    @Test
    fun onlyFirstCharacterOfCellIsUsed() {
        val grid = listOf(listOf("Ax", "B", "C"), listOf("D", "E", "F"))
        assertNull(Playfair.findProblem(grid, "AE"))
        assertEquals("BD", Playfair.crypt(grid, "AE", decrypt = false))
    }

    @Test
    fun gridProblemsAreReported() {
        assertEquals("Fill the grid with letters first.",
                Playfair.findProblem(listOf(listOf("A", ""), listOf("C", "D")), "AC"))
        assertEquals("Symbol \"A\" is present in grid multiple times.",
                Playfair.findProblem(grid("AB", "CA"), "AB"))
    }

    @Test
    fun textProblemsAreReported() {
        assertEquals("Fill the text to decipher first.", Playfair.findProblem(smallGrid, ""))
        assertEquals("Length of text must divisible by 2.", Playfair.findProblem(smallGrid, "ABC"))
        assertEquals("Symbol \"X\" is not present in the grid.", Playfair.findProblem(smallGrid, "AX"))
        assertEquals("Two same letters (A) in a pair are not allowed.",
                Playfair.findProblem(smallGrid, "BCAA"))
    }

    @Test
    fun sameLettersInDifferentPairsAreAllowed() {
        assertNull(Playfair.findProblem(smallGrid, "BAAC"))
    }
}
