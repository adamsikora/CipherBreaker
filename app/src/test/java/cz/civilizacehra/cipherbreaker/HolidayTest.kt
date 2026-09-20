package cz.civilizacehra.cipherbreaker

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class HolidayTest {

    @Test
    fun dayOfWeekFollowsYear() {
        val holiday = Holiday(2024, 12, 24, "Adam")
        assertEquals("24. 12. (Ut)  Adam\n", holiday.toString(false))

        holiday.updateYear(2025)
        assertEquals("24. 12. (St)  Adam\n", holiday.toString(false))
    }

    @Test
    fun toStringPadsDateAndOrdersByFlag() {
        val holiday = Holiday(2025, 1, 2, "Karina")
        assertEquals(" 2.  1. (Ct)  Karina\n", holiday.toString(false))
        assertEquals("Karina   2.  1. (Ct)\n", holiday.toString(true))
    }

    @Test
    fun emptyFiltersMatchEverything() {
        assertTrue(Holiday(2025, 12, 26, "Štěpán").satisfiesFilters(0, 0, "-", ""))
    }

    @Test
    fun dateFiltersHaveToMatch() {
        val holiday = Holiday(2025, 12, 26, "Štěpán") // Friday
        assertTrue(holiday.satisfiesFilters(26, 0, "-", ""))
        assertTrue(holiday.satisfiesFilters(0, 12, "-", ""))
        assertTrue(holiday.satisfiesFilters(26, 12, "Pa", ""))
        assertFalse(holiday.satisfiesFilters(25, 0, "-", ""))
        assertFalse(holiday.satisfiesFilters(0, 11, "-", ""))
        assertFalse(holiday.satisfiesFilters(0, 0, "So", ""))
    }

    @Test
    fun queryMatchesWithAndWithoutDiacritics() {
        val holiday = Holiday(2025, 12, 26, "Štěpán")
        assertTrue(holiday.satisfiesFilters(0, 0, "-", "stepan"))
        assertTrue(holiday.satisfiesFilters(0, 0, "-", "štěpán"))
        assertTrue(holiday.satisfiesFilters(0, 0, "-", "Stepan"))
        assertTrue(holiday.satisfiesFilters(0, 0, "-", "epa"))
        assertFalse(holiday.satisfiesFilters(0, 0, "-", "stefan"))
    }

    @Test
    fun queryIsRegex() {
        val holiday = Holiday(2025, 12, 24, "Adam")
        assertTrue(holiday.satisfiesFilters(0, 0, "-", "^ad"))
        assertTrue(holiday.satisfiesFilters(0, 0, "-", "a.a"))
        assertFalse(holiday.satisfiesFilters(0, 0, "-", "^dam"))
    }

    @Test
    fun dateFirstComparatorSortsByMonthDayAndName() {
        val eva = Holiday(2025, 12, 24, "Eva")
        val adam = Holiday(2025, 12, 24, "Adam")
        val barbora = Holiday(2025, 12, 4, "Barbora")
        val ondrej = Holiday(2025, 11, 30, "Ondřej")

        val sorted = listOf(eva, adam, barbora, ondrej).sortedWith(Holiday.dateFirstComparator)
        assertEquals(listOf(ondrej, barbora, adam, eva), sorted)
    }

    @Test
    fun nameFirstComparatorUsesCzechAlphabet() {
        val dana = Holiday(2025, 12, 11, "Dana")
        val cestmir = Holiday(2025, 1, 8, "Čestmír")
        val cyril = Holiday(2025, 7, 5, "Cyril")
        val petrJune = Holiday(2025, 6, 29, "Petr")
        val petrFebruary = Holiday(2025, 2, 22, "Petr")

        val sorted = listOf(petrJune, dana, cestmir, petrFebruary, cyril)
                .sortedWith(Holiday.nameFirstComparator)
        assertEquals(listOf(cyril, cestmir, dana, petrFebruary, petrJune), sorted)
    }
}
