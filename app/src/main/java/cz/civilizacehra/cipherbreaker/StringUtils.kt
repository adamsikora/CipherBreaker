package cz.civilizacehra.cipherbreaker

import java.util.*
import kotlin.math.min


fun levenshteinDistance(aInput: String, bInput: String): Int {
    val a = aInput.toLowerCase(Locale.ENGLISH)
    val b = bInput.toLowerCase(Locale.ENGLISH)
    val costs = IntArray(b.length + 1)
    for (j in costs.indices)
        costs[j] = j
    for (i in 1..a.length) {
        costs[0] = i
        var nw = i - 1
        for (j in 1..b.length) {
            val cj = min(1 + min(costs[j], costs[j - 1]), if (a[i - 1] == b[j - 1]) nw else nw + 1)
            nw = costs[j]
            costs[j] = cj
        }
    }
    return costs[b.length]
}

fun hammingDistance(aInput: String, bInput: String): Int {
    val a = aInput.toLowerCase(Locale.ENGLISH)
    val b = bInput.toLowerCase(Locale.ENGLISH)
    var counter = 0
    for (i in a.indices) {
        if (a[i] != b[i]) {
            ++counter
        }
    }
    return counter
}
