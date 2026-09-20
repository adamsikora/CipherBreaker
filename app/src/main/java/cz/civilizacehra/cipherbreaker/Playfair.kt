package cz.civilizacehra.cipherbreaker

/**
 * Grid is given as rows of cell contents, only the first character of each cell is used.
 */
internal object Playfair {

    /**
     * Returns description of what prevents the text from being processed with the grid,
     * null when there is no such problem.
     */
    fun findProblem(grid: List<List<String>>, text: String): String? {
        val letterIndexes = mutableMapOf<String, Pair<Int, Int>>()
        for ((i, row) in grid.withIndex()) {
            for ((j, cell) in row.withIndex()) {
                val letter = cellLetter(cell)
                if (letter.isEmpty()) {
                    return "Fill the grid with letters first."
                }
                if (letterIndexes.contains(letter)) {
                    return "Symbol \"$letter\" is present in grid multiple times."
                }
                letterIndexes[letter] = Pair(i, j)
            }
        }
        if (text.isEmpty()) {
            return "Fill the text to decipher first."
        }
        if (text.length % 2 != 0) {
            return "Length of text must divisible by 2."
        }
        val letters = text.map { it.toString() }
        for (letter in letters) {
            if (!letterIndexes.contains(letter)) {
                return "Symbol \"$letter\" is not present in the grid."
            }
        }
        for (i in 0 until letters.size / 2) {
            if (letters[2*i] == letters[2*i + 1]) {
                return "Two same letters (${letters[2*i]}) in a pair are not allowed."
            }
        }
        return null
    }

    /**
     * Encrypts or decrypts the text. Expects that findProblem found nothing.
     */
    fun crypt(grid: List<List<String>>, text: String, decrypt: Boolean): String {
        val height = grid.size
        val width = grid[0].size
        val letterIndexes = mutableMapOf<String, Pair<Int, Int>>()
        for ((i, row) in grid.withIndex()) {
            for ((j, cell) in row.withIndex()) {
                letterIndexes[cellLetter(cell)] = Pair(i, j)
            }
        }
        val indexLetters = letterIndexes.entries.associate { (k, v) -> v to k }
        val letters = text.map { it.toString() }

        var result = ""
        val shift = if (decrypt) -1 else 1
        for (i in 0 until letters.size / 2) {
            val letter1Idx = letterIndexes[letters[2*i]]!!
            val letter2Idx = letterIndexes[letters[2*i + 1]]!!
            if (letter1Idx.first == letter2Idx.first) {
                result += indexLetters[Pair(letter1Idx.first, (letter1Idx.second + shift + width) % width)]
                result += indexLetters[Pair(letter2Idx.first, (letter2Idx.second + shift + width) % width)]
            } else if (letter1Idx.second == letter2Idx.second) {
                result += indexLetters[Pair((letter1Idx.first + shift + height) % height, letter1Idx.second)]
                result += indexLetters[Pair((letter2Idx.first + shift + height) % height, letter2Idx.second)]
            } else {
                result += indexLetters[Pair(letter1Idx.first, letter2Idx.second)]
                result += indexLetters[Pair(letter2Idx.first, letter1Idx.second)]
            }
        }
        return result
    }

    private fun cellLetter(cell: String): String {
        return if (cell.length > 1) cell[0].toString() else cell
    }
}
