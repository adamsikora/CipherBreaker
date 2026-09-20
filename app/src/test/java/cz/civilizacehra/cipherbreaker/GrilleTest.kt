package cz.civilizacehra.cipherbreaker

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GrilleTest {

    @Test
    fun cornerTurnsThroughAllCorners() {
        assertArrayEquals(arrayOf(Pair(0, 0), Pair(0, 3), Pair(3, 3), Pair(3, 0)),
                Grille(4).getRotations(0, 0))
    }

    @Test
    fun cellTurnsClockwise() {
        val grille = Grille(4)
        assertEquals(Pair(0, 1), grille.getRotation(0, 1, 0))
        assertEquals(Pair(1, 3), grille.getRotation(0, 1, 1))
        assertEquals(Pair(3, 2), grille.getRotation(0, 1, 2))
        assertEquals(Pair(2, 0), grille.getRotation(0, 1, 3))
        assertEquals(Pair(0, 1), grille.getRotation(0, 1, 4))
    }

    @Test
    fun centerOfOddGrilleStaysInPlace() {
        assertArrayEquals(Array(4) { Pair(2, 2) }, Grille(5).getRotations(2, 2))
    }

    @Test
    fun onlyOddGrilleHasCenterCell() {
        assertTrue(Grille(5).isCenterCell(2, 2))
        assertFalse(Grille(5).isCenterCell(2, 3))
        assertFalse(Grille(5).isCenterCell(1, 1))
        assertFalse(Grille(4).isCenterCell(2, 2))
        assertFalse(Grille(4).isCenterCell(1, 1))
    }

    @Test
    fun quarterOfUsableCellsAreHoles() {
        assertEquals(1, Grille(2).desiredPresets())
        assertEquals(2, Grille(3).desiredPresets())
        assertEquals(4, Grille(4).desiredPresets())
        assertEquals(6, Grille(5).desiredPresets())
        assertEquals(9, Grille(6).desiredPresets())
    }

    @Test
    fun nextCellGoesRowByRowAndSkipsCenter() {
        val grille = Grille(5)
        assertEquals(Pair(0, 1), grille.nextCell(0, 0))
        assertEquals(Pair(1, 0), grille.nextCell(0, 4))
        assertEquals(Pair(2, 3), grille.nextCell(2, 1))
        // Row equal to size means there is no next cell
        assertEquals(Pair(5, 0), grille.nextCell(4, 4))

        assertEquals(Pair(1, 2), Grille(4).nextCell(1, 1))
    }

    @Test
    fun prevCellGoesBackAndSkipsCenter() {
        val grille = Grille(5)
        assertEquals(Pair(0, 0), grille.prevCell(0, 1))
        assertEquals(Pair(0, 4), grille.prevCell(1, 0))
        assertEquals(Pair(2, 1), grille.prevCell(2, 3))
        // Negative row means there is no previous cell
        assertEquals(Pair(-1, 4), grille.prevCell(0, 0))
    }

    @Test
    fun textIsReadThroughTurningGrille() {
        val letters = listOf("SPEE", "LMEJ", "UDEE", "_KSA").map { row -> row.map { it.toString() } }
        val holes = listOf(Pair(0, 0), Pair(0, 2), Pair(1, 3), Pair(2, 1))
        val grille = Grille(4)

        assertEquals("SEJD", grille.read(letters, holes, 0))
        assertEquals("EMES", grille.read(letters, holes, 1))
        assertEquals("EUKA", grille.read(letters, holes, 2))
        assertEquals("PLE_", grille.read(letters, holes, 3))
    }

    @Test
    fun emptyCellsAreReadAsUnderscore() {
        val letters = listOf(listOf("A", ""), listOf("", "D"))
        assertEquals("A", Grille(2).read(letters, listOf(Pair(0, 0)), 0))
        assertEquals("_", Grille(2).read(letters, listOf(Pair(0, 0)), 1))
        assertEquals("D", Grille(2).read(letters, listOf(Pair(0, 0)), 2))
    }

    @Test
    fun holesAreReadRowByRowRegardlessOfTheirOrder() {
        val letters = listOf("AB", "CD").map { row -> row.map { it.toString() } }
        assertEquals("AD", Grille(2).read(letters, listOf(Pair(1, 1), Pair(0, 0)), 0))
    }
}
