package cz.civilizacehra.cipherbreaker

import java.util.*
import kotlin.math.abs
import kotlin.math.min


fun levenshteinDistance(aInput: String, bInput: String): Int {
    val a = aInput.lowercase(Locale.ENGLISH)
    val b = bInput.lowercase(Locale.ENGLISH)
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

// Distance of a and b as they are, without making them lower case. Distances of limit and more are
// all given as limit, which saves most of the computation for words that are far from each other.
// Costs is an array of b.length + 1 or more numbers that may be reused for further calls
fun levenshteinDistance(a: String, b: String, limit: Int, costs: IntArray = IntArray(b.length + 1)): Int {
    if (abs(a.length - b.length) >= limit) {
        return limit
    }
    for (j in 0..b.length)
        costs[j] = j
    for (i in 1..a.length) {
        costs[0] = i
        var nw = i - 1
        var rowMin = i
        for (j in 1..b.length) {
            val cj = min(1 + min(costs[j], costs[j - 1]), if (a[i - 1] == b[j - 1]) nw else nw + 1)
            nw = costs[j]
            costs[j] = cj
            rowMin = min(rowMin, cj)
        }
        // Numbers of the following rows are never lower than the lowest one of this row
        if (rowMin >= limit) {
            return limit
        }
    }
    return min(costs[b.length], limit)
}

fun hammingDistance(aInput: String, bInput: String): Int {
    val a = aInput.lowercase(Locale.ENGLISH)
    val b = bInput.lowercase(Locale.ENGLISH)
    var counter = 0
    for (i in a.indices) {
        if (a[i] != b[i]) {
            ++counter
        }
    }
    return counter
}
