package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.location.Location
import android.widget.TextView
import java.util.*

import kotlin.math.round

internal class MapDictionary(context: Context, filename: String, results: TextView) : Dictionary(context, filename, results) {
    private var mLocation: Location? = null
    private val mSortedResults = ArrayList<Point>()

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

    init {
        mSvjz = false
    }

    fun setSvjz(svjz: Boolean) {
        mSvjz = svjz
    }

    fun setLocation(location: Location) {
        mLocation = location
    }

    override fun findResults(input: String, modeId: Int, minLength: Int, maxLength: Int) {

        prepare()

        setSuffix("")
        findResults_impl(input, modeId, minLength, maxLength)
        if (mSvjz) {
            for (s in mWorldSides) {
                processWithWorldSide(input, s, modeId, minLength, maxLength)
            }
        }

        conclude(false)
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
    }

    override fun conclude(sort: Boolean) {
        val resultStr = StringBuilder()
        var counter = 0
        mSortedResults.sort()
        for (point in mSortedResults) {
            ++counter
            val row = point.name + " (${round(point.distance).toInt()}m)\n"
            resultStr.append(row)
            if (counter >= 3000) {
                break
            }
        }
        mResults.text = "Result: ($counter)${computationTime()}\n$resultStr"
    }

    private fun setSuffix(s: String) {
        mSuffix = if (s.isNotEmpty()) " (${s.toUpperCase(Locale.ENGLISH)})"  else  ""
    }

    private fun processWithWorldSide(input: String, s: String, modeId: Int, minLength: Int, maxLength: Int) {
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
            findResults_impl(modified, modeId, minLength, maxLength)
        }
    }
}
