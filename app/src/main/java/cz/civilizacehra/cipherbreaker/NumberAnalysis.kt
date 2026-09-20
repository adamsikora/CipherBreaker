package cz.civilizacehra.cipherbreaker

import kotlin.math.sqrt

internal object NumberAnalysis {
    const val ROMAN_NUMERALS = "roman numerals"
    const val PRIME_FACTORS = "prime factors"

    // Above this the numeral is a wall of M characters, so it is not worth showing
    private val MAX_ROMAN_NUMERAL = 100000.toULong()

    private val ROMAN_SYMBOLS = listOf(
            1000.toULong() to "M", 900.toULong() to "CM", 500.toULong() to "D",
            400.toULong() to "CD", 100.toULong() to "C", 90.toULong() to "XC",
            50.toULong() to "L", 40.toULong() to "XL", 10.toULong() to "X",
            9.toULong() to "IX", 5.toULong() to "V", 4.toULong() to "IV",
            1.toULong() to "I")
    // Only canonical numerals: IV/IX/XL/XC/CD/CM are the only subtractive pairs,
    // I/X/C repeat at most three times and V/L/D at most once. Thousands are left
    // unbounded, because values above MMM have no other plain text notation.
    private val ROMAN_PATTERN =
            Regex("M*(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})")

    private val ROMAN_VALUES = mapOf(
            'I' to 1.toULong(), 'V' to 5.toULong(), 'X' to 10.toULong(), 'L' to 50.toULong(),
            'C' to 100.toULong(), 'D' to 500.toULong(), 'M' to 1000.toULong())

    // Input type is either "roman numerals" or "base-N".
    fun parseNumber(input: String, inputType: String): ULong? {
        if (inputType == ROMAN_NUMERALS) {
            return parseRomanNumeral(input)
        }
        val radix = inputType.removePrefix("base-").toIntOrNull() ?: return null
        return input.toULongOrNull(radix)
    }

    fun formatInBase(number: ULong, radix: Int): String {
        val digits = number.toString(radix)
        // Hexadecimal reads better in capitals, and matches what the hex keyboard types
        return if (radix > 10) digits.uppercase() else digits
    }

    fun formatRomanNumeral(number: ULong): String? {
        if (number < 1.toULong() || number > MAX_ROMAN_NUMERAL) {
            return null
        }

        var remainder = number
        val numeral = StringBuilder()
        // Greedily take the largest symbol that still fits, subtractive pairs included
        for ((value, symbol) in ROMAN_SYMBOLS) {
            while (remainder >= value) {
                numeral.append(symbol)
                remainder -= value
            }
        }
        return numeral.toString()
    }

    fun parseRomanNumeral(input: String): ULong? {
        val numeral = input.uppercase()
        if (numeral.isEmpty() || !ROMAN_PATTERN.matches(numeral)) {
            return null
        }

        var total = 0.toULong()
        var previous = 0.toULong()
        // Walk right to left: a numeral smaller than the one to its right is subtracted
        for (c in numeral.reversed()) {
            val value = ROMAN_VALUES.getValue(c)
            if (value < previous) {
                total -= value
            } else {
                total += value
                previous = value
            }
        }
        return total
    }

    fun factorNumber(number: ULong): ArrayList<ULong> {
        val factors: ArrayList<ULong> = arrayListOf()
        if (number < 2.toULong()) {
            return factors
        }
        var n = number
        val squareRoot = sqrt(number.toDouble()).toULong()

        // At first check for divisibility by 2. add it in arr till it is divisible
        while (n % 2u == 0.toULong()) {
            factors.add(2u)
            n /= 2u
        }

        // Run loop from 3 to square root of n. Check for divisibility by i.
        // Add i in arr till it is divisible by i.
        for (i in 3.toULong()..squareRoot step 2) {
            while (n % i == 0.toULong()) {
                factors.add(i)
                n /= i
            }
            if (n < i) {
                break
            }
        }

        // If n is a prime number greater than 2.
        if (n > 2u) {
            factors.add(n)
        }
        return factors
    }
}
