package cz.civilizacehra.cipherbreaker

internal class StringPair private constructor(val first: String?, val second: String?) {

    override fun equals(other: Any?): Boolean {
        if (other is StringPair) {
            val otherPair = other as StringPair?
            return this.first != null && otherPair!!.first != null && this.first == otherPair.first &&
                    this.second != null && otherPair.second != null && this.second == otherPair.second
        }

        return false
    }

    override fun toString(): String {
        return "($first, $second)"
    }

    companion object {

        fun fromString(input: String): StringPair {
            val index = input.indexOf(":")
            return if (index > 0 && index < input.length) {
                StringPair(input.substring(0, index), input.substring(index + 1))
            } else {
                StringPair(input, input)
            }
        }
    }
}
