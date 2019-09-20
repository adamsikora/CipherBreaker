package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.widget.TextView

import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.util.*
import java.util.regex.Matcher
import java.util.regex.Pattern
import kotlin.math.min

internal open class Dictionary(private val mContext: Context, private val mFilename: String, var mResults: TextView) {

    private val mCountsLists = arrayOf(
            arrayOf( // Morse
                    "", // 0
                    "et", // 1
                    "aimn", // 2
                    "dgkorsuw", // 3
                    "bcfhjlpqvxyz" //4
            ),
            arrayOf( // Braille
                    "", // 0
                    "a", // 1
                    "bceik", // 2
                    "dfhjlmosu", // 3
                    "gnprtvxz", // 4
                    "qwy" // 5
            ),
            arrayOf( // Segments
                    "", // 0
                    "", // 1
                    "ir", // 2
                    "clnu", // 3
                    "fhjoty", // 4
                    "bdegkmpqsvxz", // 5
                    "aw" // 6
            ),
            arrayOf( // Moves
                    "", // 0
                    "i", // 1
                    "cjltvx", // 2
                    "acdfhjknpsuyz", // 3
                    "egmorw", // 4
                    "bqs" // 5
            ),
            arrayOf( // Holes
                    "cefghijklmnstuvwxyz", // 0
                    "adopqr", // 1
                    "b" // 2
            ),
            arrayOf( // Ends
                    "bdo", // 0
                    "p", // 1
                    "acgijlmnqrsuvwz", // 2
                    "efty", // 3
                    "hkx" // 4
            )
    )
    private val mList = ArrayList<String>()
    var mStartTime: Long = 0

    open fun findResults(input: String, modeId: Int, minLength: Int, maxLength: Int) {
        prepare()
        findResults_impl(input, modeId, minLength, maxLength)
        conclude(modeId in 3..4)
    }

    fun findResults_impl(input: String, modeId: Int, minLength: Int, maxLength: Int) {

        val regex = modeId == 0
        val subset = modeId == 1
        val exact = modeId == 2
        val superset = modeId == 3
        val hamming = modeId == 4
        val levenshtein = modeId == 5
        val countMode = modeId >= 6
        val counts = if (countMode) mCountsLists[modeId - 6] else null
        val countValues = if (countMode) ArrayList<Int>() else null
        if (!(subset xor exact xor superset xor regex xor hamming xor levenshtein xor countMode)) {
            Utils.toastIt(mContext, "No mode selected")
            return
        }

        var matcher: Matcher
        val pattern = Pattern.compile(input)

        val charCount = IntArray(26)
        if (countMode) {
            for (i in 0 until input.length) {
                val c = input[i]
                val position = c - '0'
                if (position > 9) {
                    Utils.toastIt(mContext, "Invalid input letter \"$c\". Aborting caclulation")
                    return
                } else if (position >= counts!!.size) {
                    Utils.toastIt(mContext, "Only numbers up to ${counts.size} are usable in this mode. Aborting caclulation")
                    return
                } else if (counts[position].isEmpty()) {
                    Utils.toastIt(mContext, "$position has no assigned letters in this mode. Aborting caclulation")
                    return
                } else {
                    countValues!!.add(position)
                }
            }
        } else if (!regex and !hamming) {
            for (i in 0 until input.length) {
                val c = input[i]
                val position = c - 'a'
                if (position in 0..25) {
                    ++charCount[position]
                } else {
                    Utils.toastIt(mContext, "Invalid input letter \"$c\"")
                }
            }
        }

        try {
            val inputStream = mContext.assets.open(mFilename)
            val `in` = BufferedReader(InputStreamReader(inputStream))
            var line: String?
            var assertInvalidLetters = true

            while (true) {
                line = `in`.readLine()
                if (line == null) {
                    break
                }
                val word = StringPair.fromString(line)
                val first = word.first

                if (subset && first!!.length > input.length
                        || superset && first!!.length < input.length
                        || exact && first!!.length != input.length
                        || hamming && first!!.length != input.length
                        || countMode && first!!.length != input.length
                        || first!!.length < minLength || first.length > maxLength) {
                    continue
                }
                if (regex) {
                    matcher = pattern.matcher(first)
                    if (matcher.matches()) {
                        matched(word.second!!)
                    }
                } else if (hamming) {
                    var counter = 0
                    for (i in 0 until first.length) {
                        if (first[i] != input[i]) {
                            ++counter
                        }
                    }
                    if (counter < 6) {
                        matched("(" + counter + ") " + word.second)
                    }
                } else if (levenshtein) {
                    val d = levenshteinDistance(first, input)
                    if (d < 6) {
                        matched("(" + d + ") " + word.second)
                    }
                } else if (countMode) {
                    var allSatisfy = true
                    for (i in 0 until first.length) {
                        if (!counts!![countValues!![i]].contains(first[i])) {
                            allSatisfy = false
                            break
                        }
                    }
                    if (allSatisfy) {
                        matched(word.second!!)
                    }
                } else {
                    val chars = IntArray(26)
                    for (i in 0 until first.length) {
                        val c = first[i]
                        val position = c - 'a'
                        if (position in 0..25) {
                            ++chars[position]
                        } else {
                            // TODO map dictionaries contain invalid letters figure out a way to deal with it
                            if (assertInvalidLetters && c != ' ' && (c < '0' || c > '9')) {
                                Utils.toastIt(mContext, "Invalid letter in dictionary \"$c\"")
                                assertInvalidLetters = false
                            }
                        }
                    }
                    for (i in 0..25) {
                        if (subset && charCount[i] < chars[i]) {
                            break
                        }
                        if (exact && charCount[i] != chars[i]) {
                            break
                        }
                        if (superset && charCount[i] > chars[i]) {
                            break
                        }
                        if (i == 26 - 1) {
                            matched(word.second!!)
                        }
                    }
                }
            }
        } catch (e: IOException) {
            Utils.toastIt(mContext, "Error loading dictionary file")
        }

    }

    private fun levenshteinDistance(aInput: String, bInput: String): Int {
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

    protected open fun prepare() {
        mList.clear()
        mStartTime = System.currentTimeMillis()
    }

    protected open fun matched(match: String) {
        mList.add(match)
    }

    protected open fun conclude(sort: Boolean) {
        val resultStr = StringBuilder()
        var counter = 0
        if (sort) {
            mList.sort()
        }
        for (point in mList) {
            ++counter
            val row = point + "\n"
            resultStr.append(row)
            if (counter >= 3000) {
                break
            }
        }
        mResults.text = "Result: ($counter)${computationTime()}\n$resultStr"
    }

    fun computationTime(): String {
        return "  " + (System.currentTimeMillis() - mStartTime) / 1000.0 + "s "
    }
}
