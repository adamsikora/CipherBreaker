package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.location.Location
import android.os.Bundle
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.TextView

import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.maps.model.PolylineOptions

import java.util.Locale
import java.util.Objects
import kotlin.math.*

class AzimutherActivity : LocationActivity(), OnMapReadyCallback {

    private var mMap: GoogleMap? = null

    private val latEditText by lazy {findViewById<EditText>(R.id.latitudeEditText)}
    private val lonEditText by lazy {findViewById<EditText>(R.id.longitudeEditText)}
    private val distEditText by lazy {findViewById<EditText>(R.id.distanceEditText)}
    private val angleEditText by lazy {findViewById<EditText>(R.id.angleEditText)}
    private val currentLocationButton by lazy {findViewById<Button>(R.id.currBtn)}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_azimuther)
        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        val mapFragment = supportFragmentManager
                .findFragmentById(R.id.azimutherMap) as SupportMapFragment?
        Objects.requireNonNull(mapFragment!!).getMapAsync(this)

        currentLocationButton.setOnClickListener { acquireLocation() }


        val onEdit = TextView.OnEditorActionListener { v, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                val imm = v.context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.hideSoftInputFromWindow(v.windowToken, 0)
                setLocation()
                return@OnEditorActionListener true
            }
            false
        }

        latEditText.setOnEditorActionListener(onEdit)
        lonEditText.setOnEditorActionListener(onEdit)
        distEditText.setOnEditorActionListener(onEdit)
        angleEditText.setOnEditorActionListener(onEdit)
    }

    private fun setLocation(move: Boolean = true) {
        val lat = getDouble(latEditText)
        val lon = getDouble(lonEditText)
        val dist = getDouble(distEditText)
        val angle = getDouble(angleEditText)
        if (!lat.isNaN() && !lon.isNaN()) {
            mMap!!.clear()
            val loc = LatLng(lat, lon)
            mMap!!.addMarker(MarkerOptions().position(loc).title("Start").icon(
                    BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)))

            if (!dist.isNaN() && !angle.isNaN()) {
                val dest = computeLatLng(lat, lon, dist, angle)
                mMap!!.addMarker(MarkerOptions().position(dest).title("Destination"))
                mMap!!.addPolyline(PolylineOptions().color(-0x10000).add(loc, dest))
                if (move) {
                    val southWest = LatLng(
                            min(loc.latitude, dest.latitude),
                            min(loc.longitude, dest.longitude))
                    val northEast = LatLng(
                            max(loc.latitude, dest.latitude),
                            max(loc.longitude, dest.longitude))
                    val bounds = LatLngBounds(southWest, northEast)
                    mMap!!.moveCamera(CameraUpdateFactory.newLatLngBounds(bounds, 300))
                }
            } else if (move) {
                mMap!!.moveCamera(CameraUpdateFactory.newLatLngZoom(loc, 16.toFloat()))
            }
        }
    }

    private fun getDouble(et: EditText): Double {
        return try {
            et.text.toString().toDouble()
        } catch (e: NumberFormatException) {
            Double.NaN
        }

    }

    private fun computeLatLng(lat: Double, lon: Double, distance: Double, angle: Double): LatLng {
        val distRatio = distance / 6371000
        val radAngle = toRad(angle)
        val radLat = toRad(lat)
        val radLon = toRad(lon)

        val newLat = asin(sin(radLat) * cos(distRatio) + cos(radLat) * sin(distRatio) * cos(radAngle))

        val newLon = radLon + atan2(sin(radAngle) * sin(distRatio) * cos(radLat),
                cos(distRatio) - sin(radLat) * sin(newLat))

        return LatLng(toDeg(newLat), toDeg(newLon))
    }

    private fun toRad(degrees: Double): Double {
        return degrees * Math.PI / 180
    }


    private fun toDeg(radians: Double): Double {
        return radians * 180 / Math.PI
    }


    /**
     * Manipulates the map once available.
     * This callback is triggered when the map is ready to be used.
     * This is where we can add markers or lines, add listeners or move the camera.
     * If Google Play services is not installed on the device, the user will be prompted to install
     * it inside the SupportMapFragment. This method will only be triggered once the user has
     * installed Google Play services and returned to the app.
     */
    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap

        mMap!!.setOnMapLongClickListener { latLng ->
            setLatLon(latLng.latitude, latLng.longitude, false)
            Utils.toastIt(applicationContext, "Set new starting location")
        }
        mMap!!.uiSettings.isRotateGesturesEnabled = false
    }

    override fun onLocationChanged(location: Location) {
        setLatLon(location.latitude, location.longitude, true)
        super.onLocationChanged(location)
    }

    private fun setLatLon(latitude: Double, longitude: Double, move: Boolean) {
        latEditText.setText(String.format(Locale.ENGLISH, "%.7f", latitude))
        lonEditText.setText(String.format(Locale.ENGLISH, "%.7f", longitude))
        setLocation(move)
    }
}
