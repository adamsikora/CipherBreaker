package cz.civilizacehra.cipherbreaker

internal class StringPair private constructor(val first: String?, val second: String?) {

    override fun equals(other: Any?): Boolean {
        if (other is StringPair) {
            return this.first != null && other.first != null && this.first == other.first &&
                    this.second != null && other.second != null && this.second == other.second
        }

        return false
    }

    override fun hashCode(): Int {
        return this.toString().hashCode()
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
