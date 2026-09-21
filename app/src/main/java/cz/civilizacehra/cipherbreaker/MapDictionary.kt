package cz.civilizacehra.cipherbreaker

import android.location.Location
import java.io.InputStream
import kotlin.math.min

import kotlin.math.round

internal class MapDictionary(openDictionary: (String) -> InputStream) : Dictionary(openDictionary) {
    private var mLocation: Location? = null
    private val mSortedResults = ArrayList<Point>(2 * mMaxNumberOfResults)

    internal inner class Point(var distance: Float, var name: String) : Comparable<Point> {

        override fun compareTo(other: Point): Int {
            return if (this.distance != other.distance) {
                this.distance.compareTo(other.distance)
            } else {
                this.name.compareTo(other.name)
            }
        }
    }

    fun setLocation(location: Location) {
        mLocation = location
    }

    // Lines are name;lat;lon, names are without semicolons
    override fun name(line: String): String {
        return line.substringBefore(';')
    }

    override fun prepare() {
        mSortedResults.clear()
        mStartTime = System.currentTimeMillis()
    }

    override fun matched(match: String) {

        val split = match.split(";".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
        var lat = .0
        var lon = .0
        val name = split[0]
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

    override suspend fun conclude(): String {
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
        return resultStr.toString()
    }

    override fun resultsSize(): Int {
        return min(mSortedResults.size, mMaxNumberOfResults)
    }
}
