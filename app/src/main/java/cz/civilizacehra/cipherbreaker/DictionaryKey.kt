package cz.civilizacehra.cipherbreaker

import java.text.Normalizer

// Dictionaries are searched by keys made of the names in them: diacritics are removed, letters
// are made lower case and everything but a-z and digits is left out. Keys of searches that are
// sensitive to diacritics keep the letters as they are, only in lower case
internal object DictionaryKey {

    // Letters that are not made of a base letter and a diacritical mark
    private val special = mapOf(
            'ł' to "l", 'ø' to "o", 'đ' to "d", 'ß' to "ss", 'æ' to "ae", 'œ' to "oe",
            'þ' to "th", 'ð' to "d", 'ı' to "i", 'ħ' to "h"
    )

    // Keys of the characters that follow ASCII, all the Czech letters are among them.
    // Normalizer is too slow to be used for every name of a large dictionary
    private const val TABLE_START = 0x80
    private const val TABLE_END = 0x180
    private val table = Array(TABLE_END - TABLE_START) { normalizedKey((it + TABLE_START).toChar().toString()) }

    fun fromName(name: String): String {
        val key = StringBuilder(name.length)
        for (c in name) {
            when {
                c in 'a'..'z' || c in '0'..'9' -> key.append(c)
                c in 'A'..'Z' -> key.append(c + ('a' - 'A'))
                c.code < TABLE_START -> {}
                c.code < TABLE_END -> key.append(table[c.code - TABLE_START])
                else -> return normalizedKey(name)
            }
        }
        return key.toString()
    }

    fun withDiacritics(name: String): String {
        val key = StringBuilder(name.length)
        for (c in name) {
            when {
                c in 'a'..'z' || c in '0'..'9' -> key.append(c)
                c in 'A'..'Z' -> key.append(c + ('a' - 'A'))
                c.code < TABLE_START -> {}
                c.isLetter() -> key.append(c.lowercaseChar())
            }
        }
        return key.toString()
    }

    private fun normalizedKey(name: String): String {
        val key = StringBuilder(name.length)
        for (c in Normalizer.normalize(name, Normalizer.Form.NFKD)) {
            val lower = c.lowercaseChar()
            for (d in special[lower] ?: lower.toString()) {
                if (d in 'a'..'z' || d in '0'..'9') {
                    key.append(d)
                }
            }
        }
        return key.toString()
    }
}
