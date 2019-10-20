package cz.civilizacehra.cipherbreaker

import android.content.Context

import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.util.*
import java.util.regex.Pattern
import java.util.regex.PatternSyntaxException
import kotlin.math.min

data class DictInfo(val name: String, val size: Int)
data class QueryParams(val modeId: Int, val minLength: Int, val maxLength: Int)

typealias UpdateProgress = suspend (progress: Int, nMatches: Int, time: Double) -> Unit
typealias ToastIt = suspend (text: String) -> Unit
data class UiHandlers(val toastIt: ToastIt, val updateProgress: UpdateProgress)

internal open class Dictionary(private val mContext: Context) {

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
    val mMaxNumberOfResults = 1000
    private val mList = ArrayList<String>(2 * mMaxNumberOfResults)
    var mStartTime: Long = 0
    private var mShouldSort = false

    open suspend fun findResults(input: String, queryParams: QueryParams, dictInfo: DictInfo,
                                 uiHandlers: UiHandlers): String {
        mShouldSort = queryParams.modeId in 3..4
        prepare()
        findResultsInternal(input, queryParams, dictInfo, uiHandlers)
        return conclude(uiHandlers.updateProgress)
    }

    suspend fun findResultsInternal(input: String, queryParams: QueryParams, dictInfo: DictInfo,
                                    uiHandlers: UiHandlers) {

        val modeId = queryParams.modeId
        val minLength = queryParams.minLength
        val maxLength = queryParams.maxLength

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
            uiHandlers.toastIt("No mode selected")
            return
        }

        val pattern = try {
            Pattern.compile(input)
        } catch (e: PatternSyntaxException) {
            uiHandlers.toastIt("Invalid regex syntax")
            return
        }

        val charCount = IntArray(26)
        if (countMode) {
            for (c in input) {
                val position = c - '0'
                when {
                    position > 9 -> {
                        uiHandlers.toastIt("Invalid input letter \"$c\". Aborting caclulation")
                        return
                    }
                    position >= counts!!.size -> {
                        uiHandlers.toastIt("Only numbers up to ${counts.size} are usable in this mode. Aborting caclulation")
                        return
                    }
                    counts[position].isEmpty() -> {
                        uiHandlers.toastIt("$position has no assigned letters in this mode. Aborting caclulation")
                        return
                    }
                    else -> countValues!!.add(position)
                }
            }
        } else if (!regex and !hamming) {
            for (c in input) {
                val position = c - 'a'
                if (position in 0..25) {
                    ++charCount[position]
                } else {
                    uiHandlers.toastIt("Invalid input letter \"$c\"")
                }
            }
        }

        try {
            val inputStream = mContext.assets.open(dictInfo.name)
            val `in` = BufferedReader(InputStreamReader(inputStream))
            var line: String?
            var lineCounter = 0
            val totalSize = dictInfo.size
            var lastUpdate = System.currentTimeMillis()
            var assertInvalidLetters = true

            while (true) {
                ++lineCounter
                if (lineCounter % 10000 == 0) {
                    val time = System.currentTimeMillis()
                    if (time - lastUpdate > 100) {
                        lastUpdate = time
                        val progress = (100 * lineCounter / totalSize)
                        uiHandlers.updateProgress(progress, resultsSize(), computationTime())
                    }
                }

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
                    if (pattern.matcher(first).matches()) {
                        matched(word.second!!)
                    }
                } else if (hamming) {
                    val d = hammingDistance(first, input)
                    if (d < 6) {
                        matched("($d) ${word.second}")
                    }
                } else if (levenshtein) {
                    val d = levenshteinDistance(first, input)
                    if (d < 6) {
                        matched("($d) ${word.second}")
                    }
                } else if (countMode) {
                    var allSatisfy = true
                    for (i in first.indices) {
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
                    for (c in first) {
                        val position = c - 'a'
                        if (position in 0..25) {
                            ++chars[position]
                        } else {
                            if (assertInvalidLetters && c != ' ' && (c < '0' || c > '9')) {
                                uiHandlers.toastIt("Invalid letter in dictionary \"$c\" in $word")
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
            uiHandlers.toastIt("Error loading dictionary file")
        }

    }

    protected open fun prepare() {
        mList.clear()
        mStartTime = System.currentTimeMillis()
    }

    protected open fun matched(match: String) {
        mList.add(match)
        if (mList.size >= 2 * mMaxNumberOfResults) {
            if (mShouldSort) {
                mList.sort()
            }
            val tempList = mList.take(mMaxNumberOfResults)
            mList.clear()
            for (value in tempList) {
                mList.add(value)
            }
        }
    }

    protected open suspend fun conclude(updateProgress: UpdateProgress): String {
        val resultStr = StringBuilder()
        var counter = 0
        if (mShouldSort) {
            mList.sort()
        }
        for (point in mList) {
            ++counter
            val row = point + "\n"
            resultStr.append(row)
            if (counter >= mMaxNumberOfResults) {
                break
            }
        }
        updateProgress(100, resultsSize(), computationTime())
        return resultStr.toString()
    }

    fun computationTime(): Double {
        return (System.currentTimeMillis() - mStartTime) / 1000.0
    }

    open fun resultsSize(): Int {
        return min(mList.size, mMaxNumberOfResults)
    }
}
