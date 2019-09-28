package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.location.Location
import java.util.*

import kotlin.math.round

internal class MapDictionary(context: Context) : Dictionary(context) {
    private var mLocation: Location? = null
    private val mSortedResults = ArrayList<Point>(2 * mMaxNumberOfResults)

    private var mSuffix: String? = null
    private val mWorldSides = arrayOf("s", "sv", "sz", "v", "z", "j", "jv", "jz")
    private var mSvjz: Boolean = false

    internal inner class Point(var distance: Float, var name: String) : Comparable<Point> {

        override fun compareTo(other: Point): Int {
            return if (this.distance != other.distance) {
                this.distance.compareTo(other.distance)
            } else {
                this.name.compareTo(other.name)
            }
        }
    }

    fun setSvjz(svjz: Boolean) {
        mSvjz = svjz
    }

    fun setLocation(location: Location) {
        mLocation = location
    }

    override fun findResults(input: String, modeId: Int, minLength: Int, maxLength: Int,
                             dictFilename: String): String {
        prepare()

        setSuffix("")
        findResultsInternal(input, modeId, minLength, maxLength, dictFilename)
        if (mSvjz) {
            for (s in mWorldSides) {
                processWithWorldSide(input, s, modeId, minLength, maxLength, dictFilename)
            }
        }

        return conclude()
    }

    override fun prepare() {
        mSortedResults.clear()
        mStartTime = System.currentTimeMillis()
    }

    override fun matched(match: String) {

        val split = match.split(";".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
        var lat = .0
        var lon = .0
        val name = split[0] + mSuffix!!
        if (split.size >= 3) {
            lat = split[split.size - 2].toDouble()
            lon = split[split.size - 1].toDouble()
        }
        var distance = .0f
        if (mLocation != null) {
            val targetLocation = Location("")
            targetLocation.latitude = lat
            targetLocation.longitude = lon
            distance = mLocation!!.distanceTo(targetLocation)
        }
        mSortedResults.add(Point(distance, name))
        if (mSortedResults.size >= 2 * mMaxNumberOfResults) {
            mSortedResults.sort()
            val tempList = mSortedResults.take(mMaxNumberOfResults)
            mSortedResults.clear()
            for (value in tempList) {
                mSortedResults.add(value)
            }
        }
    }

    override fun conclude(): String {
        val resultStr = StringBuilder()
        var counter = 0
        mSortedResults.sort()
        for (point in mSortedResults) {
            ++counter
            val row = point.name + " (${round(point.distance).toInt()}m)\n"
            resultStr.append(row)
            if (counter >= mMaxNumberOfResults) {
                break
            }
        }
        return "Result: ($counter)${computationTime()}\n$resultStr"
    }

    private fun setSuffix(s: String) {
        mSuffix = if (s.isNotEmpty()) " (${s.toUpperCase(Locale.ENGLISH)})"  else  ""
    }

    private fun processWithWorldSide(input: String, s: String, modeId: Int,
                                     minLength: Int, maxLength: Int, dictFilename: String) {
        val arr = s.split("".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
        var contains = true
        for (c in arr) {
            if (!input.contains(c)) {
                contains = false
            }
        }
        if (contains) {
            var modified = input
            for (c in arr) {
                modified = modified.replaceFirst(c.toRegex(), "")
            }
            setSuffix(s)
            findResultsInternal(modified, modeId, minLength, maxLength, dictFilename)
        }
    }
}
