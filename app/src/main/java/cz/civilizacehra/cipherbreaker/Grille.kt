package cz.civilizacehra.cipherbreaker

/**
 * Geometry of a square turning grille. Cells are addressed as (row, column).
 */
internal class Grille(val size: Int) {

    /**
     * Position of the cell after the grille is turned clockwise by given number of quarter turns.
     */
    fun getRotation(i: Int, j: Int, rotation: Int): Pair<Int, Int> {
        return when (rotation % 4) {
            0 -> Pair(i, j)
            1 -> Pair(j, size - i - 1)
            2 -> Pair(size - i - 1, size - j - 1)
            else -> Pair(size - j - 1, i)
        }
    }

    fun getRotations(i: Int, j: Int): Array<Pair<Int, Int>> {
        return Array(4) { rot -> getRotation(i, j, rot) }
    }

    // Center of odd sized grille turns onto itself, so it can not be used
    fun isCenterCell(i: Int, j: Int): Boolean {
        return size % 2 == 1 && i == j && 2*i + 1 == size
    }

    fun nextCell(i: Int, j: Int): Pair<Int, Int> {
        var nextJ = (j + 1) % size
        val nextI = if (nextJ == 0) i + 1 else i
        if (isCenterCell(nextI, nextJ)) {
            nextJ += 1
        }
        return Pair(nextI, nextJ)
    }

    fun prevCell(i: Int, j: Int): Pair<Int, Int> {
        var prevJ = (j - 1 + size) % size
        val prevI = if (j == 0) i - 1 else i
        if (isCenterCell(prevI, prevJ)) {
            prevJ -= 1
        }
        return Pair(prevI, prevJ)
    }

    // Number of holes needed for every usable cell to be read exactly once
    fun desiredPresets(): Int {
        var desiredPresets = size * size
        if (size % 2 == 1) {
            desiredPresets -= 1
        }
        return desiredPresets / 4
    }

    /**
     * Reads letters through the holes of the grille turned by given number of quarter turns,
     * row by row. Empty cells are read as "_".
     */
    fun read(letters: List<List<String>>, holes: List<Pair<Int, Int>>, rotation: Int): String {
        var text = ""
        val indices = holes.map { getRotation(it.first, it.second, rotation) }
        val sortedIndices = indices.sortedWith(compareBy({ it.first }, { it.second }))
        for (index in sortedIndices) {
            var char = letters[index.first][index.second]
            if (char.isEmpty()) {
                char = "_"
            }
            text += char
        }
        return text
    }
}
