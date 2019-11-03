package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.content.Intent
import android.location.Location
import android.net.Uri
import android.os.Bundle
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.RelativeLayout
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

import java.util.Objects
import kotlin.math.*

class AzimutherActivity : LocationActivity(), OnMapReadyCallback {

    private var mMap: GoogleMap? = null
    private var mPosition: LatLng? = null
    private var mDestination: LatLng? = null

    private val distEditText by lazy { findViewById<EditText>(R.id.distanceEditText) }
    private val angleEditText by lazy { findViewById<EditText>(R.id.angleEditText) }

    private val positionTextView by lazy { findViewById<TextView>(R.id.positionCoordinatesView) }
    private val currentLocationIcon by lazy { findViewById<RelativeLayout>(R.id.currLocationIconLayout) }

    private val resultTextView by lazy { findViewById<TextView>(R.id.resultCoordinatesView) }
    private val resultLayout by lazy { findViewById<RelativeLayout>(R.id.resultDescriptionLayout) }
    private val clipboardIcon by lazy { findViewById<RelativeLayout>(R.id.clipboardIconLayout) }
    private val mapyIcon by lazy { findViewById<RelativeLayout>(R.id.mapyIconLayout) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_azimuther)
        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        val mapFragment = supportFragmentManager
                .findFragmentById(R.id.azimutherMap) as SupportMapFragment?
        Objects.requireNonNull(mapFragment!!).getMapAsync(this)

        currentLocationIcon.setOnClickListener { acquireLocation() }

        val onEdit = TextView.OnEditorActionListener { v, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                val imm = v.context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.hideSoftInputFromWindow(v.windowToken, 0)
                if (mPosition != null) {
                    setLocation()
                } else {
                    val msg = "Set starting location either by clicking in map or by getting your current location"
                    applicationContext.toastIt(msg)
                }
                return@OnEditorActionListener true
            }
            false
        }

        distEditText.setOnEditorActionListener(onEdit)
        angleEditText.setOnEditorActionListener(onEdit)

        resultLayout.setOnClickListener {
            if (mDestination != null) {
                applicationContext.copyToClipboard("Coordinates", Utils.formatLatLng(mDestination!!))
            }
        }

        clipboardIcon.setOnClickListener {
            if (mDestination != null) {
                applicationContext.copyToClipboard("Coordinates", Utils.formatLatLng(mDestination!!))
            } else {
                applicationContext.toastIt("Destination not set")
            }
        }

        mapyIcon.setOnClickListener {
            if (mDestination != null) {
                val lat = Utils.formatCoord(mDestination!!.latitude)
                val lon = Utils.formatCoord(mDestination!!.longitude)
                val url = "https://en.mapy.cz/zakladni?x=$lon&y=$lat&z=17&source=coor&id=$lon%2C$lat"
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            } else {
                applicationContext.toastIt("Destination not set")
            }
        }
    }

    private fun setLocation(move: Boolean = true) {
        positionTextView.text = Utils.formatLatLng(mPosition!!)
        val lat = mPosition!!.latitude
        val lon = mPosition!!.longitude
        val dist = getDouble(distEditText)
        val angle = getDouble(angleEditText)
        if (!lat.isNaN() && !lon.isNaN()) {
            mMap!!.clear()
            val loc = LatLng(lat, lon)
            mMap!!.addMarker(MarkerOptions().position(loc).title("Start").icon(
                    BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)))

            if (!dist.isNaN() && !angle.isNaN()) {
                val dest = computeLatLng(lat, lon, dist, angle)
                mDestination = dest
                resultTextView.text = Utils.formatLatLng(dest)

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
            applicationContext.toastIt("Set new starting location")
        }
        mMap!!.uiSettings.isRotateGesturesEnabled = false
    }

    override fun onLocationChanged(location: Location) {
        setLatLon(location.latitude, location.longitude, true)
        super.onLocationChanged(location)
    }

    private fun setLatLon(latitude: Double, longitude: Double, move: Boolean) {
        mPosition = LatLng(latitude, longitude)
        setLocation(move)
    }
}
