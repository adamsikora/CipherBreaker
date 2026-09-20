package cz.civilizacehra.cipherbreaker

import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

internal object Azimuth {
    private const val EARTH_RADIUS_METERS = 6371000

    /**
     * Returns latitude and longitude of the point reached from given position
     * after travelling given distance (in meters) under given azimuth (in degrees).
     */
    fun destination(lat: Double, lon: Double, distance: Double, angle: Double): Pair<Double, Double> {
        val distRatio = distance / EARTH_RADIUS_METERS
        val radAngle = toRad(angle)
        val radLat = toRad(lat)
        val radLon = toRad(lon)

        val newLat = asin(sin(radLat) * cos(distRatio) + cos(radLat) * sin(distRatio) * cos(radAngle))

        val newLon = radLon + atan2(sin(radAngle) * sin(distRatio) * cos(radLat),
                cos(distRatio) - sin(radLat) * sin(newLat))

        return Pair(toDeg(newLat), toDeg(newLon))
    }

    private fun toRad(degrees: Double): Double {
        return degrees * Math.PI / 180
    }

    private fun toDeg(radians: Double): Double {
        return radians * 180 / Math.PI
    }
}
