package cz.civilizacehra.cipherbreaker

import com.google.android.gms.maps.model.LatLng
import org.junit.Assert.assertEquals
import org.junit.Test

class UtilsTest {

    @Test
    fun parseIntWithDefaultParsesIntegers() {
        assertEquals(42, Utils.parseIntWithDefault("42"))
        assertEquals(-7, Utils.parseIntWithDefault("-7"))
        assertEquals(0, Utils.parseIntWithDefault("0", 5))
    }

    @Test
    fun parseIntWithDefaultFallsBackOnInvalidInput() {
        assertEquals(0, Utils.parseIntWithDefault(""))
        assertEquals(5, Utils.parseIntWithDefault("", 5))
        assertEquals(5, Utils.parseIntWithDefault("abc", 5))
        assertEquals(5, Utils.parseIntWithDefault("4.2", 5))
        assertEquals(5, Utils.parseIntWithDefault(" 1", 5))
    }

    @Test
    fun parseIntWithDefaultFallsBackOnOverflow() {
        assertEquals(2147483647, Utils.parseIntWithDefault("2147483647", 5))
        assertEquals(5, Utils.parseIntWithDefault("2147483648", 5))
        assertEquals(5, Utils.parseIntWithDefault("99999999999", 5))
        assertEquals(5, Utils.parseIntWithDefault("-99999999999", 5))
    }

    @Test
    fun formatCoordUsesFiveDecimals() {
        assertEquals("50.12346", Utils.formatCoord(50.123456))
        assertEquals("14.00000", Utils.formatCoord(14.0))
        assertEquals("-0.50000", Utils.formatCoord(-0.5))
    }

    @Test
    fun formatLatLngJoinsLatitudeAndLongitude() {
        assertEquals("50.08335, 14.39509", Utils.formatLatLng(LatLng(50.0833514, 14.3950931)))
    }
}
