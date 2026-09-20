package cz.civilizacehra.cipherbreaker

/**
 * Turns digits of binary and ternary numbers into letters in all the ways they can be read.
 * Offset is 0 when A is 1 and 1 when A is 0.
 */
internal object BaseReader {
    private const val BINARY_MAX = 31

    private val alphabet = arrayOf(" ", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z")
    private val chAlphabet = arrayOf(" ", "A", "B", "C", "D", "E", "F", "G", "H", "CH", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z")

    // Every assignment of ternary digits 0, 1, 2 (when reading values)
    // and every order of reading three digits (when reading order)
    private val ternaryMapping = arrayOf(
            intArrayOf(0, 1, 2),
            intArrayOf(0, 2, 1),
            intArrayOf(1, 0, 2),
            intArrayOf(1, 2, 0),
            intArrayOf(2, 0, 1),
            intArrayOf(2, 1, 0)
    )

    fun getLetter(i: Int): String {
        return if (i in 1..26) alphabet[i] else " "
    }

    fun getChLetter(i: Int): String {
        return if (i in 1..27) chAlphabet[i] else " "
    }

    /**
     * Binary digits read with the most significant digit on the right, the same with digits
     * inverted, with the most significant digit on the left and the same with digits inverted.
     */
    fun binaryLetters(values: IntArray, offset: Int): List<String> {
        var down = 0
        var up = 0
        for (k in values.indices) {
            down *= 2
            down += values[k]
        }
        for (k in values.indices.reversed()) {
            up *= 2
            up += values[k]
        }
        return listOf(
                getLetter(up + offset),
                getLetter(BINARY_MAX - up + offset),
                getLetter(down + offset),
                getLetter(BINARY_MAX - down + offset))
    }

    /**
     * Three ternary digits read in six ways. When reading order, the digits are taken in all
     * six orders. Otherwise their values are assigned in all six ways and the most significant
     * digit is either on the right or on the left.
     */
    fun ternaryLetters(values: IntArray, readOrder: Boolean, significantOnRight: Boolean, offset: Int, ch: Boolean): List<String> {
        val iterate = if (significantOnRight) intArrayOf(2, 1, 0) else intArrayOf(0, 1, 2)
        return List(6) { i ->
            var value = 0
            if (readOrder) {
                for (j in ternaryMapping[5 - i]) {
                    value *= 3
                    value += values[j]
                }
            } else {
                for (j in iterate) {
                    value *= 3
                    value += ternaryMapping[i][values[j]]
                }
            }
            if (ch) getChLetter(value + offset) else getLetter(value + offset)
        }
    }
}
