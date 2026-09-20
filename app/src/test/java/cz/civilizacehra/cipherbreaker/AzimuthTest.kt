package cz.civilizacehra.cipherbreaker

import org.junit.Assert.assertEquals
import org.junit.Test

class AzimuthTest {
    // Roughly a centimeter
    private val delta = 1e-7

    private fun assertDestination(expectedLat: Double, expectedLon: Double,
                                  lat: Double, lon: Double, distance: Double, angle: Double) {
        val (destLat, destLon) = Azimuth.destination(lat, lon, distance, angle)
        assertEquals(expectedLat, destLat, delta)
        assertEquals(expectedLon, destLon, delta)
    }

    @Test
    fun zeroDistanceStaysInPlace() {
        assertDestination(50.0, 14.0, 50.0, 14.0, 0.0, 0.0)
        assertDestination(50.0, 14.0, 50.0, 14.0, 0.0, 123.0)
    }

    @Test
    fun cardinalDirections() {
        assertDestination(50.0089932, 14.0, 50.0, 14.0, 1000.0, 0.0)
        assertDestination(49.9999992, 14.0139910, 50.0, 14.0, 1000.0, 90.0)
        assertDestination(49.9910068, 14.0, 50.0, 14.0, 1000.0, 180.0)
        assertDestination(49.9999992, 13.9860090, 50.0, 14.0, 1000.0, 270.0)
    }

    @Test
    fun fullCircleIsNorth() {
        assertDestination(50.0089932, 14.0, 50.0, 14.0, 1000.0, 360.0)
    }

    @Test
    fun generalAzimuth() {
        assertDestination(50.0063587, 14.0098944, 50.0, 14.0, 1000.0, 45.0)
        assertDestination(50.0821268, 14.3980316, 50.0833514, 14.3950931, 250.0, 123.0)
    }

    @Test
    fun quarterOfTheGlobe() {
        val quarter = 6371000 * Math.PI / 2
        assertDestination(90.0, 0.0, 0.0, 0.0, quarter, 0.0)
        assertDestination(0.0, 90.0, 0.0, 0.0, quarter, 90.0)
    }
}
