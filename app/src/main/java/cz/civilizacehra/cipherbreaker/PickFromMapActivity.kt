package cz.civilizacehra.cipherbreaker

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.fragment.app.FragmentActivity

import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions

import java.util.Objects

class PickFromMapActivity : FragmentActivity(), OnMapReadyCallback {

    private var mMap: GoogleMap? = null
    private var mPosition: LatLng? = null

    private val positionTextView by lazy { findViewById<TextView>(R.id.positionCoordinatesView) }
    private val confirmButton by lazy { findViewById<Button>(R.id.confirmButton) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pick_from_map)

        val bundle = intent.extras
        if (bundle != null) {
            val lat = bundle.getDouble("latitude")
            val lon = bundle.getDouble("longitude")
            if (lat != 0.0 && lon != 0.0) {
                mPosition = LatLng(lat, lon)
            }
        }

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        val mapFragment = supportFragmentManager
                .findFragmentById(R.id.azimutherMap) as SupportMapFragment?
        Objects.requireNonNull(mapFragment!!).getMapAsync(this)

        confirmButton.setOnClickListener{
            if (mPosition != null) {
                val intent = Intent()
                intent.putExtra("selectedLatitude", mPosition!!.latitude)
                intent.putExtra("selectedLongitude", mPosition!!.longitude)
                setResult(RESULT_OK, intent)
                finish()
            } else {
                applicationContext.toastIt("No position selected")
            }
        }
    }

    private fun setLocation(move: Boolean = true) {
        if (mPosition != null) {
            positionTextView.text = Utils.formatLatLng(mPosition!!)
            mMap!!.clear()
            mMap!!.addMarker(MarkerOptions().position(mPosition!!).icon(
                    BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)))

            if (move) {
                mMap!!.moveCamera(CameraUpdateFactory.newLatLngZoom(mPosition!!, 16.toFloat()))
            }
        }
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
            mPosition = latLng
            setLocation(false)
            applicationContext.toastIt("Set new starting location")
        }
        mMap!!.uiSettings.isRotateGesturesEnabled = false

        if (mPosition != null) {
            setLocation(true)
        }
    }
}
