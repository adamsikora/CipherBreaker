package cz.civilizacehra.cipherbreaker

import java.text.Collator
import java.text.Normalizer
import java.util.Calendar
import java.util.Comparator
import java.util.Locale
import java.util.regex.Pattern


class Holiday internal constructor(year: Int, val month: Int, val day: Int, val name: String) {
    private var mDayOfWeek: String? = null

    init {
        updateYear(year)
    }

    internal fun updateYear(year: Int) {
        val c = Calendar.getInstance()
        c.set(year, month - 1, day)

        mDayOfWeek = dayOfWeekList[c.get(Calendar.DAY_OF_WEEK)]
    }

    internal fun toString(nameFirst: Boolean): String {
        val date = String.format(Locale.ENGLISH, "%2d. %2d. (%s)", day, month, mDayOfWeek)
        return if (nameFirst) {
            "$name  $date\n"
        } else {
            "$date  $name\n"
        }
    }

    internal fun satisfiesFilters(day: Int, month: Int, dayOfWeek: String, query: String): Boolean {
        val normalizedName = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replace("[^\\p{ASCII}]".toRegex(), "")
        return ((day == 0 || day == this.day) && (month == 0 || month == this.month)
                && (dayOfWeek == "-" || dayOfWeek == mDayOfWeek)
                && (query.isEmpty() || tryMatch(name, query) || tryMatch(normalizedName, query)))
    }

    private fun tryMatch(name: String, query: String): Boolean {
        val pattern = Pattern.compile(query)
        val test = name.toLowerCase(Locale.ENGLISH)
        return pattern.matcher(test).find() || test.contains(query.toLowerCase(Locale.ENGLISH))
    }

    companion object {
        private val dayOfWeekList = arrayOf("-", "Ne", "Po", "Ut", "St", "Ct", "Pa", "So")
        private val collator = Collator.getInstance(Locale("cs", "CZ"))

        internal var dateFirstComparator: Comparator<Holiday> = Comparator { h1, h2 ->
            var result = compareValues(h1.month, h2.month)
            if (result != 0) {
                return@Comparator result
            }
            result = compareValues(h1.day, h2.day)
            if (result != 0) {
                result
            } else collator.compare(h1.name, h2.name)
        }
        internal var nameFirstComparator: Comparator<Holiday> = Comparator { h1, h2 ->
            var result = collator.compare(h1.name, h2.name)
            if (result != 0) {
                return@Comparator result
            }
            result = compareValues(h1.month, h2.month)
            if (result != 0) {
                result
            } else compareValues(h1.day, h2.day)
        }
    }
}
