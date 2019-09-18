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
        if (!(subset xor exact xor superset xor regex xor hamming xor levenshtein)) {
            Utils.toastIt(mContext, "No mode selected")
            return
        }

        var matcher: Matcher
        val pattern = Pattern.compile(input)

        val charCount = IntArray(26)
        if (!regex and !hamming) {
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
