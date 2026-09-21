package cz.civilizacehra.cipherbreaker

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test

class DictionaryTest {
    private val words = listOf(
            "en",
            "kos",
            "osa",
            "pes",
            "šep",
            "ta",
            "at",
            "kosa",
            "sako",
            "pešek",
            "kost",
            "kosti"
    )
    // Number of the words is on the first line of a dictionary
    private val dictionaryLines = listOf(words.size.toString()) + words

    private val regex = 0
    private val subset = 1
    private val exact = 2
    private val superset = 3
    private val hamming = 4
    private val levenshtein = 5
    private val morse = 6
    private val holes = 10

    private class SearchResult(val matches: List<String>, val count: Int, val toasts: List<String>)

    private fun search(input: String, modeId: Int, minLength: Int = 0, maxLength: Int = Int.MAX_VALUE,
                       lines: List<String> = dictionaryLines): SearchResult {
        val dictionary = Dictionary { lines.joinToString("\n").byteInputStream(Charsets.UTF_8) }
        val toasts = ArrayList<String>()
        var lastResult = ""
        var lastCount = -1
        var lastProgress = -1
        val uiHandlers = UiHandlers(
                { text -> toasts.add(text) },
                { progress, count, _, result ->
                    lastProgress = progress
                    lastCount = count
                    lastResult = result
                })
        runBlocking {
            dictionary.findResults(input, QueryParams(modeId, minLength, maxLength),
                    DictInfo("test.cbdict"), uiHandlers)
        }
        assertEquals(100, lastProgress)
        return SearchResult(lastResult.split("\n").filter { it.isNotEmpty() }, lastCount, toasts)
    }

    @Test
    fun regexHasToMatchWholeKey() {
        assertEquals(listOf("kos", "kosa", "kost", "kosti"), search("kos.*", regex).matches)
        assertEquals(listOf("kos"), search("kos", regex).matches)
        assertEquals(listOf("pes", "šep"), search("[ps]e[ps]", regex).matches)
    }

    @Test
    fun matchesAreCounted() {
        val result = search("kos.*", regex)
        assertEquals(4, result.count)
        assertEquals(emptyList<String>(), result.toasts)
    }

    @Test
    fun keyIsSearchedAndNameIsShown() {
        assertEquals(listOf("pešek"), search("pesek", regex).matches)
        assertEquals(emptyList<String>(), search("pešek", regex).matches)
    }

    @Test
    fun keyIsMadeOfLettersAndDigitsInLowerCase() {
        val lines = listOf("2", "Karel IV.", "iPhone 4S")
        assertEquals(listOf("Karel IV."), search("kareliv", regex, lines = lines).matches)
        assertEquals(listOf("iPhone 4S"), search("iphone4s", regex, lines = lines).matches)
    }

    @Test
    fun fileWithoutNumberOfWordsIsReported() {
        val result = search("kos", regex, lines = words)
        assertEquals(emptyList<String>(), result.matches)
        assertEquals(listOf("Invalid dictionary file"), result.toasts)
    }

    @Test
    fun invalidRegexIsReported() {
        val result = search("kos(", regex)
        assertEquals(emptyList<String>(), result.matches)
        assertEquals(listOf("Invalid regex syntax"), result.toasts)
    }

    @Test
    fun subsetFindsWordsMadeOfSomeOfTheLetters() {
        assertEquals(listOf("kos", "osa", "kosa", "sako"), search("kosa", subset).matches)
        assertEquals(emptyList<String>(), search("kk", subset).matches)
    }

    @Test
    fun exactFindsAnagrams() {
        assertEquals(listOf("kosa", "sako"), search("oska", exact).matches)
        assertEquals(listOf("pes", "šep"), search("eps", exact).matches)
        assertEquals(emptyList<String>(), search("kosaa", exact).matches)
    }

    @Test
    fun supersetFindsWordsContainingAllTheLetters() {
        assertEquals(listOf("kos", "kosa", "sako", "kost", "kosti"), search("ok", superset).matches)
        assertEquals(listOf("kosti"), search("it", superset).matches)
    }

    @Test
    fun lengthLimitsAreApplied() {
        assertEquals(listOf("kosa", "kost"), search("kos.*", regex, minLength = 4, maxLength = 4).matches)
        assertEquals(listOf("kosti"), search("kos.*", regex, minLength = 5).matches)
        assertEquals(listOf("kos"), search("kos.*", regex, maxLength = 3).matches)
    }

    @Test
    fun hammingFindsCloseWordsOfSameLengthSortedByDistance() {
        assertEquals(listOf("(0) kosa", "(1) kost", "(4) sako"), search("kosa", hamming).matches)
    }

    @Test
    fun levenshteinFindsCloseWordsSortedByDistance() {
        val matches = search("kost", levenshtein).matches
        assertEquals(listOf("(0) kost", "(1) kos", "(1) kosa", "(1) kosti"), matches.take(4))
        // Everything in this small dictionary is closer than the limit of 6 edits
        assertEquals(words.size, matches.size)
    }

    @Test
    fun morseModeMatchesLettersByNumberOfSymbols() {
        // One symbol is E or T, two symbols are A, I, M or N
        assertEquals(listOf("en", "ta"), search("12", morse).matches)
        assertEquals(listOf("at"), search("21", morse).matches)
    }

    @Test
    fun countModeRejectsUnusableDigits() {
        val tooLarge = search("19", morse)
        assertEquals(emptyList<String>(), tooLarge.matches)
        assertEquals(listOf("Only numbers up to 5 are usable in this mode. Aborting calculation"), tooLarge.toasts)

        val noLetters = search("10", morse)
        assertEquals(emptyList<String>(), noLetters.matches)
        assertEquals(listOf("0 has no assigned letters in this mode. Aborting calculation"), noLetters.toasts)

        val notDigit = search("1a", morse)
        assertEquals(emptyList<String>(), notDigit.matches)
        assertEquals(listOf("Invalid input letter \"a\". Aborting calculation"), notDigit.toasts)
    }

    @Test
    fun holesModeAllowsZero() {
        // O and A have one hole, the rest of the letters in the dictionary none
        assertEquals(listOf("kos"), search("010", holes).matches)
        assertEquals(listOf("osa"), search("101", holes).matches)
    }
}
