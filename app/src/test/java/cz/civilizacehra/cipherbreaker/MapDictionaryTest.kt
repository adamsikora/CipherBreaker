package cz.civilizacehra.cipherbreaker

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Location can not be set in these tests, as android.location.Location only works on a device.
 * All distances are therefore zero and results are sorted by name.
 */
class MapDictionaryTest {
    private val places = listOf(
            "petrin:Petřín;50.0833514;14.3950931",
            "petrin:Petřín;49.4681442;17.9707594",
            "vitkov:Vítkov;50.0888094;14.4500442",
            "bus741:Bus 741: Gmünd;48.7611194;14.9725226"
    )
    private val regex = 0
    private val exact = 2

    private fun search(input: String, modeId: Int, svjz: Boolean = false): List<String> {
        val dictionary = MapDictionary { places.joinToString("\n").byteInputStream(Charsets.UTF_8) }
        dictionary.setSvjz(svjz)
        var lastResult = ""
        val uiHandlers = UiHandlers({ }, { _, _, _, result -> lastResult = result })
        runBlocking {
            dictionary.findResults(input, QueryParams(modeId, 0, Int.MAX_VALUE),
                    DictInfo("test.cbmap", places.size), uiHandlers)
        }
        return lastResult.split("\n").filter { it.isNotEmpty() }
    }

    @Test
    fun coordinatesAreReplacedWithDistance() {
        assertEquals(listOf("Vítkov (0m)"), search("vitkov", regex))
    }

    @Test
    fun placesOfSameNameAreAllListed() {
        assertEquals(listOf("Petřín (0m)", "Petřín (0m)"), search("petrin", regex))
    }

    @Test
    fun resultsAreSortedByName() {
        assertEquals(listOf("Petřín (0m)", "Petřín (0m)", "Vítkov (0m)"), search("[pv].*", regex))
    }

    @Test
    fun colonInNameIsKept() {
        assertEquals(listOf("Bus 741: Gmünd (0m)"), search("bus.*", regex))
    }

    @Test
    fun worldSideIsNotRemovedFromInputByDefault() {
        assertEquals(emptyList<String>(), search("petrinsv", exact))
    }

    @Test
    fun worldSideCanBeRemovedFromInput() {
        assertEquals(listOf("Petřín (SV) (0m)", "Petřín (SV) (0m)"), search("petrinsv", exact, svjz = true))
        assertEquals(listOf("Vítkov (J) (0m)"), search("jvitkov", exact, svjz = true))
    }

    @Test
    fun inputWithoutWorldSideStillMatches() {
        assertEquals(listOf("Vítkov (0m)"), search("vitkov", exact, svjz = true))
    }
}
